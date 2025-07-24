import fp from "fastify-plugin";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  ErrorSchema,
  QuerySchema,
  UserList,
  type QueryType,
  type UserListType,
} from "@/types.js";

export default fp(
  async (fastify) => {
    const app = fastify.withTypeProvider<ZodTypeProvider>();

    app.route<{
      Querystring: QueryType;
      Reply: UserListType;
    }>({
      method: "GET",
      schema: {
        description: "List all the available users",
        tags: ["users"],
        querystring: QuerySchema,
        response: {
          200: UserList,
          400: ErrorSchema,
        },
      },
      url: "/users",
      handler: async (request, reply) => {
        const sortDir = request.query.created.toLowerCase() === "asc" ? 1 : -1;

        const cursor = fastify.db.users
          .find({}, { projection: { password: 0 } })
          .sort({ createdAt: sortDir });
        const users = await cursor.toArray();

        const safeUsers = users.map(({ _id, id, password, ...rest }) => ({
          id: _id.toString(),
          ...rest,
        }));

        reply.statusCode = 200;
        return safeUsers;
      },
    });
  },
  {
    name: "users-get",
    dependencies: ["configuration", "db"],
  }
);
