import prisma from "../prisma/client";

/** Reads a platform setting (seeded in Phase 2), falling back if it's missing. */
export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await prisma.systemSetting.findUnique({ where: { key } });
  return row ? (row.value as unknown as T) : fallback;
}