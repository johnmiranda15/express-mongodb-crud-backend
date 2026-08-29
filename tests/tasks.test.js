import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import Task from "../src/model/Task.js";
import User from "../src/model/User.js";

let userToken;
let adminToken;
let user;
let admin;

const registerAndLogin = async (overrides = {}) => {
  const payload = {
    username: "testuser",
    email: "test@example.com",
    password: "secret123",
    ...overrides,
  };
  const res = await request(app).post("/api/auth/register").send(payload);
  return res;
};

beforeAll(async () => {
  const userRes = await registerAndLogin();
  userToken = userRes.body.token;

  const adminRes = await registerAndLogin({
    username: "admin",
    email: "admin@example.com",
    password: "secret123",
    role: "admin",
  });
  adminToken = adminRes.body.token;

  user = await User.findOne({ email: "test@example.com" });
  admin = await User.findOne({ email: "admin@example.com" });
});

beforeEach(async () => {
  await Task.deleteMany({});
});

describe("AUTH /api/auth", () => {
  it("should register a new user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: "juan", email: "juan@example.com", password: "secret123" });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe("user");
  });

  it("should return 400 when data missing", async () => {
    const res = await request(app).post("/api/auth/register").send({ username: "juan" });
    expect(res.status).toBe(400);
  });

  it("should return 409 when email already exists", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ username: "dupuser1", email: "dup@example.com", password: "secret123" });
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: "dupuser2", email: "dup@example.com", password: "secret123" });

    expect(res.status).toBe(409);
  });

  it("should login with valid credentials", async () => {
    await User.create({ username: "x", email: "x@example.com", password: "secret123" });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "x@example.com", password: "secret123" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it("should return 401 with invalid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "x@example.com", password: "wrong" });

    expect(res.status).toBe(401);
  });
});

describe("GET /api/tasks", () => {
  it("should return 401 without token", async () => {
    const res = await request(app).get("/api/tasks");
    expect(res.status).toBe(401);
  });

  it("user should only see their own tasks", async () => {
    await Task.create({ title: "Mine", owner: user._id });
    await Task.create({ title: "Other", owner: admin._id });

    const res = await request(app).get("/api/tasks").set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe("Mine");
  });

  it("admin should see all tasks", async () => {
    await Task.create({ title: "Mine", owner: user._id });
    await Task.create({ title: "Other", owner: admin._id });

    const res = await request(app).get("/api/tasks").set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});

describe("POST /api/tasks", () => {
  it("should create a new task with owner set", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ title: "New task", description: "Description" });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe("New task");
    expect(String(res.body.owner)).toBe(String(user._id));
  });

  it("should return 400 when title is missing", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ description: "No title" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Title is required");
  });
});

describe("GET /api/tasks/:id", () => {
  it("should return a task owned by the user", async () => {
    const task = await Task.create({ title: "Test task", owner: user._id });

    const res = await request(app)
      .get(`/api/tasks/${task._id}`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Test task");
  });

  it("should return 403 when user tries to read others' task", async () => {
    const task = await Task.create({ title: "Other", owner: admin._id });

    const res = await request(app)
      .get(`/api/tasks/${task._id}`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it("admin should read any task", async () => {
    const task = await Task.create({ title: "Other", owner: user._id });

    const res = await request(app)
      .get(`/api/tasks/${task._id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});

describe("PUT /api/tasks/:id", () => {
  it("user should update their own task", async () => {
    const task = await Task.create({ title: "Original", owner: user._id });

    const res = await request(app)
      .put(`/api/tasks/${task._id}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ title: "Updated", done: true });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Updated");
  });

  it("should return 403 when user updates others' task", async () => {
    const task = await Task.create({ title: "Other", owner: admin._id });

    const res = await request(app)
      .put(`/api/tasks/${task._id}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ title: "Hacked" });

    expect(res.status).toBe(403);
  });

  it("admin should update any task", async () => {
    const task = await Task.create({ title: "Other", owner: user._id });

    const res = await request(app)
      .put(`/api/tasks/${task._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Admin updated" });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Admin updated");
  });
});

describe("PATCH /api/tasks/:id/toggle", () => {
  it("user should toggle their own task", async () => {
    const task = await Task.create({ title: "Toggle me", owner: user._id });

    const res = await request(app)
      .patch(`/api/tasks/${task._id}/toggle`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.done).toBe(true);
  });

  it("should return 403 toggling others' task", async () => {
    const task = await Task.create({ title: "Other", owner: admin._id });

    const res = await request(app)
      .patch(`/api/tasks/${task._id}/toggle`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it("admin should toggle a legacy task without owner (no 500)", async () => {
    // Tareas viejas creadas antes del campo owner no tienen dueño
    const inserted = await Task.collection.insertOne({ title: "Legacy", done: false });
    const res = await request(app)
      .patch(`/api/tasks/${inserted.insertedId}/toggle`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.done).toBe(true);
  });
});

describe("DELETE /api/tasks/:id", () => {
  it("user should delete their own task", async () => {
    const task = await Task.create({ title: "Delete me", owner: user._id });

    const res = await request(app)
      .delete(`/api/tasks/${task._id}`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Task deleted successfully");
  });

  it("should return 403 when user deletes others' task", async () => {
    const task = await Task.create({ title: "Other", owner: admin._id });

    const res = await request(app)
      .delete(`/api/tasks/${task._id}`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it("admin should delete any task", async () => {
    const task = await Task.create({ title: "Other", owner: user._id });

    const res = await request(app)
      .delete(`/api/tasks/${task._id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});

describe("GET /", () => {
  it("should return welcome message", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Backend ejecutandose correctamente");
  });
});
