# 💰 Finance Dashboard API

A production-grade RESTful backend for a finance dashboard built with **Node.js**, **Express**, and **MongoDB**. Features role-based access control, JWT authentication, aggregation-powered analytics, soft deletes, rate limiting, and structured logging.

---

## 📁 Project Structure

```
finance-dashboard/
├── src/
│   ├── config/
│   │   ├── constants.js        # App-wide enums & defaults
│   │   └── db.js               # Mongoose connection + graceful disconnect
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── dashboard.controller.js
│   │   ├── transaction.controller.js
│   │   └── user.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js       # JWT verify + role guard
│   │   ├── error.middleware.js      # Central error handler + AppError class
│   │   ├── rateLimiter.middleware.js
│   │   └── validate.middleware.js   # express-validator result handler
│   ├── models/
│   │   ├── Transaction.js
│   │   └── User.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── dashboard.routes.js
│   │   ├── index.js            # Central route registry
│   │   ├── transaction.routes.js
│   │   └── user.routes.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── dashboard.service.js    # MongoDB aggregation pipelines
│   │   ├── transaction.service.js
│   │   └── user.service.js
│   ├── utils/
│   │   ├── apiResponse.js      # Standardised response envelope helpers
│   │   ├── logger.js           # Structured logger + Morgan integration
│   │   └── pagination.js       # Reusable pagination utilities
│   ├── validators/
│   │   ├── auth.validators.js
│   │   ├── transaction.validators.js
│   │   └── user.validators.js
│   ├── app.js                  # Express app setup (middleware, routes)
│   └── server.js               # Entry point, DB boot, graceful shutdown
├── logs/                       # Auto-created in production
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## ⚙️ Setup Instructions

### 1. Prerequisites

- Node.js >= 18.x
- MongoDB (local instance or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))

### 2. Clone & Install

```bash
git clone <your-repo-url>
cd finance-dashboard
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your values
```

### 4. Run the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The API will be available at: `http://localhost:5000/api/v1`

---

## 🔐 Environment Variables

| Variable | Description | Default |
|---|---|---|
| `NODE_ENV` | Runtime environment (`development` / `production`) | `development` |
| `PORT` | HTTP server port | `5000` |
| `MONGO_URI` | MongoDB connection string | — |
| `JWT_SECRET` | Secret key for signing JWTs | — |
| `JWT_EXPIRES_IN` | JWT expiry duration (e.g. `7d`, `24h`) | `7d` |
| `BCRYPT_SALT_ROUNDS` | bcrypt hashing rounds (higher = slower = safer) | `12` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in milliseconds | `900000` (15 min) |
| `RATE_LIMIT_MAX` | Max requests per window per IP | `100` |
| `CORS_ORIGIN` | Allowed CORS origin(s) | `*` |

---

## 👤 Role-Based Access Control

| Role | Read Records | Dashboard Analytics | Write / Delete Records | Manage Users |
|---|:---:|:---:|:---:|:---:|
| **viewer** | ✅ | ❌ | ❌ | ❌ |
| **analyst** | ✅ | ✅ | ❌ | ❌ |
| **admin** | ✅ | ✅ | ✅ | ✅ |

---

## 📡 API Endpoints

All endpoints are prefixed with `/api/v1`.

### 🔑 Authentication

#### `POST /auth/register`
Register a new user account.

**Request body:**
```json
{
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "password": "SecurePass1",
  "role": "analyst"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Account created successfully.",
  "data": {
    "user": {
      "_id": "664f1a2b3c4d5e6f7a8b9c0d",
      "name": "Alice Johnson",
      "email": "alice@example.com",
      "role": "analyst",
      "status": "active",
      "createdAt": "2024-06-01T10:00:00.000Z",
      "updatedAt": "2024-06-01T10:00:00.000Z"
    }
  }
}
```

---

#### `POST /auth/login`
Authenticate and receive a JWT.

**Request body:**
```json
{
  "email": "alice@example.com",
  "password": "SecurePass1"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "7d",
    "user": {
      "_id": "664f1a2b3c4d5e6f7a8b9c0d",
      "name": "Alice Johnson",
      "email": "alice@example.com",
      "role": "analyst",
      "status": "active"
    }
  }
}
```

---

### 👥 Users  *(Admin only)*

All `/users` routes require `Authorization: Bearer <token>` and admin role.

#### `GET /users`
Paginated list of all users. Supports `?role=`, `?status=`, `?page=`, `?limit=`.

