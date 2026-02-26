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
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Docker Setup (Recommended)](#docker-setup-recommended)
  - [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Testing](#testing)

## Features

### Current Features

- **User Authentication**
  - JWT-based authentication
  - User registration and login
  - Secure password hashing (bcrypt)
  - Protected routes and API endpoints
  - Session management with JWT tokens

- **Board Management**
  - Create, read, update, and delete boards
  - Board titles and descriptions
  - Role-based access control (Owner, Moderator, Visitor)
  - Board member management (invite, remove, change roles)
  - Member count and list display
  - User-specific board ownership

- **List Management**
  - Create lists within boards
  - Update list titles and positions
  - Delete lists (cascades to cards)
  - Drag & drop reordering of lists

- **Card Management**
  - Create cards within lists
  - Card titles, descriptions, due dates, and tags
  - Update and delete cards
  - Drag & drop within lists and between lists

  - **Card assignments**
  - Assign multiple users to cards
  - User avatars displayed on assigned cards

- **Comments System**
  - Add comments to cards
  - View all comments on a card
  - Update and delete own comments
  - Nested in card edit modal

- **Notification System**
  - In-app notifications for key events:
    - Board invitations
    - Card assignments
    - Role changes
  - Mark individual notifications as read
  - Mark all notifications as read
  - Delete notifications

- **Modern UI/UX**
  - Responsive design with TailwindCSS v4
  - Drag & drop with visual feedback (@hello-pangea/dnd)
  - Error handling and user feedback
  - Professional color scheme

### Upcoming Features

- Board templates
- Search functionality
- User profiles and custom avatars
- Email notifications
- Mobile app

## Tech Stack

### Frontend
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript 5
- **Styling**: TailwindCSS v4
- **HTTP Client**: Fetch API with custom wrapper
- **Drag & Drop**: @hello-pangea/dnd
- **UI Components**: Custom components with Tailwind

### Backend
- **Framework**: NestJS 10
- **Language**: TypeScript 5
- **Database**: PostgreSQL 16
- **ORM**: TypeORM
- **Authentication**: JWT (jsonwebtoken + passport-jwt)
- **Validation**: class-validator, class-transformer
- **Security**: bcrypt for password hashing
- **Testing**: Jest

### DevOps
- **Containerization**: Docker & Docker Compose
- **Package Manager**: pnpm
- **Version Control**: Git
- **CI/CD**: GitHub Actions (lint, typecheck, tests)
 
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