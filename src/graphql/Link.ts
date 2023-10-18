import {
  arg,
  enumType,
  extendType,
  idArg,
  inputObjectType,
  intArg,
  list,
  nonNull,
  objectType,
  stringArg,
} from "nexus";
import { Link as LinkDb, Prisma } from "@prisma/client";
import { filterIncludes } from "../utils/filter-includes";

export const LinkOrderByInput = inputObjectType({
  name: "LinkOrderByInput",
  definition(t) {
    t.field("description", { type: Sort });
    t.field("url", { type: Sort });
    t.field("createdAt", { type: Sort });
  },
});

export const LinkIncludes = inputObjectType({
  name: "LinkIncludes",
  definition(t) {
    t.field("postedBy", { type: "Boolean", default: false });
    t.field("voters", { type: "Boolean", default: false });
  },
});

export const Sort = enumType({
  name: "Sort",
  members: ["asc", "desc"],
});

export const Link = objectType({
  name: "Link",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.string("description");
    t.nonNull.string("url");
    t.nonNull.dateTime("createdAt");
    t.field("postedBy", {
      type: "User",
    });
    t.list.nonNull.field("voters", {
      type: "User",
    });
  },
});

export const Feed = objectType({
  name: "Feed",
  definition(t) {
    t.nonNull.list.nonNull.field("links", { type: Link });
    t.nonNull.int("count");
    t.id("id");
  },
});

export const LinkQuery = extendType({
  type: "Query",
  definition(t) {
    t.nonNull.field("feed", {
      type: "Feed",
      args: {
        filter: stringArg(),
        skip: intArg(),
        take: intArg(),
        orderBy: arg({ type: list(nonNull(LinkOrderByInput)) }),
        includes: arg({ type: LinkIncludes }),
      },
      async resolve(parent, args, context) {
        const where = args.filter
          ? {
              OR: [
                { description: { contains: args.filter } },
                { url: { contains: args.filter } },
              ],
            }
          : {};

        const links = await context.prisma.link.findMany({
          where,
          skip: args?.skip as number | undefined,
          take: args?.take as number | undefined,
          orderBy: args?.orderBy as
            | Prisma.Enumerable<Prisma.LinkOrderByWithRelationInput>
            | undefined,
          include: filterIncludes(args.includes),
        });

        const count = await context.prisma.link.count({ where });
        const id = `main-feed:${JSON.stringify(args)}`;

        return {
          links,
          count,
          id,
        };
      },
    });

    t.field("link", {
      // 3
      type: "Link",
      args: {
        id: nonNull(idArg()),
        includes: arg({ type: LinkIncludes }),
      },
      resolve(parent, args, context, info) {
        return context.prisma.link.findUnique({
          where: { id: Number(args.id) },
          include: filterIncludes(args.includes),
        });
      },
    });
  },
});

export const LinkPost = extendType({
  type: "Mutation",
  definition(t) {
    t.nonNull.field("post", {
      type: "Link",
      args: {
        description: nonNull(stringArg()),
        url: nonNull(stringArg()),
      },

      resolve(parent, args, context) {
        const { description, url } = args;
        const { userId } = context;

        if (!userId) {
          throw new Error("Cannot post without logging in.");
        }

        const newLink = context.prisma.link.create({
          data: {
            description,
            url,
            postedBy: { connect: { id: userId } },
          },
        });

        return newLink;
      },
    });

    t.field("patch", {
      type: "Link",
      args: {
        id: nonNull(idArg()),
        description: stringArg(),
        url: stringArg(),
      },

      resolve(parent, args, context) {
        const { description, url, id } = args;

        let patch: Partial<LinkDb> = {};

        if (description) {
          patch.description = description;
        }

        if (url) {
          patch.url = url;
        }

        return context.prisma.link.update({
          data: patch,
          where: { id: Number(id) },
        });
      },
    });

    t.field("delete", {
      type: "Link",
      args: {
        id: nonNull(idArg()),
      },
      resolve(parent, args, context, info) {
        return context.prisma.link.delete({
          where: { id: Number(args.id) },
        });
      },
    });
  },
});
