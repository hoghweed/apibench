import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUI from '@fastify/swagger-ui'
import fp from 'fastify-plugin'
import { jsonSchemaTransform, jsonSchemaTransformObject } from 'fastify-type-provider-zod'
import pkg from '../../package.json' with { type: 'json'};

export default fp(
  async (fastify) => {
    fastify.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'API Bench',
          description: pkg.description,
          version: pkg.version,
        },
        tags: [{ name: 'users', description: 'Manage application users' }],
      },
      transform: jsonSchemaTransform,
      transformObject: jsonSchemaTransformObject
    });

    fastify.register(fastifySwaggerUI, {
      routePrefix: '/documentation',
      uiConfig: {
        docExpansion: 'full',
        deepLinking: false,
      },
    })
  },
  { name: 'swagger' },
)
