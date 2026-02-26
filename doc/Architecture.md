## Architecture

```
┌─────────────Docker compose──────────────────────┐ 
|                                                 |
| ┌──────────────────┐                            |
| │   Browser        │                            |
| │ (localhost:3000) │                            |
| └────────┬─────────┘                            |
|          │ HTTP                                 |
|          ▼                                      |
| ┌─────────────────┐                             |
| │   Frontend      │                             |
| │   (Next.js)     │                             |
| │   Container     │                             |
| └────────┬────────┘                             |
|          │ REST API                             |
|          ▼                                      |
| ┌─────────────────┐      ┌─────────────────┐    |
| │   Backend       │◄────►│   PostgreSQL    │    |
| │   (NestJS)      │      │   Database      │    |
| │   Container     │      │   Container     │    |
| └─────────────────┘      └─────────────────┘    |
└─────────────Docker compose──────────────────────┘

```