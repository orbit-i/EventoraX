import prisma from "./client";

// Every model that has an organizationId column must be listed here.
// Queries on these models are automatically limited to one organization.
const ORG_SCOPED_MODELS = new Set<string>(["User", "Invitation"]);

const WHERE_OPS = new Set([
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "findUnique",
  "findUniqueOrThrow",
  "count",
  "aggregate",
  "groupBy",
  "update",
  "updateMany",
  "delete",
  "deleteMany",
]);

export function getScopedPrisma(organizationId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!model || !ORG_SCOPED_MODELS.has(model)) {
            return query(args);
          }

          // Prisma's generated arg types are a giant union; we only add
          // organizationId to where/data, so treat args as a plain object.
          const a = args as any;

          if (WHERE_OPS.has(operation)) {
            a.where = { ...a.where, organizationId };
          } else if (operation === "create") {
            a.data = { ...a.data, organizationId };
          } else if (operation === "createMany") {
            const rows = Array.isArray(a.data) ? a.data : [a.data];
            a.data = rows.map((row: any) => ({ ...row, organizationId }));
          } else if (operation === "upsert") {
            a.where = { ...a.where, organizationId };
            a.create = { ...a.create, organizationId };
          }

          return query(a);
        },
      },
    },
  });
}