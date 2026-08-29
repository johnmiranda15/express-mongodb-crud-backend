import mongoose from "mongoose";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import Task from "../src/model/Task.js";
import User from "../src/model/User.js";
import { runMigration } from "../src/utils/migrateLegacyTasks.js";

let uri;

beforeAll(async () => {
  uri = globalThis.__TEST_URI__;
});

beforeEach(async () => {
  await Task.collection.drop().catch(() => {});
  await User.collection.drop().catch(() => {});
  await User.init();
  await Task.init();
});

describe("migrateLegacyTasks / runMigration", () => {
  it("asigna owner del admin a las tareas sin owner y no toca las que ya lo tienen", async () => {
    const admin = await User.create({
      username: "admin",
      email: "migrate@test.com",
      password: "x",
      role: "admin",
    });
    const other = await User.create({
      username: "otro",
      email: "otro@test.com",
      password: "x",
    });

    const legacy1 = await Task.collection.insertOne({ title: "legacy1", done: false });
    const legacy2 = await Task.collection.insertOne({ title: "legacy2", done: true });
    const owned = await Task.create({ title: "con owner", owner: other._id });

    const result = await runMigration({ uri, adminEmail: admin.email });

    expect(result.legacyCount).toBe(2);
    expect(result.modified).toBe(2);
    expect(result.adminEmail).toBe(admin.email);

    const afterLegacy = await Task.collection.findOne({ _id: legacy1.insertedId });
    expect(String(afterLegacy.owner)).toBe(String(admin._id));
    const afterOwned = await Task.findById(owned._id);
    expect(String(afterOwned.owner)).toBe(String(other._id));
  });

  it("aborta con error si no existe admin", async () => {
    const t = await Task.collection.insertOne({ title: "sin admin" });
    await expect(
      runMigration({ uri, adminEmail: "no-existo@test.com" })
    ).rejects.toThrow(/No se encontró admin/);
    const after = await Task.collection.findOne({ _id: t.insertedId });
    expect(after.owner).toBeUndefined();
  });

  it("es idempotente: ejecutada dos veces no vuelve a modificar nada", async () => {
    const admin = await User.create({
      username: "admin2",
      email: "migrate2@test.com",
      password: "x",
      role: "admin",
    });
    await Task.collection.insertOne({ title: "legacy-idem", done: false });

    const first = await runMigration({ uri, adminEmail: admin.email });
    const second = await runMigration({ uri, adminEmail: admin.email });

    expect(first.modified).toBe(1);
    expect(second.legacyCount).toBe(0);
    expect(second.modified).toBe(0);
  });
});
