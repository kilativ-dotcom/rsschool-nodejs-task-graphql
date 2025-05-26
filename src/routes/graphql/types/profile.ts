import {GraphQLBoolean, GraphQLInputObjectType, GraphQLInt, GraphQLNonNull, GraphQLObjectType} from "graphql/index.js";
import {UUIDType, UUIDArgs} from "./uuid.js";
import {MemberType, MemberTypeId} from "./memberType.js";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
process.on('beforeExit', async () => {
    await prisma.$disconnect()
});

export const Profile = new GraphQLObjectType({
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

export const CreateProfileInput = new GraphQLInputObjectType({
    name: 'CreateProfileInput',
    fields: {
        isMale: { type: new GraphQLNonNull(GraphQLBoolean) },
        yearOfBirth: { type: new GraphQLNonNull(GraphQLInt) },
        userId: { type: new GraphQLNonNull(UUIDType) },
        memberTypeId: { type: new GraphQLNonNull(MemberTypeId) }
    }
});

export interface CreateProfileArgs {
    dto: {
        isMale: boolean;
        yearOfBirth: number;
        userId: string;
        memberTypeId: 'BASIC' | 'BUSINESS';
    };
}

export const ChangeProfileInput = new GraphQLInputObjectType({
    name: 'ChangeProfileInput',
    fields: {
        isMale: { type: GraphQLBoolean },
        yearOfBirth: { type: GraphQLInt },
        memberTypeId: { type: MemberTypeId }
    }
});

export interface ChangeProfileArgs {
    id: string;
    dto: {
        isMale?: boolean;
        yearOfBirth?: number;
        memberTypeId?: 'BASIC' | 'BUSINESS';
    };
}
