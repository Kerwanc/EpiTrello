# EpiTrello

A simplified Trello clone for managing tasks, boards, and team collaboration.

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Docker (optional, for containerized setup)
- PostgreSQL (if running locally without Docker)

### Local Development

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

**Backend:**
```bash
cd backend
npm install
npm run start:dev
# Backend runs on http://localhost:3001
```

### Docker Setup
```bash
docker-compose up
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
# PostgreSQL: localhost:5432
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, TypeScript, TailwindCSS, React |
| Backend | NestJS, TypeScript |
| Database | PostgreSQL |
| ORM | TypeORM |
| Auth | JWT |
| Containerization | Docker |

## Project Structure

```
repo/
├── frontend/              # Next.js application
│   ├── app/              # App router pages
│   ├── components/       # Reusable components
│   ├── public/           # Static assets
│   └── package.json
├── backend/              # NestJS application
│   ├── src/
│   │   ├── modules/      # Feature modules (auth, users, boards, etc.)
│   │   ├── common/       # Shared utilities, guards, interceptors
│   │   └── main.ts
│   └── package.json
├── docker-compose.yml    # Orchestrate services
├── README.md             # This file
└── .gitignore
```

## Core Features (Milestone 1)

- User authentication (register/login with JWT)
- Board CRUD operations
- Lists and cards management
- Database persistence
- Docker containerization

## Documentation

- **Frontend:** See `frontend/README.md`
- **Backend:** See `backend/README.md`
- **API Docs:** Available at `/api/docs` (Swagger) when backend is running