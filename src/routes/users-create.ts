import { DuplicateError } from "@/errors/duplicate-error.js";
import fp from "fastify-plugin";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import bcrypt from "bcrypt";
import { ErrorSchema, User, type UserType } from "@/types.js";
import { OperationFailedError } from "@/errors/operation-failed-error.js";

const SALT_ROUNDS = 10;

const slugify = (str: string) => str.toLowerCase().replace(/\s+/g, '-');

export default fp(
  async (fastify) => {
    const app = fastify.withTypeProvider<ZodTypeProvider>();

    app.route<{
      Body: Omit<UserType, "id" | "createdAt" | "updatedAt">;
      Reply: Omit<UserType, "password">;
    }>({
      method: "POST",
      schema: {
        description: "Create a new user",
        tags: ["users"],
        body: User.omit({ id: true, createdAt: true, updatedAt: true }),
        response: {
          201: User.omit({ password: true }),
          409: ErrorSchema,
        },
      },
      url: "/users",
      handler: async (request, reply) => {
        const newUser = request.body as UserType;
        newUser.username = slugify(newUser.username || newUser.name);

        const exists = await fastify.db.users.findOne({ username: newUser.username });
        if (exists) {
          throw new DuplicateError(`A user with username ${newUser.username} already exists`);
        }

        newUser.createdAt = new Date();
        newUser.updatedAt = new Date();
        newUser.password = await bcrypt.hash(newUser.password, SALT_ROUNDS);

        const { insertedId } = await fastify.db.users.insertOne(newUser);

        if (!insertedId) {
          throw new OperationFailedError(`It wasn't possible to save the user, please try again`);
        }

        // Exclude password and any id from response, set id using insertedId
        const { password, id, ...rest } = newUser;
        reply.statusCode = 201;

        return {
          id: insertedId.toString(),
          ...rest,
        };
      },
    });
  },
  {
    name: "users-create",
    dependencies: ["configuration", "db"],
  }
);
