import fp from "fastify-plugin";
import { MongoClient, type Db, type Collection } from "mongodb";
import type { UserType } from "@/types.js";

export default fp(
  async (fastify) => {
    // Get DB connection string from configuration
    const url = fastify.configuration.DB_URL;
    const client = new MongoClient(url);
    await client.connect();

    const db = client.db(fastify.configuration.DB_NAME);

    // Decorate Fastify with a `db` object exposing `users` collection
    fastify.decorate("db", {
      users: db.collection<UserType>("users"),
      // the following is just in case we need it later (optional)
      _client: client,
      _db: db,
    });

    // Optionally handle close/shutdown hook
    fastify.addHook("onClose", async () => {
      await client.close();
    });
  },
  { name: "db", dependencies: ["configuration"] }
);

declare module "fastify" {
  interface FastifyInstance {
    db: {
      users: Collection<UserType>;
      _client: MongoClient;
      _db: Db;
    };
  }
}
