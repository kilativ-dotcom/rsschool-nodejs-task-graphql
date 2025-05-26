import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
import {graphql, GraphQLObjectType, GraphQLList, GraphQLString, GraphQLSchema, GraphQLNonNull, parse, validate} from 'graphql';
import {UUIDType, UUIDArgs} from "./types/uuid.js";
import {MemberTypeId, MemberType} from "./types/memberType.js";
import {Post, CreatePostInput, ChangePostInput, CreatePostArgs, ChangePostArgs} from "./types/post.js";
import {Profile, CreateProfileInput, ChangeProfileInput, CreateProfileArgs, ChangeProfileArgs } from "./types/profile.js";
import {User, CreateUserInput, ChangeUserInput, CreateUserArgs, ChangeUserArgs, SubscriptionArgs} from "./types/user.js";
import depthLimit from "graphql-depth-limit";

const MAX_QUERY_DEPTH = 5;

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { prisma } = fastify;

  const RootQueryType = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
      memberTypes: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(MemberType))),
        resolve: () => prisma.memberType.findMany()
      },
      memberType: {
        type: MemberType,
        args: {
          id: { type: new GraphQLNonNull(MemberTypeId) }
        },
        resolve: async (_, args: { id: 'BASIC' | 'BUSINESS' }) => {
          return await prisma.memberType.findUnique({
            where: { id: args.id }
          });
        }
      },
      users: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(User))),
        resolve: (_, __) => prisma.user.findMany()
      },
      user: {
        type: User,
        args: {
          id: { type: new GraphQLNonNull(UUIDType) }
        },
        resolve: (_, args: UUIDArgs) => prisma.user.findUnique({ where: { id: args.id } })
      },
      posts: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Post))),
        resolve: (_, __) => prisma.post.findMany()
      },
      post: {
        type: Post,
        args: {
          id: { type: new GraphQLNonNull(UUIDType) }
        },
        resolve: (_, args: UUIDArgs) => prisma.post.findUnique({ where: { id: args.id } })
      },
      profiles: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Profile))),
        resolve: (_, __) => prisma.profile.findMany()
      },
      profile: {
        type: Profile,
        args: {
          id: { type: new GraphQLNonNull(UUIDType) }
        },
        resolve: (_, args: UUIDArgs) => prisma.profile.findUnique({ where: { id: args.id } })
      }
    }
  });

  const Mutations = new GraphQLObjectType({
    name: 'Mutations',
    fields: {
      createUser: {
        type: new GraphQLNonNull(User),
        args: {
          dto: { type: new GraphQLNonNull(CreateUserInput) }
        },
        resolve: (_, args: CreateUserArgs) => prisma.user.create({ data: args.dto })
      },
      createProfile: {
        type: new GraphQLNonNull(Profile),
        args: {
          dto: { type: new GraphQLNonNull(CreateProfileInput) }
        },
        resolve: (_, args: CreateProfileArgs) => prisma.profile.create({ data: args.dto })
      },
      createPost: {
        type: new GraphQLNonNull(Post),
        args: {
          dto: { type: new GraphQLNonNull(CreatePostInput) }
        },
        resolve: (_, args: CreatePostArgs) => prisma.post.create({ data: args.dto })
      },
      changePost: {
        type: new GraphQLNonNull(Post),
        args: {
          id: { type: new GraphQLNonNull(UUIDType) },
          dto: { type: new GraphQLNonNull(ChangePostInput) }
        },
        resolve: (_, args: ChangePostArgs) =>
            prisma.post.update({ where: { id: args.id }, data: args.dto })
      },
      changeProfile: {
        type: new GraphQLNonNull(Profile),
        args: {
          id: { type: new GraphQLNonNull(UUIDType) },
          dto: { type: new GraphQLNonNull(ChangeProfileInput) }
        },
        resolve: (_, args: ChangeProfileArgs) =>
            prisma.profile.update({ where: { id: args.id }, data: args.dto })
      },
      changeUser: {
        type: new GraphQLNonNull(User),
        args: {
          id: { type: new GraphQLNonNull(UUIDType) },
          dto: { type: new GraphQLNonNull(ChangeUserInput) }
        },
        resolve: (_, args: ChangeUserArgs) =>
            prisma.user.update({ where: { id: args.id }, data: args.dto })
      },
      deleteUser: {
        type: new GraphQLNonNull(GraphQLString),
        args: {
          id: { type: new GraphQLNonNull(UUIDType) }
        },
        resolve: async (_, args: UUIDArgs) => {
          await prisma.user.delete({ where: { id: args.id } });
          return args.id;
        }
      },
      deletePost: {
        type: new GraphQLNonNull(GraphQLString),
        args: {
          id: { type: new GraphQLNonNull(UUIDType) }
        },
        resolve: async (_,args: UUIDArgs) => {
          await prisma.post.delete({ where: { id: args.id } });
          return args.id;
        }
      },
      deleteProfile: {
        type: new GraphQLNonNull(GraphQLString),
        args: {
          id: { type: new GraphQLNonNull(UUIDType) }
        },
        resolve: async (_, args: UUIDArgs) => {
          await prisma.profile.delete({ where: { id: args.id } });
          return args.id;
        }
      },
      subscribeTo: {
        type: new GraphQLNonNull(GraphQLString),
        args: {
          userId: { type: new GraphQLNonNull(UUIDType) },
          authorId: { type: new GraphQLNonNull(UUIDType) }
        },
        resolve: async (_, args: SubscriptionArgs) => {
          await prisma.user.update({
            where: { id: args.userId },
            data: {
              userSubscribedTo: {
                create: {
                  authorId: args.authorId
                }
              }
            }
          });
          return args.userId;
        }
      },
      unsubscribeFrom: {
        type: new GraphQLNonNull(GraphQLString),
        args: {
          userId: { type: new GraphQLNonNull(UUIDType) },
          authorId: { type: new GraphQLNonNull(UUIDType) }
        },
        resolve: async (_, args: SubscriptionArgs) => {
          await prisma.user.delete({
            where: {
              id: args.userId,
              userSubscribedTo: {
                some: {
                  authorId: args.authorId
                }
              }
            }
          });
          return args.userId;
        }
      }
    }
  });
  const schemaUpdated = new GraphQLSchema({
    query: RootQueryType,
    mutation: Mutations,
    types: [MemberType, Post, Profile, User]
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
      console.log("req.body", req.body);
      const { query, variables } = req.body;
      try {
        const parsedQuery = parse(query);
        const validationErrors = validate(schemaUpdated, parsedQuery, [depthLimit(MAX_QUERY_DEPTH)]);
        if (validationErrors.length > 0) {
          return {
            errors: validationErrors.map((error) => ({
              message: error.message,
            })),
          };
        }
        const result = await graphql({
          schema: schemaUpdated,
          source: query,
          variableValues: variables,
        });
        console.log("result", result);

        return result;
      } catch (error) {
        console.error(error);
        return {
          errors: [{
            message: error instanceof Error ? error.message : 'Unknown error',
          }]
        };
      }
    },
  });
};

export default plugin;
