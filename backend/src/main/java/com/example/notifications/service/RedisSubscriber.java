package com.example.notifications.service;

import com.example.notifications.model.Notification;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class RedisSubscriber {

    private final ObjectMapper objectMapper;
    private final SimpMessagingTemplate messagingTemplate;

    public RedisSubscriber(ObjectMapper objectMapper, SimpMessagingTemplate messagingTemplate) {
        this.objectMapper = objectMapper;
        this.messagingTemplate = messagingTemplate;
    }

    public void onMessage(String message, String channel) {
        try {
            Notification notification = objectMapper.readValue(message, Notification.class);
            String destination = "/topic/notifications/" + notification.getUserId();
            messagingTemplate.convertAndSend(destination, notification);
            log.info("Pushed notification via WebSocket to {}: {}", destination, notification.getId());
        } catch (Exception e) {
            log.error("Failed to process message from Redis pub/sub", e);
        }
    }
}
