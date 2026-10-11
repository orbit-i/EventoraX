import { Prisma } from "@prisma/client";
import prisma from "../prisma/client";

// Settings are read on many requests (maintenance mode, trial length, contact info), so they're
// cached in memory for a short time. Saving a setting (or "Clear cache") empties the cache.
const TTL_MS = 30_000;
const cache = new Map<string, { value: unknown; at: number }>();

/** Reads a platform setting (seeded in Phase 2), falling back if it's missing. */
export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return (hit.value ?? fallback) as T;
  const row = await prisma.systemSetting.findUnique({ where: { key } });
  cache.set(key, { value: row ? row.value : null, at: Date.now() });
  return row ? (row.value as unknown as T) : fallback;
}

/** Saves a platform setting and forgets the cached copy. */
export async function setSetting(key: string, value: Prisma.InputJsonValue): Promise<void> {
  await prisma.systemSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
  cache.delete(key);
}

/** Empties the settings cache (Maintenance → Clear cache). Returns how many entries were dropped. */
export function clearSettingsCache(): number {
  const n = cache.size;
  cache.clear();
  return n;
}
