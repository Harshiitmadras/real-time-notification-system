package com.example.notifications.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateNotificationRequest {
    @NotBlank
    private String message;
    
    @NotNull
    private NotificationType type;
    
    @NotBlank
    private String idempotencyKey;
}
