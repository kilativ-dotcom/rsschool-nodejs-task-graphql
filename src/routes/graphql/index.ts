import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
import { graphql, GraphQLSchema, parse, validate } from 'graphql';
import { MemberType } from './types/memberType.js';
import { Post } from './types/post.js';
import { Profile } from './types/profile.js';
import { User } from './types/user.js';
import { RootQueryType } from './schema/query.js';
import { Mutations } from './schema/mutation.js';
import depthLimit from 'graphql-depth-limit';

const MAX_QUERY_DEPTH = 5;

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { prisma } = fastify;

  const schemaUpdated = new GraphQLSchema({
    query: RootQueryType,
    mutation: Mutations,
    types: [MemberType, Post, Profile, User],
  });

  fastify.route({
    url: '/',
    method: 'POST',
    schema: {
      ...createGqlResponseSchema,
      response: {
        200: gqlResponseSchema,
      },
    },
    async handler(req) {
      const { query, variables } = req.body;
      try {
        const parsedQuery = parse(query);
        const validationErrors = validate(schemaUpdated, parsedQuery, [
          depthLimit(MAX_QUERY_DEPTH),
        ]);
        if (validationErrors.length > 0) {
          return {
            errors: validationErrors.map((error) => ({
              message: error.message,
            })),
          };
        }
        return await graphql({
          schema: schemaUpdated,
          source: query,
          variableValues: variables,
        });
      } catch (error) {
        console.error(error);
        return {
          errors: [
            {
              message: error instanceof Error ? error.message : 'Unknown error',
            },
          ],
        };
      }
    },
  });
};

export default plugin;
