## Project Structure

```
repo/
├── backend/                    # NestJS backend application
│   ├── src/
│   │   ├── modules/           # Enpoints + CRUD operations
│   │   │   ├── auth/          # Authentication module
│   │   │   ├── users/
│   │   │   ├── boards/
│   │   │   ├── lists/
│   │   │   ├── cards/
│   │   │   └── notifications/
│   │   ├── app.module.ts      # Root module
│   │   └── main.ts            # Application entry point
│   ├── test/
│   ├── Dockerfile             # Server containerization
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
│   │   │   │   └── [id]/page.tsx     # Single page
│   │   │   ├── components/
│   │   │   └── layout.tsx            # Root layout
│   │   ├── lib/
│   │   │   └── api-client.ts         # Fetching handle
│   │   └── types/
│   │       └── index.ts              # TypeScript interfaces
│   ├── Dockerfile              # Front containerization
│   └── package.json
│
├── docker-compose.yml          # Orchestration
├── README.md
├── Technical-Specifications-EpiTrello.md
├── doc/                        # Project documentatioon
└── .gitignore
```