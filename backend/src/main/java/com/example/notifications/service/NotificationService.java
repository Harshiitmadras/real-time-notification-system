package com.example.notifications.service;

import com.example.notifications.model.Notification;
import com.example.notifications.model.NotificationStatus;
import com.example.notifications.repository.NotificationRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

/**
 * Core service for notification lifecycle management.
 *
 * Architecture:
 * - PostgreSQL: source of truth for all notifications
 * - Redis: caches unread counts per user (with DB fallback if Redis is down)
 * - WebSocket (STOMP): pushes notifications to connected clients in realtime
 * - Idempotency: enforced via unique DB constraint on idempotencyKey
 * - Retry: @Scheduled job retries FAILED deliveries every 30 seconds
 */
@Service
@Slf4j
public class NotificationService {

    private final NotificationRepository repository;
    private final SimpMessagingTemplate messagingTemplate;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String UNREAD_COUNT_KEY_PREFIX = "unread_count:";

    public NotificationService(NotificationRepository repository,
                               SimpMessagingTemplate messagingTemplate,
                               RedisTemplate<String, Object> redisTemplate) {
        this.repository = repository;
        this.messagingTemplate = messagingTemplate;
        this.redisTemplate = redisTemplate;
    }

    @Transactional
    public Notification createNotification(String userId, Notification notification) {
        // Idempotency: return existing if duplicate key
        Optional<Notification> existing = repository.findByIdempotencyKey(notification.getIdempotencyKey());
        if (existing.isPresent()) {
            log.info("Duplicate notification detected for idempotencyKey={}", notification.getIdempotencyKey());
            return existing.get();
        }

        notification.setUserId(userId);
        notification.setRead(false);
        notification.setStatus(NotificationStatus.PENDING);
        Notification saved = repository.save(notification);

        incrementUnreadCount(userId);
        deliverViaWebSocket(saved);

        return saved;
    }

    public Page<Notification> getUserNotifications(String userId, Pageable pageable) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    @Transactional
    public Notification markAsRead(String id, String userId) {
        Notification notification = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found: " + id));

        if (!notification.getUserId().equals(userId)) {
            throw new SecurityException("Unauthorized access to notification: " + id);
        }

        if (!notification.isRead()) {
            notification.setRead(true);
            repository.save(notification);
            decrementUnreadCount(userId);
        }
        return notification;
    }

    /**
     * Returns unread count from Redis cache, falling back to DB if Redis is unavailable.
     * This is the key resilience pattern: Redis crash does NOT break the system.
     */
    public int getUnreadCount(String userId) {
        String key = UNREAD_COUNT_KEY_PREFIX + userId;
        try {
            Object count = redisTemplate.opsForValue().get(key);
            if (count != null) {
                return Integer.parseInt(count.toString());
            }
        } catch (Exception e) {
            log.warn("Redis unavailable for unread count, falling back to DB", e);
        }

        // Cache miss or Redis down: query DB and try to repopulate cache
        int dbCount = repository.countByUserIdAndIsReadFalse(userId);
        try {
            redisTemplate.opsForValue().set(key, String.valueOf(dbCount), 1, TimeUnit.HOURS);
        } catch (Exception ignored) {
            // Redis still down, no worries - we have the DB value
        }
        return dbCount;
    }

    private void incrementUnreadCount(String userId) {
        String key = UNREAD_COUNT_KEY_PREFIX + userId;
        try {
            redisTemplate.opsForValue().increment(key);
            redisTemplate.expire(key, 1, TimeUnit.HOURS);
        } catch (Exception e) {
            log.warn("Failed to increment unread count in Redis for user {}", userId, e);
        }
    }

    private void decrementUnreadCount(String userId) {
        String key = UNREAD_COUNT_KEY_PREFIX + userId;
        try {
            Long count = redisTemplate.opsForValue().decrement(key);
            if (count != null && count < 0) {
                redisTemplate.opsForValue().set(key, "0");
            }
        } catch (Exception e) {
            log.warn("Failed to decrement unread count in Redis for user {}", userId, e);
        }
    }

    private void deliverViaWebSocket(Notification notification) {
        try {
            redisTemplate.convertAndSend(com.example.notifications.config.RedisConfig.NOTIFICATION_TOPIC, notification);
            notification.setStatus(NotificationStatus.DELIVERED);
            repository.save(notification);
        } catch (Exception e) {
            log.error("Failed to publish notification {} to Redis", notification.getId(), e);
            notification.setStatus(NotificationStatus.FAILED);
            repository.save(notification);
        }
    }

    /** Retry FAILED notifications every 30 seconds */
    @Scheduled(fixedDelay = 30000)
    @Transactional
    public void retryFailedNotifications() {
        List<Notification> failed = repository.findByStatus(NotificationStatus.FAILED);
        if (!failed.isEmpty()) {
            log.info("Retrying {} failed notifications", failed.size());
            failed.forEach(this::deliverViaWebSocket);
        }
    }
}
