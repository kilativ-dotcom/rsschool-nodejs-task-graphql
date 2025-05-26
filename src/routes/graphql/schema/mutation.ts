import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql/index.js';
import {
  ChangeUserArgs,
  ChangeUserInput,
  CreateUserArgs,
  CreateUserInput,
  SubscriptionArgs,
  User,
} from '../types/user.js';
import {
  ChangeProfileArgs,
  ChangeProfileInput,
  CreateProfileArgs,
  CreateProfileInput,
  Profile,
} from '../types/profile.js';
import {
  ChangePostArgs,
  ChangePostInput,
  CreatePostArgs,
  CreatePostInput,
  Post,
} from '../types/post.js';
import { UUIDArgs, UUIDType } from '../types/uuid.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export const Mutations = new GraphQLObjectType({
  name: 'Mutations',
  fields: {
    createUser: {
      type: new GraphQLNonNull(User),
      args: {
        dto: { type: new GraphQLNonNull(CreateUserInput) },
      },
      resolve: (_, args: CreateUserArgs) => prisma.user.create({ data: args.dto }),
    },
    createProfile: {
      type: new GraphQLNonNull(Profile),
      args: {
        dto: { type: new GraphQLNonNull(CreateProfileInput) },
      },
      resolve: (_, args: CreateProfileArgs) => prisma.profile.create({ data: args.dto }),
    },
    createPost: {
      type: new GraphQLNonNull(Post),
      args: {
        dto: { type: new GraphQLNonNull(CreatePostInput) },
      },
      resolve: (_, args: CreatePostArgs) => prisma.post.create({ data: args.dto }),
    },
    changePost: {
      type: new GraphQLNonNull(Post),
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
        dto: { type: new GraphQLNonNull(ChangePostInput) },
      },
      resolve: (_, args: ChangePostArgs) =>
        prisma.post.update({ where: { id: args.id }, data: args.dto }),
    },
    changeProfile: {
      type: new GraphQLNonNull(Profile),
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
        dto: { type: new GraphQLNonNull(ChangeProfileInput) },
      },
      resolve: (_, args: ChangeProfileArgs) =>
        prisma.profile.update({ where: { id: args.id }, data: args.dto }),
    },
    changeUser: {
      type: new GraphQLNonNull(User),
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
        dto: { type: new GraphQLNonNull(ChangeUserInput) },
      },
      resolve: (_, args: ChangeUserArgs) =>
        prisma.user.update({ where: { id: args.id }, data: args.dto }),
    },
    deleteUser: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (_, args: UUIDArgs) => {
        await prisma.user.delete({ where: { id: args.id } });
        return args.id;
      },
    },
    deletePost: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (_, args: UUIDArgs) => {
        await prisma.post.delete({ where: { id: args.id } });
        return args.id;
      },
    },
    deleteProfile: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (_, args: UUIDArgs) => {
        await prisma.profile.delete({ where: { id: args.id } });
        return args.id;
      },
    },
    subscribeTo: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        userId: { type: new GraphQLNonNull(UUIDType) },
        authorId: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (_, args: SubscriptionArgs) => {
        await prisma.user.update({
          where: { id: args.userId },
          data: {
            userSubscribedTo: {
              create: {
                authorId: args.authorId,
              },
            },
          },
        });
        return args.userId;
      },
    },
    unsubscribeFrom: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        userId: { type: new GraphQLNonNull(UUIDType) },
        authorId: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (_, args: SubscriptionArgs) => {
        await prisma.user.delete({
          where: {
            id: args.userId,
            userSubscribedTo: {
              some: {
                authorId: args.authorId,
              },
            },
          },
        });
        return args.userId;
      },
    },
  },
});
