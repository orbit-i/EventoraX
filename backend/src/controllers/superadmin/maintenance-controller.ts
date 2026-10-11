import { Request, Response } from "express";
import fs from "fs/promises";
import { createReadStream, existsSync, readFileSync } from "fs";
import path from "path";
import { execFile, execFileSync } from "child_process";
import prisma from "../../prisma/client";
import { ok, fail, pagination } from "../../utils/http";
import { logActivity } from "../../utils/activity";
import { getSetting, clearSettingsCache } from "../../utils/settings";
import { UPLOAD_ROOT, PRIVATE_ROOT } from "../../utils/storage";
import { mailStatus } from "../../utils/mail";
import { jobStatuses, runJob } from "../../jobs/scheduler";
import { DAY_MS } from "../../utils/orgStatus";

const STARTED_AT = new Date();
const BACKUP_DIR = path.resolve(process.env.BACKUP_DIR || path.join("..", "backups"));
const BACKUP_NAME = /^eventorax-\d{4}-\d{2}-\d{2}-\d{6}\.sql$/;

function readVersion() {
  let app = "1.0.0";
  let commit: string | null = null;
  try {
    app = (JSON.parse(readFileSync(path.resolve("package.json"), "utf8")) as { version?: string }).version ?? app;
  } catch {
    // keep the default
  }
  try {
    commit = execFileSync("git", ["rev-parse", "--short", "HEAD"], { encoding: "utf8", timeout: 3000, stdio: ["ignore", "pipe", "ignore"] }).trim() || null;
  } catch {
    // not a git checkout (e.g. a deployed build)
  }
  return { app, commit };
}
const VERSION = readVersion();

/** Size of a folder in bytes (uploads / private files). */
async function folderSize(dir: string): Promise<number> {
  let total = 0;
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) total += await folderSize(full);
    else total += (await fs.stat(full).catch(() => ({ size: 0 }))).size;
  }
  return total;
}

async function checkDb() {
  const t = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, latencyMs: Date.now() - t, message: "Connected" };
  } catch (err) {
    return { ok: false, latencyMs: null, message: err instanceof Error ? err.message : "Database unreachable" };
  }
}

async function checkStorage() {
  try {
    await fs.mkdir(UPLOAD_ROOT, { recursive: true });
    const probe = path.join(UPLOAD_ROOT, `.health-${Date.now()}`);
    await fs.writeFile(probe, "ok");
    await fs.unlink(probe);
    const stats = await fs.statfs(UPLOAD_ROOT).catch(() => null);
    const [uploads, privateFiles] = await Promise.all([folderSize(UPLOAD_ROOT), folderSize(PRIVATE_ROOT)]);
    return {
      ok: true,
      message: "Uploads folder is writable",
      freeBytes: stats ? stats.bavail * stats.bsize : null,
      totalBytes: stats ? stats.blocks * stats.bsize : null,
      uploadsBytes: uploads,
      privateBytes: privateFiles,
    };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Can't write to the uploads folder", freeBytes: null, totalBytes: null, uploadsBytes: null, privateBytes: null };
  }
}

// GET /api/v1/superadmin/maintenance   (version, maintenance mode, health checks, background jobs)
export async function maintenanceOverview(_req: Request, res: Response) {
  const [db, storage, mail, enabled, message, errors24h, errorsTotal] = await Promise.all([
    checkDb(),
    checkStorage(),
    mailStatus(),
    getSetting<boolean>("maintenance.enabled", false),
    getSetting<string>("maintenance.message", ""),
    prisma.errorLog.count({ where: { createdAt: { gte: new Date(Date.now() - DAY_MS) } } }),
    prisma.errorLog.count(),
  ]);
  const jobs = jobStatuses();
  return ok(res, {
    version: { ...VERSION, node: process.version, startedAt: STARTED_AT, uptimeSec: Math.round(process.uptime()) },
    maintenance: { enabled, message },
    health: {
      database: db,
      storage,
      email: { ok: mail.mode !== "console", mode: mail.mode, host: mail.host, message: mail.mode === "console" ? "No SMTP server, emails are printed in the terminal" : `Sending through ${mail.host}` },
      jobs: { ok: jobs.every((j) => !j.lastError), message: jobs.some((j) => j.lastError) ? "A background job failed, see below" : "All background jobs healthy" },
    },
    jobs,
    errors: { last24h: errors24h, total: errorsTotal },
  });
}

// POST /api/v1/superadmin/maintenance/jobs/:name/run
export async function runJobNow(req: Request, res: Response) {
  const name = String(req.params.name);
  const state = await runJob(name);
  if (!state) return fail(res, 404, "NOT_FOUND", "Unknown job");
  await logActivity(req, { action: "maintenance.job.run", metadata: { job: name, result: state.lastError ?? state.lastResult } });
  return ok(res, jobStatuses().find((j) => j.name === name));
}

// POST /api/v1/superadmin/maintenance/cache/clear
export async function clearCache(req: Request, res: Response) {
  const cleared = clearSettingsCache();
  await logActivity(req, { action: "maintenance.cache.clear", metadata: { cleared } });
  return ok(res, { cleared });
}

