# Technical Specification – EpiTrello

## 1. General Overview

**Project name:** EpiTrello  
**Start date:** October 20, 2025  
**Deadline:** March 1, 2026  
**Project type:** Full-stack web application (Trello-like task management tool)  
**Objective:** Develop a simplified Trello clone enabling users to create, organize, and share task boards using lists and draggable cards.

---

## 2. Purpose and Goals

The goal of **EpiTrello** is to simulate a professional-grade project management tool with essential Trello functionalities. The application will feature user authentication, board management, task organization, and a clean, responsive interface.

The focus will be on:
- Agile development with milestones
- Test-driven approach
- CI/CD integration
- Professional documentation and maintainability

---

## 3. Functional Specifications

### 3.1 User Management
- Register and login system (JWT or session-based authentication)
- Profile page displaying:
  - Username, email, avatar  
  - List of owned and shared boards  
- Edit profile information (email, avatar)

---

### 3.2 Boards (Tables)
- Create, edit, delete a board  
- Board attributes: title, short description, thumbnail image  
- Predefined templates for quick board creation  
- Catalog of boards for the logged-in user  
  - Search bar to filter boards by name  
- Board sharing with other registered users (invite by username or email)
- Owner/member permissions

---

### 3.3 Lists
- Create, edit, delete lists within a board  
- Each list contains multiple cards  
- Reorder lists inside a board  

---

### 3.4 Cards
- Create, edit, delete cards inside lists  
- Card attributes:  
  - Title, description  
  - Tags  
  - Due date  
  - Assigned users  
  - Comments (text only)  
- Drag & drop cards between lists (visual + persisted order)

---


## 4. Technical Specifications

### 4.1 Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | Next.js 15, TypeScript, TailwindCSS, React|
| **Backend** | NestJS, TypeScript |
| **Database** | PostgreSQL |
| **ORM** | TypeORM |
| **Auth** | JWT (JSON Web Token) |
| **Containerization** | Docker |
| **Version control** | GitHub |
| **CI/CD** | GitHub Actions (lint, test, build, deploy) |
| **Documentation** | README, API Docs (Swagger), and project wiki |

---

## 5. Architecture

**Frontend**
- Next.js with pages:  
  - `/` → Home  
  - `/login` / `/register`  
  - `/boards` → List of user boards  
  - `/boards/[id]` → Single board with lists/cards  
  - `/profile`  

**Backend (NestJS Modules)**
- `AuthModule` → Login / Register / JWT validation  
- `UserModule` → Profile management  
- `BoardModule` → CRUD boards + sharing logic  
- `ListModule` → CRUD lists  
- `CardModule` → CRUD cards, comments  

---

## 6. Documentation
- **README.md:** project setup, architecture, and usage  
- **API Documentation:** auto-generated Swagger (NestJS)  

---

## 7. Project Planning & Milestones

### Milestone 1 – Core (Nov 6 → Dec 15, 2025)
**Goal:** Have a functional local version with the main features  
**Deliverables:**
- Auth system (login/register)  
- Board CRUD  
- Lists & Cards (basic version)  
- Frontend UI structure  
- Local persistence (PostgreSQL)  
- Docker setup  

---

### Milestone 2 – Persistence & UX (Dec 16 → Jan 26, 2026)
**Goal:** Improve data handling, search, and collaboration  
**Deliverables:**
- Board search & templates  
- Tags, comments, and assigned users on cards  
- Board sharing (permissions system)  
- Database order persistence (for drag & drop)  
- Swagger documentation  
- CI/CD pipeline (GitHub Actions + tests)  

---

### Milestone 3 – Finalization (Jan 27 → Feb 23, 2026)
**Goal:** Polish, document, and finalize the project  
**Deliverables:**
- Responsive design  
- Real-time updates (optional)  
- Profile page  
- Testing coverage (unit + integration)  
- Complete documentation (README + Wiki)  
- Final Docker image ready for deployment  

---

## 8. Expected Deliverables

At the end of the project, the submission will include:
- Source code (frontend + backend)  
- Database schema & migrations  
- Docker setup  
- GitHub Actions CI/CD configuration  
- Technical documentation (README + Swagger + Wiki)  
- Project report / final presentation  