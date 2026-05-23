package com.example.notifications.repository;

import com.example.notifications.model.Notification;
import com.example.notifications.model.NotificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, String> {

    Page<Notification> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    int countByUserIdAndIsReadFalse(String userId);

    Optional<Notification> findByIdempotencyKey(String idempotencyKey);
    
    List<Notification> findByStatus(NotificationStatus status);
}
