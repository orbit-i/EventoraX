import { Prisma } from "@prisma/client";
import prisma  from "./client";

const ORG_SCOPED_MODELS = ["User"] as const

export function getScopedPrisma(organizationId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!model || !ORG_SCOPED_MODELS.includes(model as any)) {
            return query(args); // not an org-scoped model, pass through untouched
          }

          const readOps = ["findFirst", "findFirstOrThrow", "findMany", "findUnique", "findUniqueOrThrow", "count", "aggregate", "groupBy"];
          const writeOps = ["update", "updateMany", "delete", "deleteMany"];

          if (readOps.includes(operation) || writeOps.includes(operation)) {
            args.where = { ...args.where, organizationId };
          }

          if (operation === "create") {
            args.data = { ...args.data, organizationId };
          }

          return query(args);
        },
      },
    },
  });
}