// GET /api/v1/superadmin/maintenance/errors?page=&limit=
export async function listErrors(req: Request, res: Response) {
  const { page, limit, skip } = pagination(req.query as Record<string, unknown>, 50);
  const [items, total] = await Promise.all([prisma.errorLog.findMany({ orderBy: { createdAt: "desc" }, skip, take: limit }), prisma.errorLog.count()]);
  const userIds = [...new Set(items.map((e) => e.userId).filter((x): x is string => Boolean(x)))];
  const users = userIds.length ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } }) : [];
  const byId = new Map(users.map((u) => [u.id, u]));
  return ok(res, items.map((e) => ({ ...e, user: e.userId ? byId.get(e.userId) ?? null : null })), 200, { total, page, limit });
}

// DELETE /api/v1/superadmin/maintenance/errors   (clear the error log after fixing things)
export async function clearErrors(req: Request, res: Response) {
  const result = await prisma.errorLog.deleteMany({});
  await logActivity(req, { action: "maintenance.errors.clear", metadata: { count: result.count } });
  return ok(res, { deleted: result.count });
}

// ─────────────────────────── Database backups ───────────────────────────

function findMysqldump(): string | null {
  if (process.env.MYSQLDUMP_PATH && existsSync(process.env.MYSQLDUMP_PATH)) return process.env.MYSQLDUMP_PATH;
  try {
    execFileSync(process.platform === "win32" ? "where" : "which", ["mysqldump"], { stdio: "ignore", timeout: 3000 });
    return "mysqldump";
  } catch {
    // not on PATH
  }
  const candidates = ["C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe", "C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysqldump.exe", "/usr/bin/mysqldump", "/usr/local/bin/mysqldump"];
  return candidates.find((c) => existsSync(c)) ?? null;
}

// GET /api/v1/superadmin/maintenance/backups
export async function listBackups(_req: Request, res: Response) {
  const files = await fs.readdir(BACKUP_DIR).catch(() => [] as string[]);
  const rows = await Promise.all(
    files
      .filter((f) => BACKUP_NAME.test(f))
      .map(async (f) => {
        const st = await fs.stat(path.join(BACKUP_DIR, f));
        return { file: f, sizeBytes: st.size, createdAt: st.mtime };
      })
  );
  rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return ok(res, { folder: BACKUP_DIR, tool: findMysqldump() ? "mysqldump" : null, backups: rows });
}

// POST /api/v1/superadmin/maintenance/backups   (runs mysqldump into the backups folder)
export async function createBackup(req: Request, res: Response) {
  const tool = findMysqldump();
  if (!tool) return fail(res, 501, "NO_MYSQLDUMP", "mysqldump wasn't found on this server. Install the MySQL client tools or set MYSQLDUMP_PATH in .env.");
  const db = process.env.DB_NAME;
  if (!db) return fail(res, 500, "NO_DB_CONFIG", "DB_NAME is not set in .env");
  await fs.mkdir(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14); // yyyymmddhhmmss
  const file = `eventorax-${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6, 8)}-${stamp.slice(8, 14)}.sql`;
  const target = path.join(BACKUP_DIR, file);
  const args = [
    `--host=${process.env.DB_HOST || "localhost"}`,
    `--port=${process.env.DB_PORT || "3306"}`,
    `--user=${process.env.DB_USER || "root"}`,
    "--single-transaction",
    "--routines",
    "--no-tablespaces",
    `--result-file=${target}`,
    db,
  ];
  const started = Date.now();
  try {
    await new Promise<void>((resolve, reject) => {
      // The password goes in through the environment, never on the command line.
      execFile(tool, args, { env: { ...process.env, MYSQL_PWD: process.env.DB_PASSWORD ?? "" }, timeout: 5 * 60 * 1000 }, (err, _out, stderr) =>
        err ? reject(new Error(stderr?.trim() || err.message)) : resolve()
      );
    });
  } catch (err) {
    await fs.unlink(target).catch(() => undefined);
    return fail(res, 500, "BACKUP_FAILED", `Backup failed: ${err instanceof Error ? err.message : "unknown error"}`);
  }
  const st = await fs.stat(target);
  await logActivity(req, { action: "maintenance.backup", metadata: { file, sizeBytes: st.size } });
  return ok(res, { file, sizeBytes: st.size, createdAt: st.mtime, durationMs: Date.now() - started }, 201);
}

// GET /api/v1/superadmin/maintenance/backups/:file   (download)
export async function downloadBackup(req: Request, res: Response) {
  const file = String(req.params.file);
  if (!BACKUP_NAME.test(file)) return fail(res, 400, "VALIDATION_ERROR", "Not a backup file");
  const full = path.join(BACKUP_DIR, file);
  if (!existsSync(full)) return fail(res, 404, "NOT_FOUND", "Backup not found");
  await logActivity(req, { action: "maintenance.backup.download", metadata: { file } });
  res.setHeader("Content-Type", "application/sql");
  res.setHeader("Content-Disposition", `attachment; filename="${file}"`);
  createReadStream(full).pipe(res);
}
