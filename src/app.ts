import autoload from "@fastify/autoload";
import arecibo from "arecibo";
import Fastify, {
  type FastifyInstance,
  type FastifyServerOptions,
} from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export async function createApp(
  opts: FastifyServerOptions = {}
): Promise<FastifyInstance> {
  const __dirname = dirname(fileURLToPath(import.meta.url));

  // Get log level from env, default to 'info'
  const logLevel = process.env.LOG_LEVEL || "info";

  // Conditionally set transport
  const loggerOptions =
    logLevel === "silent"
      ? { enabled: false }
      : {
          level: logLevel,
          transport:
            logLevel === "debug" // or whatever condition you want
              ? {
                  target: "@fastify/one-line-logger",
                }
              : undefined,
        };

  const app = Fastify(
    Object.assign(opts, {
      logger: loggerOptions,
    })
  );
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(arecibo, {
    message: "API Bench health check",
    logLevel: "info",
    readinessURL: "/healthz",
    livenessURL: "/liveness",
  });

  await app.register(autoload, {
    dir: resolve(__dirname, "plugins"),
    forceESM: true,
  });
  await app.register(import("@scalar/fastify-api-reference"), {
    routePrefix: "/reference",
  });
  await app.register(autoload, {
    dir: resolve(__dirname, "routes"),
    prefix: "api",
    maxDepth: 1,
    ignorePattern: /^.*(?:test|spec|entity).*(?:js|ts)$/,
  });

  return app;
}
