import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import type Fastify from "fastify";
import { createApp } from "@/app.js";
import { MongoMemoryServer } from "mongodb-memory-server";
import * as mongodb from "mongodb";

let mongoServer: MongoMemoryServer;
let mongoClient: mongodb.MongoClient;
let db: mongodb.Db;
let fastify: Fastify.FastifyInstance;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  vi.stubEnv('DB_URL', uri);
  vi.stubEnv('DB_NAME', 'apibench');
  vi.stubEnv('APPLICATION_NAME', 'apibench');
  vi.stubEnv('APPLICATION_PORT', '3111');
  vi.stubEnv('LOG_LEVEL', 'silent');
  fastify = await createApp();

  mongoClient = await mongodb.MongoClient.connect(uri, {});
  db = mongoClient.db(fastify.configuration.DB_NAME);

});

afterAll(async () => {
  await mongoClient.close();
  await mongoServer.stop();
  await fastify.close();
});

beforeEach(async () => {
  await db.collection("users").deleteMany({});
});

describe("User API", () => {
  it("creates a new user with slugified username", async () => {
    const resp = await fastify.inject({
      method: "POST",
      url: "/users",
      payload: {
        name: "Test User",
        email: "test1@example.com",
        password: "SecretPass123",
        username: "User Name With Spaces",
        isActive: true,
      },
    });
    expect(resp.statusCode).toBe(201);
    const user = resp.json();
    expect(user).toHaveProperty("id");
    expect(user.username).toBe("user-name-with-spaces");
    expect(user).not.toHaveProperty("password");
    expect(user.name).toBe("Test User");
  });

  it("rejects duplicate usernames", async () => {
    // Create one user
    await fastify.inject({
      method: "POST",
      url: "/users",
      payload: {
        name: "Test User",
        email: "test2@example.com",
        password: "SecretPass123",
        username: "duplicate",
        isActive: true,
      },
    });
    // Try to create another user with the same username
    const resp = await fastify.inject({
      method: "POST",
      url: "/users",
      payload: {
        name: "Other User",
        email: "test3@example.com",
        password: "AnotherSecret123",
        username: "duplicate",
        isActive: true,
      },
    });
    expect(resp.statusCode).toBe(409);
    expect(resp.json().message).toMatch(/already exists/);
  });

  it("stores the password as a hash", async () => {
    await fastify.inject({
      method: "POST",
      url: "/users",
      payload: {
        name: "Hash User",
        email: "hash@example.com",
        password: "ImportantPassword",
        isActive: true,
      },
    });
    const doc = await db
      .collection("users")
      .findOne({ email: "hash@example.com" });
    expect(doc).toBeTruthy();
    expect(doc?.password).not.toBe("ImportantPassword");
    expect(doc?.password.length).toBeGreaterThan(20);
  });

  it("lists users with correct sort and removes password", async () => {
    await db.collection("users").insertMany([
      {
        name: "AAA user",
        email: "a@example.com",
        password: "x",
        createdAt: new Date("2020-01-01"),
        updatedAt: new Date(),
        username: "aaa-user",
        isActive: true,
      },
      {
        name: "BBB user",
        email: "b@example.com",
        password: "x",
        createdAt: new Date("2021-01-01"),
        updatedAt: new Date(),
        username: "bbb-user",
        isActive: true,
      },
    ]);
    let resp = await fastify.inject({
      method: "GET",
      url: "/users?created=asc",
    });
    expect(resp.statusCode).toBe(200);
    let data = resp.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(2);
    expect(data[0].name).toBe("AAA user");
    expect(data[1].name).toBe("BBB user");
    // biome-ignore lint/complexity/noForEach: <explanation>
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    data.forEach((u: any) => expect(u).not.toHaveProperty("password"));

    // List desc
    resp = await fastify.inject({
      method: "GET",
      url: "/users?created=desc",
    });
    data = resp.json();
    expect(data[0].name).toBe("BBB user");
    expect(data[1].name).toBe("AAA user");
  });
});
