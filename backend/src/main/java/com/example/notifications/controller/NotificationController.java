package com.example.notifications.controller;

import com.example.notifications.model.CreateNotificationRequest;
import com.example.notifications.model.Notification;
import com.example.notifications.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST API for notification management.
 *
 * All endpoints require an X-User-Id header to identify the user.
 * In production, this would be extracted from a JWT token by a security filter.
 */
@RestController
@RequestMapping("/api/notifications")
@Tag(name = "Notifications", description = "Notification management APIs")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PostMapping
    @Operation(summary = "Create a notification", description = "Creates a new notification. Uses idempotencyKey to prevent duplicates.")
    public ResponseEntity<Notification> createNotification(
            @Parameter(description = "User ID", required = true) @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody CreateNotificationRequest request) {

        Notification notification = Notification.builder()
                .message(request.getMessage())
                .type(request.getType())
                .idempotencyKey(request.getIdempotencyKey())
                .build();

        return ResponseEntity.ok(notificationService.createNotification(userId, notification));
    }

    @GetMapping
    @Operation(summary = "Get user notifications", description = "Returns paginated notifications for the authenticated user, ordered by most recent first.")
    public ResponseEntity<Page<Notification>> getNotifications(
            @Parameter(description = "User ID", required = true) @RequestHeader("X-User-Id") String userId,
            Pageable pageable) {
        return ResponseEntity.ok(notificationService.getUserNotifications(userId, pageable));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get unread count", description = "Returns the number of unread notifications. Uses cached count with DB fallback.")
    public ResponseEntity<Integer> getUnreadCount(
            @Parameter(description = "User ID", required = true) @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(notificationService.getUnreadCount(userId));
    }

    @PutMapping("/{id}/read")
    @Operation(summary = "Mark as read", description = "Marks a specific notification as read. Only the owning user can mark their own notifications.")
    public ResponseEntity<Notification> markAsRead(
            @PathVariable String id,
            @Parameter(description = "User ID", required = true) @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(notificationService.markAsRead(id, userId));
    }
}
