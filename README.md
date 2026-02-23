# TaskPortal — MERN Stack Task Management

A task management app with user authentication, built with NestJS, React (Vite), and MongoDB.

---

## How to Run

### Requirements
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### Backend

```bash
cd backend
npm install
# Edit .env and fill in your MONGODB_URI and JWT_SECRET
npm run start:dev
```

Backend runs at `http://localhost:3000/api`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

### .env file (backend)

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/task-portal
JWT_SECRET=any-long-random-secret-string
JWT_EXPIRES_IN=7d
PORT=3000
FRONTEND_URL=http://localhost:5173
```

> Vite automatically proxies `/api` calls to the backend, so no extra config needed on the frontend.

---

## AI Prompts Used

**Prompt 1** — Full stack scaffold:
> "Generate a full-stack Task Management Portal using the MERN stack with the following constraints: Frontend in React with Vite, Backend in NestJS, Database in MongoDB via Mongoose. The application must include JWT-based user authentication (register + login), and support the following task features: create a task with title (required), description (optional), status (pending/completed), priority (low/medium/high), and due date; view all tasks in a list showing status, priority, and created date; toggle task status between pending and completed; filter tasks by All / Pending / Completed; and display a stats summary (total, pending, completed). Follow NestJS module structure best practices with separate modules for auth, users, and tasks. Use class-validator DTOs for request validation. Enforce task ownership so users can only access their own tasks."

**Prompt 2** — Project documentation:
> "Generate a clean and professional README.md for this project that includes the following sections: how to run the project locally, AI prompts used during development, a clear breakdown of what was AI-generated versus what was manually written or modified, a full API design reference with endpoints, request/response shapes and error codes, and an explanation of the state management architecture. Keep the language concise and straightforward."

---

## What AI Generated vs What Was Modified

### AI Generated
- All NestJS boilerplate (modules, controllers, services, schemas)
- React component structure and JSX
- CSS design system and styling
- Axios interceptor setup
- Form validation logic
- Route protection pattern (ProtectedRoute / PublicRoute)

### Manually Written / Modified
- API endpoint design (naming, HTTP methods, response shapes)
- State management architecture decisions
- Security decisions (password hashing rounds, `select: false` on password field)
- Ownership check logic in TasksService
- Optimistic update + rollback pattern in Dashboard
- localStorage sync strategy in AuthContext
- Data model decisions (completedAt field, priority enum, userId as indexed ref)
- Error handling strategy (where to show errors, when to roll back)

---

## API Design

> Non-AI generated — designed manually.

Base URL: `/api`  
All `/tasks` routes require `Authorization: Bearer <token>` header.

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user, returns JWT |
| POST | `/auth/login` | Login, returns JWT |

**Register body:**
```json
{ "name": "John Doe", "email": "john@example.com", "password": "secret123" }
```

**Login body:**
```json
{ "email": "john@example.com", "password": "secret123" }
```

**Both return:**
```json
{
  "access_token": "eyJhbGci...",
  "user": { "_id": "...", "name": "John Doe", "email": "john@example.com" }
}
```

---

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tasks` | Get all tasks (optional `?status=pending\|completed`) |
| GET | `/tasks/stats` | Get task counts `{ total, completed, pending }` |
| GET | `/tasks/:id` | Get single task |
| POST | `/tasks` | Create a task |
| PATCH | `/tasks/:id` | Update task fields |
| PATCH | `/tasks/:id/toggle` | Toggle status between pending ↔ completed |
| DELETE | `/tasks/:id` | Delete a task |

**Create / Update body:**
```json
{
  "title": "Fix login bug",
  "description": "Optional details",
  "priority": "high",
  "dueDate": "2025-04-01"
}


```

**Error responses:**

| Status | Meaning |
|--------|---------|
| 400 | Validation failed |
| 401 | Missing or invalid token |
| 403 | Not the owner of this task |
| 404 | Task not found |
| 409 | Email already registered |

---

## State Management

> Non-AI generated — architecture designed manually.

The app uses **React Context + useState**. No external library (Redux, Zustand, etc.) was needed at this scale.

### AuthContext (`src/context/AuthContext.jsx`)

Manages authentication globally across the app.

**What it holds:**
- `user` — logged-in user object
- `token` — JWT string
- `isAuthenticated` — boolean derived from token

**Persistence:** Token and user are stored in both React state and `localStorage`. This way, refreshing the page doesn't log the user out. The Axios interceptor reads from `localStorage` directly. Both are always updated together so they never go out of sync.

**Actions:** `login()`, `register()`, `logout()` — all update state and localStorage atomically.

---

### Dashboard local state (`src/pages/Dashboard.jsx`)

Task data lives in the Dashboard component using `useState`.

**What it holds:**
- `tasks` — the full list of tasks shown on screen
- `stats` — `{ total, pending, completed }` for the summary bar
- `filter` — current active filter (`all` / `pending` / `completed`)
- `modal` — `{ open, mode, task }` — controls the create/edit modal

**Optimistic updates:** Toggle and delete update the UI immediately before the server responds. If the server call fails, the previous state is restored (rollback). This makes the app feel instant.

**Data flow:**
```
AuthContext (global)
    └── Dashboard (page-level state)
            ├── TaskCard (receives task + callbacks as props)
            └── AddTaskModal (receives task + onSubmit as props)
```

No prop drilling beyond one level. Each component only receives what it needs.
