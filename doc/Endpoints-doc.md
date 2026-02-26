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
- `GET /boards/:id/members` - Get board members (protected)
- `POST /boards/:id/members` - Invite member to board (protected)
- `DELETE /boards/:id/members/:userId` - Remove member from board (protected)
- `PATCH /boards/:id/members/:userId/role` - Update member role (protected)

#### Lists
- `GET /boards/:boardId/lists` - Get all lists in a board (protected)
- `POST /boards/:boardId/lists` - Create list (protected)
- `PATCH /boards/:boardId/lists/:id` - Update list (protected)
- `DELETE /boards/:boardId/lists/:id` - Delete list (protected)

#### Cards
- `GET /lists/:listId/cards` - Get all cards in a list (protected)
- `GET /lists/:listId/cards/:id` - Get single card with assignments (protected)
- `POST /lists/:listId/cards` - Create card (protected)
- `PATCH /lists/:listId/cards/:id` - Update card (protected)
- `DELETE /lists/:listId/cards/:id` - Delete card (protected)
- `GET /lists/:listId/cards/:cardId/assignments` - Get card assignments (protected)
- `POST /lists/:listId/cards/:cardId/assign/:userId` - Assign user to card (protected)
- `DELETE /lists/:listId/cards/:cardId/unassign/:userId` - Unassign user from card (protected)

#### Comments
- `GET /lists/:listId/cards/:cardId/comments` - Get all comments on a card (protected)
- `POST /lists/:listId/cards/:cardId/comments` - Create comment (protected)
- `PATCH /lists/:listId/cards/:cardId/comments/:id` - Update comment (protected)
- `DELETE /lists/:listId/cards/:cardId/comments/:id` - Delete comment (protected)

#### Notifications
- `GET /notifications` - Get user notifications with pagination (protected)
- `GET /notifications/unread-count` - Get count of unread notifications (protected)
- `PATCH /notifications/:id/read` - Mark notification as read (protected)
- `PATCH /notifications/read-all` - Mark all notifications as read (protected)
- `DELETE /notifications/:id` - Delete notification (protected)
