import type { OpenAPIV3 } from "openapi-types";

export const openApiSpec: OpenAPIV3.Document = {
  openapi: "3.0.3",
  info: {
    title: "InsightCode API",
    version: "1.0.0",
    description:
      "REST API for InsightCode coding practice platform. Includes auth, user profile, problems, submissions, admin, and announcements.",
  },
  servers: [
    {
      url: "http://localhost:4000",
      description: "Local dev",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      ProblemDifficulty: {
        type: "string",
        enum: ["EASY", "MEDIUM", "HARD"],
      },
    },
  },
  security: [],
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        responses: {
          "200": {
            description: "Service is healthy",
          },
        },
      },
    },
    "/api/auth/register": {
      post: {
        summary: "Register new user",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                  fullName: { type: "string" },
                },
                required: ["email", "password"],
              },
            },
          },
        },
        responses: {
          "200": { description: "Registered successfully" },
          "400": { description: "Invalid payload" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        summary: "User login",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
                required: ["email", "password"],
              },
            },
          },
        },
        responses: {
          "200": { description: "Login success, returns accessToken and user" },
          "401": { description: "Invalid credentials" },
        },
      },
    },
    "/api/auth/admin-login": {
      post: {
        summary: "Admin login",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                  adminCode: { type: "string" },
                },
                required: ["email", "password", "adminCode"],
              },
            },
          },
        },
        responses: {
          "200": { description: "Admin login success" },
          "401": { description: "Invalid admin credentials" },
        },
      },
    },
    "/api/auth/refresh": {
      post: {
        summary: "Refresh access token",
        tags: ["Auth"],
        responses: {
          "200": { description: "New access token" },
          "401": { description: "Invalid or expired refresh token" },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        summary: "Logout",
        tags: ["Auth"],
        responses: {
          "200": { description: "Logged out" },
        },
      },
    },
    "/api/auth/me": {
      get: {
        summary: "Get current user profile (auth)",
        tags: ["Auth"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Current user" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/users/me": {
      get: {
        summary: "Get profile",
        tags: ["Users"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "User profile" },
          "401": { description: "Unauthorized" },
        },
      },
      put: {
        summary: "Update profile",
        tags: ["Users"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  fullName: { type: "string" },
                  avatarUrl: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Updated profile" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/users/me/progress": {
      get: {
        summary: "Get solving progress summary",
        tags: ["Users"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Progress data" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/users/me/insights": {
      get: {
        summary: "Get AI insights for my submissions",
        tags: ["Users"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
          },
          {
            name: "pageSize",
            in: "query",
            schema: { type: "integer", default: 10 },
          },
        ],
        responses: {
          "200": { description: "Insights list" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/users/me/announcements": {
      get: {
        summary: "Get my unread announcements",
        tags: ["Users"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Announcements" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/users/me/announcements/read": {
      post: {
        summary: "Mark all announcements as read",
        tags: ["Users"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Marked as read" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/users/me/chat": {
      post: {
        summary: "AI chat for user",
        tags: ["Chat"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object" },
            },
          },
        },
        responses: {
          "200": { description: "Chat response" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/problems": {
      get: {
        summary: "List problems for current user (with per-user acceptance rate)",
        tags: ["Problems"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "List of problems including this user's acceptance per problem" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/problems/{id}": {
      get: {
        summary: "Get problem detail",
        tags: ["Problems"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": { description: "Problem detail including test cases" },
          "404": { description: "Problem not found" },
        },
      },
    },
    "/api/submissions/run": {
      post: {
        summary: "Run code against visible test cases (JS/TS only)",
        tags: ["Submissions"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  problemId: { type: "string", format: "uuid" },
                  language: { type: "string", enum: ["javascript", "typescript"] },
                  code: { type: "string" },
                },
                required: ["problemId", "language", "code"],
              },
            },
          },
        },
        responses: {
          "200": { description: "Run result per test case" },
          "400": { description: "Invalid input or unsupported language" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/submissions": {
      get: {
        summary: "List my submissions for a problem",
        tags: ["Submissions"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "problemId",
            in: "query",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": { description: "Submissions list" },
          "400": { description: "Missing problemId" },
          "401": { description: "Unauthorized" },
        },
      },
      post: {
        summary: "Create a submission (enqueue for judging)",
        tags: ["Submissions"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  problemId: { type: "string", format: "uuid" },
                  language: { type: "string" },
                  code: { type: "string" },
                },
                required: ["problemId", "language", "code"],
              },
            },
          },
        },
        responses: {
          "200": { description: "Submission created and queued" },
          "400": { description: "Invalid payload" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/submissions/{id}": {
      get: {
        summary: "Get my submission detail (with code)",
        tags: ["Submissions"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": { description: "Submission detail" },
          "401": { description: "Unauthorized" },
          "404": { description: "Not found" },
        },
      },
      delete: {
        summary: "Delete my submission",
        tags: ["Submissions"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "204": { description: "Deleted" },
          "401": { description: "Unauthorized" },
          "404": { description: "Not found" },
        },
      },
    },
    "/api/announcements": {
      get: {
        summary: "List public announcements",
        tags: ["Announcements"],
        responses: {
          "200": { description: "Announcements" },
        },
      },
    },
    "/api/admin/stats": {
      get: {
        summary: "Admin stats overview",
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Stats" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" },
        },
      },
    },
    "/api/admin/announcements": {
      get: {
        summary: "List all announcements (admin)",
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Announcements" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" },
        },
      },
      post: {
        summary: "Create a new announcement",
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  body: { type: "string" },
                  type: { type: "string" },
                },
                required: ["title", "body"],
              },
            },
          },
        },
        responses: {
          "201": { description: "Created" },
          "400": { description: "Invalid payload" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" },
        },
      },
    },
    "/api/admin/announcements/{id}": {
      patch: {
        summary: "Update an announcement",
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  body: { type: "string" },
                  type: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Updated" },
          "400": { description: "Invalid id or payload" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" },
          "500": { description: "Server error" },
        },
      },
      delete: {
        summary: "Delete an announcement",
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          "204": { description: "Deleted" },
          "400": { description: "Invalid id" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" },
        },
      },
    },
    "/api/admin/logs": {
      get: {
        summary: "Get recent request logs (in-memory buffer)",
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Array of log lines" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" },
        },
      },
    },
    "/api/admin/users": {
      get: {
        summary: "List all users (admin)",
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Users list" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" },
        },
      },
      post: {
        summary: "Create a new user (admin)",
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                  fullName: { type: "string" },
                  role: { type: "string" },
                },
                required: ["email", "password"],
              },
            },
          },
        },
        responses: {
          "200": { description: "Created user" },
          "400": { description: "Invalid payload" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" },
        },
      },
    },
    "/api/admin/users/{id}": {
      patch: {
        summary: "Update user (admin)",
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  fullName: { type: "string" },
                  avatarUrl: { type: "string" },
                  role: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Updated user" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" },
          "404": { description: "User not found" },
        },
      },
      delete: {
        summary: "Delete user (admin)",
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": { description: "Deleted" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" },
          "404": { description: "User not found" },
        },
      },
    },
    "/api/admin/problems": {
      get: {
        summary: "List all problems (admin)",
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Problems list with testcase counts" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" },
        },
      },
      post: {
        summary: "Create a new problem (admin)",
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  difficulty: { $ref: "#/components/schemas/ProblemDifficulty" },
                  testCases: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        inputData: { type: "string" },
                        expectedOutput: { type: "string" },
                        isHidden: { type: "boolean" },
                      },
                    },
                  },
                },
                required: ["title", "description"],
              },
            },
          },
        },
        responses: {
          "200": { description: "Created problem" },
          "400": { description: "Invalid payload" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" },
        },
      },
    },
    "/api/admin/problems/import": {
      post: {
        summary: "Import multiple problems (admin)",
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  problems: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        difficulty: { type: "string" },
                        testCases: { type: "array", items: { type: "object" } },
                      },
                    },
                  },
                },
                required: ["problems"],
              },
            },
          },
        },
        responses: {
          "200": { description: "Import result with count and list" },
          "400": { description: "Invalid payload" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" },
        },
      },
    },
    "/api/admin/problems/{id}": {
      get: {
        summary: "Get problem detail with test cases (admin)",
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": { description: "Problem with full test cases" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" },
          "404": { description: "Problem not found" },
        },
      },
      patch: {
        summary: "Update problem (admin)",
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  difficulty: { type: "string" },
                  testCases: { type: "array", items: { type: "object" } },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Updated problem" },
          "400": { description: "Invalid payload" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" },
          "404": { description: "Problem not found" },
        },
      },
      delete: {
        summary: "Delete problem (admin)",
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": { description: "Deleted" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" },
          "404": { description: "Problem not found" },
        },
      },
    },
    "/api/admin/submissions": {
      get: {
        summary: "List all submissions (admin)",
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "limit", in: "query", schema: { type: "integer", default: 100 } },
        ],
        responses: {
          "200": { description: "Submissions list" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" },
        },
      },
    },
    "/api/admin/ai-feedback": {
      get: {
        summary: "List AI feedback for submissions (admin)",
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "AI feedback list" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" },
        },
      },
    },
    "/api/submissions/internal/judge": {
      post: {
        summary: "Internal judge (worker only)",
        description:
          "Called by the judge worker with x-internal-judge-token. Not for frontend or public use.",
        tags: ["Submissions"],
        security: [],
        parameters: [
          {
            name: "x-internal-judge-token",
            in: "header",
            required: true,
            schema: { type: "string" },
            description: "Internal token from INTERNAL_JUDGE_TOKEN env",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { submissionId: { type: "string", format: "uuid" } },
                required: ["submissionId"],
              },
            },
          },
        },
        responses: {
          "200": { description: "Submission judged; returns submission, evaluation, aiFeedback" },
          "401": { description: "Missing or invalid internal token" },
          "404": { description: "Submission not found" },
          "500": { description: "Judge error" },
        },
      },
    },
    "/api-docs/openapi.json": {
      get: {
        summary: "OpenAPI 3.0 JSON spec",
        tags: ["Meta"],
        responses: { "200": { description: "OpenAPI document" } },
      },
    },
  },
};

