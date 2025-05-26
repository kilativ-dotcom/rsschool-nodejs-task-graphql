import { GraphQLList, GraphQLNonNull, GraphQLObjectType } from 'graphql/index.js';
import { MemberType, MemberTypeId } from '../types/memberType.js';
import { User } from '../types/user.js';
import { UUIDArgs, UUIDType } from '../types/uuid.js';
import { Post } from '../types/post.js';
import { Profile } from '../types/profile.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export const RootQueryType = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    memberTypes: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(MemberType))),
      resolve: () => prisma.memberType.findMany(),
    },
    memberType: {
      type: MemberType,
      args: {
        id: { type: new GraphQLNonNull(MemberTypeId) },
      },
      resolve: async (_, args: { id: 'BASIC' | 'BUSINESS' }) => {
        return await prisma.memberType.findUnique({
          where: { id: args.id },
        });
      },
    },
    users: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(User))),
      resolve: (_, __) => prisma.user.findMany(),
    },
    user: {
      type: User,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: (_, args: UUIDArgs) => prisma.user.findUnique({ where: { id: args.id } }),
    },
    posts: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Post))),
      resolve: (_, __) => prisma.post.findMany(),
    },
    post: {
      type: Post,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: (_, args: UUIDArgs) => prisma.post.findUnique({ where: { id: args.id } }),
    },
    profiles: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Profile))),
      resolve: (_, __) => prisma.profile.findMany(),
    },
    profile: {
      type: Profile,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: (_, args: UUIDArgs) =>
        prisma.profile.findUnique({ where: { id: args.id } }),
    },
  },
});
