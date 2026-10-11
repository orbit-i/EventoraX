import { recordError } from "../utils/errorLog";

// A tiny in-process scheduler: each job runs on its own interval inside the API server.
// (One server process = one runner. When the app is scaled out later, move these to a real queue.)

export interface Job {
  name: string;
  label: string;
  description: string;
  intervalMs: number;
  /** Returns a short human summary, e.g. "2 organizations expired". */
  run: () => Promise<string>;
}

interface JobState {
  running: boolean;
  lastRunAt: Date | null;
  lastDurationMs: number | null;
  lastResult: string | null;
  lastError: string | null;
  nextRunAt: Date | null;
  runs: number;
}

const jobs = new Map<string, { job: Job; state: JobState; timer: NodeJS.Timeout | null }>();
let started = false;

export function registerJob(job: Job) {
  jobs.set(job.name, { job, state: { running: false, lastRunAt: null, lastDurationMs: null, lastResult: null, lastError: null, nextRunAt: null, runs: 0 }, timer: null });
}

/** Runs one job now (skips if it's already running). */
export async function runJob(name: string): Promise<JobState | null> {
  const entry = jobs.get(name);
  if (!entry) return null;
  if (entry.state.running) return entry.state;
  entry.state.running = true;
  const started = Date.now();
  try {
    entry.state.lastResult = await entry.job.run();
    entry.state.lastError = null;
  } catch (err) {
    entry.state.lastError = err instanceof Error ? err.message : String(err);
    console.error(`Job ${name} failed:`, err);
    await recordError(err, undefined, 500);
  } finally {
    entry.state.running = false;
    entry.state.lastRunAt = new Date();
    entry.state.lastDurationMs = Date.now() - started;
    entry.state.runs += 1;
  }
  return entry.state;
}

/** Starts every registered job: first run shortly after start-up, then on its interval. */
export function startScheduler() {
  if (started) return;
  started = true;
  let delay = 5_000;
  for (const entry of jobs.values()) {
    const first = delay;
    delay += 2_000; // spread the first runs out a little
    entry.state.nextRunAt = new Date(Date.now() + first);
    setTimeout(() => {
      void runJob(entry.job.name);
      entry.state.nextRunAt = new Date(Date.now() + entry.job.intervalMs);
      entry.timer = setInterval(() => {
        entry.state.nextRunAt = new Date(Date.now() + entry.job.intervalMs);
        void runJob(entry.job.name);
      }, entry.job.intervalMs);
    }, first);
  }
}

export function jobStatuses() {
  return [...jobs.values()].map(({ job, state }) => ({
    name: job.name,
    label: job.label,
    description: job.description,
    intervalMs: job.intervalMs,
    ...state,
  }));
}
