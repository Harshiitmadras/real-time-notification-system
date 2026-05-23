package com.example.notifications.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.concurrent.TimeUnit;

@Component
@Slf4j
public class RateLimitInterceptor implements HandlerInterceptor {

    private final RedisTemplate<String, Object> redisTemplate;
    private static final int MAX_REQUESTS_PER_SECOND = 20;

    public RateLimitInterceptor(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String userId = request.getHeader("X-User-Id");
        if (userId == null || userId.isBlank()) {
            response.sendError(HttpStatus.BAD_REQUEST.value(), "Missing X-User-Id header");
            return false;
        }

        long currentSecond = System.currentTimeMillis() / 1000;
        String key = "rate_limit:" + userId + ":" + currentSecond;

        try {
            Long count = redisTemplate.opsForValue().increment(key);
            if (count != null && count == 1) {
                redisTemplate.expire(key, 2, TimeUnit.SECONDS);
            }

            if (count != null && count > MAX_REQUESTS_PER_SECOND) {
                log.warn("Rate limit exceeded for user: {}", userId);
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":\"Rate limit exceeded.\"}");
                return false;
            }
        } catch (Exception e) {
            log.error("Redis unavailable for rate limiting, allowing request");
        }
        return true;
    }
}
