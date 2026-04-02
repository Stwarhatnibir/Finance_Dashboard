const swaggerUi = require("swagger-ui-express");

/**
 * Inline OpenAPI 3.0 specification.
 * Kept in JS (not YAML) to avoid a file-read at boot and to allow
 * dynamic values (e.g. server URL from env) to be injected at runtime.
 */
const buildSwaggerSpec = () => ({
  openapi: "3.0.0",
  info: {
    title: "Finance Dashboard API",
    version: "1.0.0",
    description:
      "Production-grade REST API for a finance dashboard. Supports role-based access control, JWT authentication, financial record management, and analytics.",
    contact: { name: "API Support", email: "support@financedashboard.com" },
  },
  servers: [
    {
      url: `http://localhost:${process.env.PORT || 5000}/api/v1`,
      description: "Local development server",
    },
  ],

  // ── Reusable security scheme ─────────────────────────────────────────────
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter the JWT token obtained from POST /auth/login",
      },
    },

    // ── Reusable schemas ───────────────────────────────────────────────────
    schemas: {
      // ── Shared ────────────────────────────────────────────────────────────
      SuccessEnvelope: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string" },
          data: { type: "object" },
          meta: { $ref: "#/components/schemas/PaginationMeta" },
        },
      },
      ErrorEnvelope: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string" },
          errors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                field: { type: "string" },
                message: { type: "string" },
              },
            },
          },
        },
      },
      PaginationMeta: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 10 },
          total: { type: "integer", example: 156 },
          totalPages: { type: "integer", example: 16 },
          hasNextPage: { type: "boolean", example: true },
          hasPrevPage: { type: "boolean", example: false },
        },
      },

      // ── User ──────────────────────────────────────────────────────────────
      User: {
        type: "object",
        properties: {
          _id: { type: "string", example: "664f1a2b3c4d5e6f7a8b9c0d" },
          name: { type: "string", example: "Alice Johnson" },
          email: { type: "string", example: "alice@example.com" },
          role: { type: "string", enum: ["viewer", "analyst", "admin"] },
          status: { type: "string", enum: ["active", "inactive"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", example: "Alice Johnson" },
          email: { type: "string", example: "alice@example.com" },
          password: { type: "string", example: "SecurePass1" },
          role: {
            type: "string",
            enum: ["viewer", "analyst", "admin"],
            default: "viewer",
          },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", example: "alice@example.com" },
          password: { type: "string", example: "SecurePass1" },
        },
      },
      UpdateUserRequest: {
        type: "object",
        properties: {
          name: { type: "string", example: "Alice Smith" },
          role: { type: "string", enum: ["viewer", "analyst", "admin"] },
          status: { type: "string", enum: ["active", "inactive"] },
        },
      },

      // ── Transaction ────────────────────────────────────────────────────────
      Transaction: {
        type: "object",
        properties: {
          _id: { type: "string", example: "664f2b3c4d5e6f7a8b9c0e1f" },
          amount: { type: "number", example: 5000.0 },
          type: { type: "string", enum: ["income", "expense"] },
          category: { type: "string", example: "Salary" },
          date: { type: "string", format: "date-time" },
          note: { type: "string", example: "Monthly salary for June" },
          createdBy: { $ref: "#/components/schemas/User" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CreateTransactionRequest: {
        type: "object",
        required: ["amount", "type", "category", "date"],
        properties: {
          amount: { type: "number", example: 5000.0 },
          type: { type: "string", enum: ["income", "expense"] },
          category: { type: "string", example: "Salary" },
          date: { type: "string", format: "date", example: "2024-06-01" },
          note: { type: "string", example: "Monthly salary" },
        },
      },
      UpdateTransactionRequest: {
        type: "object",
        properties: {
          amount: { type: "number", example: 5500.0 },
          type: { type: "string", enum: ["income", "expense"] },
          category: { type: "string", example: "Bonus" },
          date: { type: "string", format: "date" },
          note: { type: "string" },
        },
      },
    },

    // ── Reusable responses ─────────────────────────────────────────────────
    responses: {
      Unauthorized: {
        description: "Missing or invalid JWT token",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorEnvelope" },
            example: { success: false, message: "Authentication token missing or malformed." },
          },
        },
      },
      Forbidden: {
        description: "Authenticated but insufficient role",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorEnvelope" },
            example: { success: false, message: "Access denied. Required role(s): [admin]." },
          },
        },
      },
      NotFound: {
        description: "Resource not found",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorEnvelope" },
            example: { success: false, message: "Transaction not found." },
          },
        },
      },
      ValidationError: {
        description: "Input validation failed",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorEnvelope" },
          },
        },
      },
    },
  },

  // ── Global security (overridden per-route for public endpoints) ───────────
  security: [{ BearerAuth: [] }],

  // ── Paths ──────────────────────────────────────────────────────────────────
  paths: {
    // ── Health ──────────────────────────────────────────────────────────────
    "/health": {
      get: {
        tags: ["System"],
        summary: "Health check",
        security: [],
        responses: {
          200: {
            description: "API is running",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Finance Dashboard API is running.",
                  timestamp: "2024-06-01T10:00:00.000Z",
                  environment: "development",
                },
              },
            },
          },
        },
      },
    },

    // ── Auth ─────────────────────────────────────────────────────────────────
    "/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Register a new user",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/RegisterRequest" } },
          },
        },
        responses: {
          201: {
            description: "Account created successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessEnvelope" },
              },
            },
          },
          400: { $ref: "#/components/responses/ValidationError" },
          409: { description: "Email already in use" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Login and receive a JWT",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } },
          },
        },
        responses: {
          200: {
            description: "Login successful — JWT returned",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessEnvelope" },
                example: {
                  success: true,
                  message: "Login successful.",
                  data: {
                    token: "eyJhbGci...",
                    expiresIn: "7d",
                    user: { _id: "...", name: "Alice", role: "analyst" },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/ValidationError" },
          401: { description: "Invalid credentials" },
        },
      },
    },

    // ── Users ────────────────────────────────────────────────────────────────
    "/users": {
      get: {
        tags: ["Users"],
        summary: "List all users (Admin)",
        parameters: [
          { in: "query", name: "role", schema: { type: "string", enum: ["viewer", "analyst", "admin"] } },
          { in: "query", name: "status", schema: { type: "string", enum: ["active", "inactive"] } },
          { in: "query", name: "page", schema: { type: "integer", default: 1 } },
          { in: "query", name: "limit", schema: { type: "integer", default: 10 } },
        ],
        responses: {
          200: { description: "Users list", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } } },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/users/{id}": {
      patch: {
        tags: ["Users"],
        summary: "Update a user (Admin)",
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/UpdateUserRequest" } },
          },
        },
        responses: {
          200: { description: "User updated" },
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },

    // ── Records ──────────────────────────────────────────────────────────────
    "/records": {
      post: {
        tags: ["Transactions"],
        summary: "Create a transaction (Admin)",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/CreateTransactionRequest" } },
          },
        },
        responses: {
          201: { description: "Transaction created" },
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
      get: {
        tags: ["Transactions"],
        summary: "List transactions (All roles)",
        parameters: [
          { in: "query", name: "type", schema: { type: "string", enum: ["income", "expense"] } },
          { in: "query", name: "category", schema: { type: "string" } },
          { in: "query", name: "startDate", schema: { type: "string", format: "date" } },
          { in: "query", name: "endDate", schema: { type: "string", format: "date" } },
          { in: "query", name: "page", schema: { type: "integer", default: 1 } },
          { in: "query", name: "limit", schema: { type: "integer", default: 10 } },
        ],
        responses: {
          200: { description: "Paginated transaction list" },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/records/{id}": {
      patch: {
        tags: ["Transactions"],
        summary: "Update a transaction (Admin)",
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/UpdateTransactionRequest" } },
          },
        },
        responses: {
          200: { description: "Transaction updated" },
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Transactions"],
        summary: "Soft-delete a transaction (Admin)",
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        responses: {
          204: { description: "Transaction deleted (soft)" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },

    // ── Dashboard ─────────────────────────────────────────────────────────────
    "/dashboard/summary": {
      get: {
        tags: ["Dashboard"],
        summary: "Financial summary (Analyst + Admin)",
        responses: {
          200: {
            description: "Aggregated totals, category breakdown, and recent transactions",
            content: {
              "application/json": {
                example: {
                  success: true,
                  data: {
                    totalIncome: 45000.0,
                    totalExpense: 31250.75,
                    netBalance: 13749.25,
                    transactionCounts: { income: 18, expense: 37, total: 55 },
                    categoryBreakdown: {
                      income: [{ category: "Salary", total: 36000, count: 12 }],
                      expense: [{ category: "Rent", total: 12000, count: 6 }],
                    },
                    recentTransactions: [],
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/dashboard/trends": {
      get: {
        tags: ["Dashboard"],
        summary: "Monthly income vs expense trends (Analyst + Admin)",
        responses: {
          200: {
            description: "Last 12 months of monthly income/expense data",
            content: {
              "application/json": {
                example: {
                  success: true,
                  data: {
                    period: "last_12_months",
                    trends: [
                      { year: 2024, month: 1, label: "Jan 2024", income: 5000, expense: 3200, net: 1800 },
                    ],
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
  },
});

/**
 * Registers the Swagger UI route on the Express app.
 * Available at /api/v1/docs in development only.
 */
const setupSwagger = (app) => {
  if (process.env.NODE_ENV === "production") return;

  const spec = buildSwaggerSpec();

  app.use(
    "/api/v1/docs",
    swaggerUi.serve,
    swaggerUi.setup(spec, {
      customSiteTitle: "Finance Dashboard API Docs",
      swaggerOptions: { persistAuthorization: true },
    })
  );

  // Also expose raw JSON spec for tooling (Postman import, etc.)
  app.get("/api/v1/docs.json", (_req, res) => res.json(spec));
};

module.exports = { setupSwagger };
