# ScholarHub — Multimedia Knowledge Repository

ScholarHub is a centralized multimedia learning material management and retrieval system built for educational institutions. It enables schools to store, search, and stream lectures, PDFs, and office documents in one place with fine-grained access control.

## Features

- **Multi-format storage**: Videos, PDFs, Office documents (PPTX, XLSX, DOCX), images, and audio files
- **Resumable multipart upload**: Split large files (up to GBs) into 5MB parts, upload in parallel, resume on network interruption
- **Video streaming**: Zero-RAM architecture via MinIO presigned URLs — backend never touches video data
- **Full-text search**: Elasticsearch-powered search with Vietnamese language support, faceted filters, and relevance scoring
- **Auto metadata extraction**: Background workers extract duration, resolution, page count, author, etc. using FFmpeg, PDFBox, Apache POI
- **RBAC**: Role-based access control — Admin, Teacher, Student, Guest roles with folder-level permissions
- **Unlimited folder nesting**: Recursive folder tree via PostgreSQL CTE queries
- **JWT authentication**: Secure token-based auth with refresh tokens

## Tech Stack

| Layer       | Technology                                                   |
| ----------- | ------------------------------------------------------------ |
| Frontend    | React 18, TypeScript, Vite, Tailwind CSS 4, Radix UI, MUI   |
| Backend     | Java 21, Spring Boot 3.5.10, Spring Security, Spring Data    |
| RDBMS       | PostgreSQL 15 (users, roles, folders, permissions)           |
| Document DB | MongoDB 6.0 (metadata, revisions, preferences)               |
| Search      | Elasticsearch 8.12 (full-text search + Kibana)               |
| Cache       | Redis 7 (sessions, query cache, rate limiting)               |
| Object Store| MinIO (S3-compatible, file storage)                          |
| Deployment  | Docker Compose, Kubernetes (config included)                 |

## Architecture Overview

```
Users (Students, Teachers, Admins)
        │
        ▼
┌───────────────────┐    ┌───────────────────┐
│  Frontend (React) │◄──►│  Backend (Spring) │
│  Nginx / Vite     │    │  REST API /v1     │
└───────────────────┘    └────────┬──────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        ▼                         ▼                         ▼
┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  MinIO (S3)  │    │  PostgreSQL      │    │  Elasticsearch   │
│  Files       │    │  + MongoDB       │    │  + Redis         │
│  Zero-RAM    │    │  + Redis         │    │  Full-text       │
└──────────────┘    └──────────────────┘    └──────────────────┘
```

**Key patterns**:
- **Direct Multipart Upload**: Browser uploads file parts directly to MinIO via presigned URLs — backend only authorizes
- **Zero-RAM Streaming**: Backend returns a time-limited presigned URL; browser streams video directly from MinIO (HTTP 206 Partial Content)
- **Async Worker**: Metadata extraction runs on a thread pool after upload completes — user never waits

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Java 21 (for local backend dev)
- Node.js 20 (for local frontend dev)

### Run with Docker Compose

```bash
cd infrastructure
docker compose up -d
```

This starts: PostgreSQL, MongoDB, MinIO, Redis, Elasticsearch, Kibana, backend (port 8080), and frontend (port 80).

### Local Development

**Backend**:
```bash
cd scholarhub-backend
./mvnw spring-boot:run
```

**Frontend**:
```bash
cd scholarhub-frontend
npm install
npm run dev
```

### Environment Variables

See `infrastructure/.env` and `scholarhub-frontend/.env.example` for all configuration options.

## Project Structure

```
ScholarHub/
├── scholarhub-backend/       # Spring Boot REST API
│   └── src/main/java/kmp/ct07/scholarhub/
│       ├── config/           # Security, Async, MinIO configs
│       ├── controller/       # REST endpoints
│       ├── service/          # Business logic + workers
│       ├── repository/       # JPA & MongoDB repositories
│       ├── model/            # Entities & DTOs
│       └── security/         # JWT, RBAC filters
├── scholarhub-frontend/      # React + Vite SPA
│   └── src/
│       ├── app/              # Pages & components
│       ├── styles/           # Tailwind CSS
│       └── main.tsx          # Entry point
├── infrastructure/           # Docker Compose + K8s configs
│   ├── docker-compose.yml
│   ├── elasticsearch/
│   └── data/                 # Persistent volumes
└── config.md                 # Full K8s deployment guide
```

## API Overview

| Endpoint                          | Description                |
| --------------------------------- | -------------------------- |
| `POST /api/v1/auth/register`      | Register new account       |
| `POST /api/v1/auth/login`         | Login with email/password  |
| `POST /api/v1/materials/init-upload` | Start multipart upload  |
| `GET /api/v1/materials/presigned-urls` | Get upload URLs      |
| `POST /api/v1/materials/complete-upload` | Finalize upload    |
| `GET /api/v1/materials/{id}/stream` | Get streaming URL      |
| `GET /api/v1/materials/search`    | Full-text search           |
| `POST /api/v1/folders`            | Create folder              |
| `GET /api/v1/folders/tree`        | Get folder hierarchy       |

Full API docs: run backend and visit `http://localhost:8080/swagger-ui.html`.

## Deployment

Kubernetes deployment configs are documented in `config.md` (namespaces, StatefulSets, HPAs, PVCs, Ingress with TLS, monitoring, backup/restore).

## Author

**Student**: Lê Thanh Yên — CT07, Học Viện Kỹ Thuật Mật Mã  
**Supervisor**: TS. Văn Thế Thành

## License

MIT
