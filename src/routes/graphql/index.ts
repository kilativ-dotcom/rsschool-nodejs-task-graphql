import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
import {graphql, GraphQLObjectType, GraphQLInputObjectType, GraphQLScalarType, GraphQLList, GraphQLString, GraphQLBoolean, GraphQLSchema, GraphQLEnumType, GraphQLNonNull, GraphQLFloat, GraphQLInt, buildSchema} from 'graphql';
import {UUIDType} from "./types/uuid.js";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { prisma } = fastify;

  const MemberTypeId = new GraphQLEnumType({
    name: 'MemberTypeId',
    values: {
      BASIC: { value: 'BASIC' },
      BUSINESS: { value: 'BUSINESS' }
    }
  });

  const MemberType = new GraphQLObjectType({
    name: 'MemberType',
    fields: () => ({
      id: { type: new GraphQLNonNull(MemberTypeId) },
      discount: { type: new GraphQLNonNull(GraphQLFloat) },
      postsLimitPerMonth: { type: new GraphQLNonNull(GraphQLInt) }
    })
  });

  const Post = new GraphQLObjectType({
    name: 'Post',
    fields: () => ({
      id: { type: new GraphQLNonNull(UUIDType) },
      title: { type: new GraphQLNonNull(GraphQLString) },
      content: { type: new GraphQLNonNull(GraphQLString) }
    })
  });

  const Profile = new GraphQLObjectType({
    name: 'Profile',
    fields: () => ({
      id: { type: new GraphQLNonNull(UUIDType) },
      isMale: { type: new GraphQLNonNull(GraphQLBoolean) },
      yearOfBirth: { type: new GraphQLNonNull(GraphQLInt) },
      memberType: {
        type: new GraphQLNonNull(MemberType),
        resolve: (parent: UUIDArgs, _) => {
          return prisma.profile.findUnique({
            where: { id: parent.id },
            include: { memberType: true }
          }).then(profile => profile?.memberType);
        }
      },
      userId: {
        type: UUIDType,
        resolve: (parent: UUIDArgs, _) => {
          return prisma.profile.findUnique({
            where: { id: parent.id },
            include: { user: true }
          }).then(profile => profile?.user.id);
        }
      }
    })
  });

  const User = new GraphQLObjectType({
    name: 'User',
    fields: () => ({
      id: { type: new GraphQLNonNull(UUIDType) },
      name: { type: new GraphQLNonNull(GraphQLString) },
      balance: { type: new GraphQLNonNull(GraphQLFloat) },
      profile: {
        type: Profile,
        resolve: (parent: UUIDArgs, _) => {
          return prisma.profile.findUnique({
            where: { userId: parent.id }
          });
        }
      },
      posts: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Post))),
        resolve: (parent: UUIDArgs, _) => {
          return prisma.post.findMany({
            where: { authorId: parent.id }
          });
        }
      },
      userSubscribedTo: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(User))),
        resolve: (parent: UUIDArgs, _) => {
          return prisma.user.findMany({
            where: { subscribedToUser: { some: { subscriberId: parent.id } } }
          });
        }
      },
      subscribedToUser: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(User))),
        resolve: (parent: UUIDArgs, _) => {
          return prisma.user.findMany({
            where: { userSubscribedTo: { some: { authorId: parent.id } } }
          });
        }
      }
    })
  });

  const ChangePostInput = new GraphQLInputObjectType({
    name: 'ChangePostInput',
    fields: {
      title: { type: GraphQLString },
      content: { type: GraphQLString }
    }
  });

  const ChangeProfileInput = new GraphQLInputObjectType({
    name: 'ChangeProfileInput',
    fields: {
      isMale: { type: GraphQLBoolean },
      yearOfBirth: { type: GraphQLInt },
      memberTypeId: { type: MemberTypeId }
    }
  });

  const ChangeUserInput = new GraphQLInputObjectType({
    name: 'ChangeUserInput',
    fields: {
      name: { type: GraphQLString },
      balance: { type: GraphQLFloat }
    }
  });

  const CreatePostInput = new GraphQLInputObjectType({
    name: 'CreatePostInput',
    fields: {
      title: { type: new GraphQLNonNull(GraphQLString) },
      content: { type: new GraphQLNonNull(GraphQLString) },
      authorId: { type: new GraphQLNonNull(UUIDType) }
    }
  });

  const CreateProfileInput = new GraphQLInputObjectType({
    name: 'CreateProfileInput',
    fields: {
      isMale: { type: new GraphQLNonNull(GraphQLBoolean) },
      yearOfBirth: { type: new GraphQLNonNull(GraphQLInt) },
      userId: { type: new GraphQLNonNull(UUIDType) },
      memberTypeId: { type: new GraphQLNonNull(MemberTypeId) }
    }
  });

  interface CreateUserArgs {
    dto: {
      name: string;
      balance: number;
    };
  }

  interface CreateProfileArgs {
    dto: {
      isMale: boolean;
      yearOfBirth: number;
      userId: string;
      memberTypeId: 'BASIC' | 'BUSINESS';
    };
  }

  interface CreatePostArgs {
    dto: {
      title: string;
      content: string;
      authorId: string;
    };
  }

  interface ChangePostArgs {
    id: string;
    dto: {
      title?: string;
      content?: string;
    };
  }

  interface ChangeProfileArgs {
    id: string;
    dto: {
      isMale?: boolean;
      yearOfBirth?: number;
      memberTypeId?: 'BASIC' | 'BUSINESS';
    };
  }

  interface ChangeUserArgs {
    id: string;
    dto: {
      name?: string;
      balance?: number;
    };
  }

  interface UUIDArgs {
    id: string;
  }

  interface SubscriptionArgs {
    userId: string;
    authorId: string;
  }

  const CreateUserInput = new GraphQLInputObjectType({
    name: 'CreateUserInput',
    fields: {
      name: { type: new GraphQLNonNull(GraphQLString) },
      balance: { type: new GraphQLNonNull(GraphQLFloat) }
    }
  });

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
