// jest.setup.ts
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import connectDB from "./config/db";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  process.env.API_KEY = "test-secret";
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await connectDB(uri);  // connect to the in-memory DB
});

afterEach(async () => {
  // Clean all collections so each test runs in isolation
  const collections = await mongoose.connection.db!.collections();
  for (let collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  // Drop DB and close connections
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongo) {
    await mongo.stop();
  }
});
