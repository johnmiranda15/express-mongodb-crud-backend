import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { beforeAll, afterAll } from "vitest";
import User from "../src/model/User.js";

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  await User.init();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
