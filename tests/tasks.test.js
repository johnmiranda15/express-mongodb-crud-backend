import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import Task from "../src/model/Task.js";

describe("GET /api/tasks", () => {
  beforeEach(async () => {
    await Task.deleteMany({});
  });

  it("should return an empty array when no tasks exist", async () => {
    const res = await request(app).get("/api/tasks");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("should return all tasks", async () => {
    await Task.create({ title: "Task 1" });
    await Task.create({ title: "Task 2" });

    const res = await request(app).get("/api/tasks");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});

describe("POST /api/tasks", () => {
  beforeEach(async () => {
    await Task.deleteMany({});
  });

  it("should create a new task", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ title: "New task", description: "Description" });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe("New task");
    expect(res.body.description).toBe("Description");
    expect(res.body.done).toBe(false);
  });

  it("should return 400 when title is missing", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ description: "No title" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Title is required");
  });

  it("should return 400 when title is empty", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ title: "   " });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Title is required");
  });
});

describe("GET /api/tasks/:id", () => {
  beforeEach(async () => {
    await Task.deleteMany({});
  });

  it("should return a task by id", async () => {
    const task = await Task.create({ title: "Test task" });

    const res = await request(app).get(`/api/tasks/${task._id}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Test task");
  });

  it("should return 500 for invalid id format", async () => {
    const res = await request(app).get("/api/tasks/invalid-id");
    expect(res.status).toBe(500);
  });
});

describe("PUT /api/tasks/:id", () => {
  beforeEach(async () => {
    await Task.deleteMany({});
  });

  it("should update a task", async () => {
    const task = await Task.create({ title: "Original" });

    const res = await request(app)
      .put(`/api/tasks/${task._id}`)
      .send({ title: "Updated", done: true });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Updated");
    expect(res.body.done).toBe(true);
  });

  it("should return 404 when task not found", async () => {
    const fakeId = "507f1f77bcf86cd799439011";
    const res = await request(app)
      .put(`/api/tasks/${fakeId}`)
      .send({ title: "Nope" });

    expect(res.status).toBe(404);
  });

  it("should return 400 when title is empty", async () => {
    const task = await Task.create({ title: "Task" });

    const res = await request(app)
      .put(`/api/tasks/${task._id}`)
      .send({ title: "   " });

    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/tasks/:id/toggle", () => {
  beforeEach(async () => {
    await Task.deleteMany({});
  });

  it("should toggle task done status", async () => {
    const task = await Task.create({ title: "Toggle me" });

    const res = await request(app).patch(`/api/tasks/${task._id}/toggle`);
    expect(res.status).toBe(200);
    expect(res.body.done).toBe(true);
  });

  it("should toggle back to false", async () => {
    const task = await Task.create({ title: "Toggle me", done: true });

    const res = await request(app).patch(`/api/tasks/${task._id}/toggle`);
    expect(res.status).toBe(200);
    expect(res.body.done).toBe(false);
  });

  it("should return 404 when task not found", async () => {
    const fakeId = "507f1f77bcf86cd799439011";
    const res = await request(app).patch(`/api/tasks/${fakeId}/toggle`);
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/tasks/:id", () => {
  beforeEach(async () => {
    await Task.deleteMany({});
  });

  it("should delete a task", async () => {
    const task = await Task.create({ title: "Delete me" });

    const res = await request(app).delete(`/api/tasks/${task._id}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Task deleted successfully");
  });

  it("should return 404 when task not found", async () => {
    const fakeId = "507f1f77bcf86cd799439011";
    const res = await request(app).delete(`/api/tasks/${fakeId}`);
    expect(res.status).toBe(404);
  });
});

describe("GET /", () => {
  it("should return welcome message", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Backend ejecutandose correctamente");
  });
});

describe("404 handler", () => {
  it("should return 404 for unknown routes", async () => {
    const res = await request(app).get("/api/unknown");
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Endpoint not found");
  });
});
