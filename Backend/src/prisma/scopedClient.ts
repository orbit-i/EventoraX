import prisma from "./client";

const ORG_SCOPED_MODELS = ["User"] as const;

export function getScopedPrisma(
  organizationId: string
): ReturnType<typeof prisma.$extends> {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!model || !ORG_SCOPED_MODELS.includes(model as any)) {
            return query(args);
          }

          const mutableArgs = args as any;

          switch (operation) {
            case "findMany":
            case "findFirst":
            case "findFirstOrThrow":
            case "findUnique":
            case "findUniqueOrThrow":
            case "count":
            case "aggregate":
            case "groupBy":
            case "update":
            case "updateMany":
            case "delete":
            case "deleteMany":
              mutableArgs.where = {
                ...(mutableArgs.where ?? {}),
                organizationId,
              };
              break;

            case "create":
              mutableArgs.data = {
                ...(mutableArgs.data ?? {}),
                organizationId,
              };
              break;
          }

          return query(mutableArgs);
        },
      },
    },
  });
}