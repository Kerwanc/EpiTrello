# EpiTrello

A modern, full-stack Trello clone for task and project management. Built with Next.js, NestJS, PostgreSQL, and Docker.

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-latest-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Docker Setup (Recommended)](#docker-setup-recommended)
  - [Local Development](#local-development)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## Features

### Current Features

- **User Authentication**
  - JWT-based authentication
  - User registration
  - Secure login with password hashing
  - Protected routes and API endpoints

- **Board Management**
  - Create, read, update, and delete boards
  - Board titles and descriptions
  - User-specific board ownership
  - Board listing page

- **List Management**
  - Create lists within boards
  - Update list titles and positions
  - Delete lists
  - Lists are board-specific

- **Card Management**
  - Create cards within lists
  - Card titles and descriptions
  - Due dates and tags support
  - Update and delete cards
  - Cards are list-specific

- **Modern UI/UX**
  - Responsive design with TailwindCSS v4
  - Clean, intuitive interface
  - Error handling and user feedback
  - Good color choice, not confusing

### Upcoming Features

- Drag & drop for cards and lists
- Board sharing and permissions
- Card comments and assignments
- Board templates
- Search functionality
- Real-time updates
- User profiles and avatars
- Responsive mobile design

## Tech Stack

### Frontend
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript 5
- **Styling**: TailwindCSS v4
- **State Management**: React Context API
- **HTTP Client**: Fetch API with custom wrapper

### Backend
- **Framework**: NestJS 10
- **Language**: TypeScript 5
- **Database**: PostgreSQL 16
- **ORM**: TypeORM
- **Authentication**: JWT (jsonwebtoken + passport-jwt)
- **Validation**: class-validator, class-transformer

### DevOps
- **Containerization**: Docker & Docker Compose
- **Package Manager**: pnpm
- **Version Control**: Git

## Architecture

```
┌──────────────────┐
│   Browser        │
│ (localhost:3000) │
└────────┬─────────┘
         │ HTTP
         ▼
┌─────────────────┐
│   Frontend      │
│   (Next.js)     │
│   Container     │
└────────┬────────┘
         │ REST API
         ▼
┌─────────────────┐      ┌─────────────────┐
│   Backend       │◄────►│   PostgreSQL    │
│   (NestJS)      │      │   Database      │
│   Container     │      │   Container     │
└─────────────────┘      └─────────────────┘
```

### API Endpoints

#### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user (protected)

#### Boards
- `GET /boards` - List all user boards (protected)
- `GET /boards/:id` - Get single board (protected)
- `POST /boards` - Create board (protected)
- `PATCH /boards/:id` - Update board (protected)
- `DELETE /boards/:id` - Delete board (protected)

#### Lists
- `GET /boards/:boardId/lists` - Get all lists in a board (protected)
- `POST /boards/:boardId/lists` - Create list (protected)
- `PATCH /boards/:boardId/lists/:id` - Update list (protected)
- `DELETE /boards/:boardId/lists/:id` - Delete list (protected)

#### Cards
- `GET /lists/:listId/cards` - Get all cards in a list (protected)
- `POST /lists/:listId/cards` - Create card (protected)
- `PATCH /lists/:listId/cards/:id` - Update card (protected)
- `DELETE /lists/:listId/cards/:id` - Delete card (protected)

## Getting Started

### Prerequisites

- **Node.js**: v18 or higher
- **pnpm**: v8 or higher (or npm/yarn)
- **Docker**: v20 or higher (for containerized setup)
- **Docker Compose**: v2 or higher

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/EpiTrello.git
   cd EpiTrello/repo
   ```

### Docker Setup (Recommended)

The easiest way to run EpiTrello is using Docker Compose:

1. **Start all services**
   ```bash
   docker-compose up -d
   ```

2. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - PostgreSQL: localhost:5432

3. **Stop services**
   ```bash
   docker-compose down
   ```

4. **Rebuild after code changes**
   ```bash
   # Rebuild specific service
   docker-compose build frontend
   docker-compose build backend

   # Rebuild and restart
   docker-compose up -d --build
   ```

### Local Development

#### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Create `.env` file** (optional, defaults work with Docker)
   ```env
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_NAME=epitrello
   DATABASE_USER=postgres
   DATABASE_PASSWORD=postgres
   JWT_SECRET=your-secret-key
   PORT=3001
   ```

4. **Start PostgreSQL** (if not using Docker)
   ```bash
   # Using Docker for database only
   docker run -d \
     --name epitrello-db \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=epitrello \
     -p 5432:5432 \
     postgres:16-alpine
   ```


5  . **Start the backend**
   ```bash
   pnpm run start:dev
   ```

   Backend runs on: http://localhost:3001

#### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Create `.env.local` file** (optional)
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

4. **Start the frontend**
   ```bash
   pnpm run dev
   ```

   Frontend runs on: http://localhost:3000

## Project Structure

```
repo/
├── backend/                    # NestJS backend application
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/          # Authentication module (JWT, guards)
│   │   │   ├── users/         # User management
│   │   │   ├── boards/        # Board CRUD operations
│   │   │   ├── lists/         # List CRUD operations
│   │   │   └── cards/         # Card CRUD operations
│   │   ├── common/            # Shared utilities, decorators
│   │   ├── app.module.ts      # Root module
│   │   └── main.ts            # Application entry point
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                   # Next.js frontend application
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx              # Home page
│   │   │   ├── login/page.tsx        # Login page
│   │   │   ├── register/page.tsx     # Registration page
│   │   │   ├── boards/
│   │   │   │   ├── page.tsx          # Boards list
│   │   │   │   └── [id]/page.tsx     # Single board view
│   │   │   ├── components/
│   │   │   │   ├── AuthProvider.tsx  # Auth context provider
│   │   │   │   ├── Navbar.tsx        # Navigation component
│   │   │   │   ├── Button.tsx        # Reusable button
│   │   │   │   ├── Input.tsx         # Reusable input
│   │   │   │   └── Card.tsx          # Reusable card
│   │   │   └── layout.tsx            # Root layout
│   │   ├── lib/
│   │   │   └── api-client.ts         # API client with typed methods
│   │   └── types/
│   │       └── index.ts              # TypeScript interfaces
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml          # Docker Compose configuration
├── README.md                   # This file
├── Technical-Specifications-EpiTrello.md
└── .gitignore
```

## API Documentation

### Authentication Flow

1. **Register**: `POST /auth/register`
   ```json
   {
     "username": "user",
     "email": "user@example.com",
     "password": "testtest"
   }
   ```

   Response:
   ```json
   {
     "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "user": {
       "id": "uuid",
       "username": "user",
       "email": "user@example.com",
       "createdAt": "2026-02-10T18:00:00Z",
       "updatedAt": "2026-02-10T18:00:00Z"
     }
   }
   ```

2. **Login**: `POST /auth/login`
   ```json
   {
     "email": "user@example.com",
     "password": "testtest"
   }
   ```

3. **Protected Routes**: Include JWT in Authorization header
   ```
   Authorization: Bearer <your-jwt-token>
   ```

### Error Responses

The API returns consistent error responses:

```json
{
  "message": "Error description",
  "error": "Error type",
  "statusCode": 400
}
```

Common status codes:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid credentials or missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., email already exists)
- `500` - Internal Server Error

## Environment Variables

### Backend

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_HOST` | `db` | PostgreSQL host |
| `DATABASE_PORT` | `5432` | PostgreSQL port |
| `DATABASE_NAME` | `epitrello` | Database name |
| `DATABASE_USER` | `postgres` | Database username |
| `DATABASE_PASSWORD` | `postgres` | Database password |
| `JWT_SECRET` | `dev-secret-key-change-in-production` | JWT signing secret |
| `PORT` | `3001` | Backend server port |
| `NODE_ENV` | `development` | Environment mode |

### Frontend

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Backend API URL (must be accessible from browser) |

**Important**: `NEXT_PUBLIC_*` variables are embedded at build time and must point to URLs accessible from the user's browser, not internal Docker hostnames.

## Testing

### Backend Tests

```bash
cd backend

# Unit tests
pnpm run test

# E2E tests
pnpm run test:e2e

# Test coverage
pnpm run test:cov
```

### Frontend Tests

```bash
cd frontend

# Run tests
pnpm run test

# Watch mode
pnpm run test:watch
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Boards Table
```sql
CREATE TABLE boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail VARCHAR(500),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Lists Table
```sql
CREATE TABLE lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  position INTEGER NOT NULL,
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Cards Table
```sql
CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date TIMESTAMP,
  tags TEXT[],
  position INTEGER NOT NULL,
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```