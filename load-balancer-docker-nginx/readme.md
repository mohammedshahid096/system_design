# Nginx Docker Load Balancer

A high-performance load balancing setup using Nginx in Docker, routing traffic across multiple backend Node/service instances with built-in passive health checks.

## Architecture MindMap Diagram

```mermaid
mindmap
  root((Nginx Load Balancer))
    Port 8000
      Client Traffic
    Upstream Backend
      user-service1:8001
        Max Fails: 3
        Fail Timeout: 30s
      user-service2:8001
        Max Fails: 3
        Fail Timeout: 30s
    Proxy Settings
      Header Forwarding
        Host, Real-IP, X-Forwarded-For
      Timeouts
        Connect: 5s
        Read: 10s

```

## Architecture Flow Diagram

```mermaid
flowchart LR
    U[Internet Users] --> DNS[DNS]
    DNS --> LB[Load Balancer]

    LB --> A[user-service1:8001]
    LB --> B[user-service2:8001]

    A --> DB[(Database)]
    B --> DB

```