**Response `200`:**
```json
{
  "success": true,
  "message": "Users retrieved successfully.",
  "data": {
    "users": [
      {
        "_id": "664f1a2b3c4d5e6f7a8b9c0d",
        "name": "Alice Johnson",
        "email": "alice@example.com",
        "role": "analyst",
        "status": "active",
        "createdAt": "2024-06-01T10:00:00.000Z"
      }
    ]
  },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

#### `PATCH /users/:id`
Update a user's name, role, or status.

**Request body** (all fields optional):
```json
{
  "role": "admin",
  "status": "inactive"
}
```

---

### 💳 Financial Records

All `/records` routes require `Authorization: Bearer <token>`.

#### `POST /records` *(Admin only)*

**Request body:**
```json
{
  "amount": 5000.00,
  "type": "income",
  "category": "Salary",
  "date": "2024-06-01",
  "note": "Monthly salary for June"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Transaction created successfully.",
  "data": {
    "transaction": {
      "_id": "664f2b3c4d5e6f7a8b9c0e1f",
      "amount": 5000,
      "type": "income",
      "category": "Salary",
      "date": "2024-06-01T00:00:00.000Z",
      "note": "Monthly salary for June",
      "createdBy": {
        "_id": "664f1a2b3c4d5e6f7a8b9c0d",
        "name": "Alice Johnson",
        "email": "alice@example.com"
      },
      "createdAt": "2024-06-01T10:30:00.000Z"
    }
  }
}
```

#### `GET /records` *(All authenticated roles)*

Supports query params: `?type=income`, `?category=Salary`, `?startDate=2024-01-01`, `?endDate=2024-06-30`, `?page=1`, `?limit=20`

**Response `200`:**
```json
{
  "success": true,
  "message": "Transactions retrieved successfully.",
  "data": {
    "transactions": [ ... ]
  },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 156,
    "totalPages": 16,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

#### `PATCH /records/:id` *(Admin only)*
Partial update of any transaction field.

#### `DELETE /records/:id` *(Admin only)*
Soft-deletes the record (`isDeleted = true`). Returns `204 No Content`.

---

### 📊 Dashboard Analytics *(Analyst + Admin)*

#### `GET /dashboard/summary`

**Response `200`:**
```json
{
  "success": true,
  "message": "Dashboard summary retrieved successfully.",
  "data": {
    "totalIncome": 45000.00,
    "totalExpense": 31250.75,
    "netBalance": 13749.25,
    "transactionCounts": {
      "income": 18,
      "expense": 37,
      "total": 55
    },
    "categoryBreakdown": {
      "income": [
        { "category": "Salary", "total": 36000.00, "count": 12 },
        { "category": "Freelance", "total": 9000.00, "count": 6 }
      ],
      "expense": [
        { "category": "Rent", "total": 12000.00, "count": 6 },
        { "category": "Utilities", "total": 2400.50, "count": 12 }
      ]
    },
    "recentTransactions": [ ... ]
  }
}
```

#### `GET /dashboard/trends`

**Response `200`:**
```json
{
  "success": true,
  "message": "Monthly trends retrieved successfully.",
  "data": {
    "period": "last_12_months",
    "trends": [
      {
        "year": 2024,
        "month": 1,
        "label": "Jan 2024",
        "income": 5000.00,
        "expense": 3200.00,
        "net": 1800.00,
        "incomeCount": 3,
        "expenseCount": 8
      }
    ]
  }
}
```

---

## ⚠️ Error Response Format

All errors follow a consistent envelope:

```json
{
  "success": false,
  "message": "Validation failed. Please correct the highlighted fields.",
  "errors": [
    { "field": "email", "message": "Please provide a valid email address." },
    { "field": "password", "message": "Password must be at least 8 characters." }
  ]
}
```

| HTTP Status | Meaning |
|---|---|
| `400` | Validation error or bad request |
| `401` | Missing, expired, or invalid JWT |
| `403` | Authenticated but insufficient role |
| `404` | Resource or route not found |
| `409` | Conflict (e.g. duplicate email) |
| `429` | Rate limit exceeded |
| `500` | Unexpected server error |

---

## ✅ Health Check

```
GET /api/v1/health
```

```json
{
  "success": true,
  "message": "Finance Dashboard API is running.",
  "timestamp": "2024-06-01T10:00:00.000Z",
  "environment": "development"
}
```

---

## 📌 Assumptions

1. **Password changes** are not exposed via `PATCH /users/:id` to enforce a separate, dedicated change-password flow.
2. **Soft deletes** are applied to transactions; hard deletes are not supported. Deleted records are excluded from all queries and aggregations automatically via Mongoose middleware.
3. **Dashboard analytics** operate on all non-deleted transactions regardless of date range. Use the `/records` filter params for date-scoped reads.
4. **Email** is treated as immutable after registration.
5. **Analyst** role can view raw records and dashboard analytics but cannot create or modify data.
6. **Rate limiting** is applied globally at 100 req/15 min and more strictly at 20 req/15 min on auth endpoints.
7. The `createdBy` field on transactions is set server-side from the authenticated user's JWT — it cannot be spoofed via the request body.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express.js 4 |
| Database | MongoDB via Mongoose 8 |
| Auth | JSON Web Tokens (jsonwebtoken) |
| Password hashing | bcryptjs |
| Validation | express-validator |
| Security | helmet, cors, express-rate-limit |
| Logging | morgan + custom structured logger |
| Config | dotenv |
