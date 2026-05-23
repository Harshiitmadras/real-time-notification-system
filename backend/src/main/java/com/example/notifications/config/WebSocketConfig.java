package com.example.notifications.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Configures STOMP over WebSocket for realtime notification delivery.
 *
 * Design decisions:
 * - /ws endpoint with SockJS fallback for broad browser compatibility
 * - Simple in-memory broker on /topic prefix (swap for external broker like RabbitMQ for production clustering)
 * - /app prefix for client-to-server messages
 * - AllowedOriginPatterns("*") for dev; should be locked down in production
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // /topic is the prefix for messages from server -> client subscriptions
        registry.enableSimpleBroker("/topic");
        // /app is the prefix for messages from client -> server @MessageMapping methods
        registry.setApplicationDestinationPrefixes("/app");
    }
}
