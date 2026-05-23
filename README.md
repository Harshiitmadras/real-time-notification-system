# Realtime Notification System

A highly scalable, realtime notification system built with Spring Boot, React, Redis, and PostgreSQL.

## Architecture

The system is designed as a scalable microservice architecture capable of handling horizontal scaling while maintaining robust realtime websocket connections.

### Components
- **Backend (Spring Boot 3, Java 21)**: Provides REST APIs for managing notifications and acts as a STOMP over WebSocket message broker.
- **Frontend (React, Vite, TailwindCSS)**: A modern, responsive dashboard showcasing realtime updates and unread counts.
- **Database (PostgreSQL)**: Serves as the source of truth for all notifications. Ensures no duplicate notifications via unique constraints on `idempotencyKey`.
- **Cache & Message Broker (Redis)**:
  - **Pub/Sub**: Handles horizontal scaling of WebSockets. When a notification is generated on Instance A, it is published to Redis. All instances listen to this topic and push the message down to any connected WebSockets for that user. This solves the problem of "Same user may connect from multiple devices (and multiple instances)".
  - **Rate Limiting**: Uses Bucket4j backed by Redis to enforce API limits across all instances.
  - **Caching**: Stores unread counts to prevent expensive DB counts on every page load. Fallback mechanisms ensure the system functions if Redis restarts.

### Tradeoffs
- **Redis Pub/Sub vs. Dedicated Message Broker (RabbitMQ)**: We opted for Redis Pub/Sub for WebSocket horizontal scaling. It is simpler to deploy and perfectly suited for ephemeral realtime messages. The tradeoff is that Redis Pub/Sub doesn't persist messages if consumers are offline; however, since our primary storage is PostgreSQL, users fetch their historical notifications from the DB anyway. Redis is strictly used to broadcast to *currently active* connections.
- **Idempotency keys vs "Check then act"**: We use an explicit `idempotencyKey` column with a unique constraint. This pushes the concurrency control to the database, eliminating race conditions entirely, compared to checking if a message exists in code before inserting.
- **Direct WebSocket vs. SSE**: WebSockets were chosen because STOMP over WebSockets provides a robust, standardized way to subscribe to specific topics (e.g. `/topic/notifications/{userId}`) which Spring integrates with natively, making the frontend implementation much simpler compared to manually managing SSE streams and reconnections.

## Setup Instructions

### Prerequisites
- Docker & Docker Compose
- JDK 21 & Maven (if running locally without Docker)
- Node.js 20+ (if running frontend locally)

### Running with Docker Compose
From the root directory, simply run:
```bash
docker-compose up --build
```
This will start:
- PostgreSQL on port `5432`
- Redis on port `6379`
- Backend Service on port `8080`
- Frontend Dashboard on port `5173`

Navigate to `http://localhost:5173` to see the dashboard.

## Production Deployment (Kubernetes)
Manifests are provided in the `k8s/` directory. They include Deployments and Services for all components. The backend is configured with `replicas: 3` to demonstrate horizontal scaling out of the box.

```bash
kubectl apply -f k8s/
```

## API Documentation
Once the backend is running, the Swagger UI API documentation is available at:
`http://localhost:8080/swagger-ui.html`

### Endpoints Summary
- `POST /api/notifications`: Create a new notification. Requires `X-User-Id` header and JSON body (`message`, `type`, `idempotencyKey`).
- `GET /api/notifications`: Fetch paginated notifications for the user.
- `GET /api/notifications/unread-count`: Get the unread count.
- `PUT /api/notifications/{id}/read`: Mark a specific notification as read.

## Resilience & Retry Mechanism
- **Redis Restart**: If Redis restarts or is unavailable, the system gracefully falls back to PostgreSQL for fetching unread counts, and rate limiting degrades safely.
- **Failed Deliveries**: A Spring `@Scheduled` cron job runs every minute to find notifications marked as `FAILED` (e.g., failed to publish to Redis broker) and retries broadcasting them.

---

## AI Usage Declaration
This project was developed with the assistance of an AI coding assistant. The AI was used to:
- Generate boilerplate code for Spring Boot and React.
- Scaffold Kubernetes manifests and Dockerfiles.
- Implement standard patterns for Redis Pub/Sub and Bucket4j rate limiting.

All generated code has been reviewed, understood, and modified by the developer to meet the specific production constraints of this assignment.
