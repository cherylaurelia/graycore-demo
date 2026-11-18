// CI runs the page cites (data/runs.json, written by scripts/extract-runs.mjs from `gh run view`).
// This file decides what each run says per Magento version.

export type Conclusion = "success" | "failure" | "cancelled" | "skipped";

export interface Job {
  name: string;
  conclusion: Conclusion;
}

export interface Run {
  key: string;
  repo: string;
  runId: number;
  workflow: string;
  branch: string;
  createdAt: string;
  jobs: Job[];
}

const CONCLUSIONS = new Set<string>(["success", "failure", "cancelled", "skipped"]);

export function parseRuns(json: string): Run[] {
  const runs: Run[] = JSON.parse(json);

  if (!Array.isArray(runs)) throw new Error("runs.json must be an array");

  for (const run of runs) checkRun(run);

  return runs;
}

function checkRun(run: Run): void {
  const fields = [run.key, run.repo, run.workflow, run.branch, run.createdAt];

  if (!fields.every(Boolean)) throw new Error(`runs.json: run ${run.key ?? "?"} is missing a repo, workflow, branch or date`);

  if (!Number.isInteger(run.runId)) throw new Error(`runs.json: ${run.key} has no runId`);

  if (!Array.isArray(run.jobs)) throw new Error(`runs.json: ${run.key} has no jobs`);

  const unknown = run.jobs.find((job) => !CONCLUSIONS.has(job.conclusion));

  if (unknown) throw new Error(`runs.json: ${run.key} has unknown job conclusion ${unknown.conclusion}`);
}

const VERSION_IN_JOB = /\(magento\/project-community-edition:([^)]+)\)/;

export function magentoVersion(jobName: string): string | null {
  return VERSION_IN_JOB.exec(jobName)?.[1] ?? null;
}

// A skipped job (e.g. phpstan with no config) ranks lowest, so it never hides jobs that ran.
const SEVERITY: Record<Conclusion, number> = { skipped: 0, success: 1, cancelled: 2, failure: 3 };

/** Worst conclusion per Magento version among the run's jobs that name one. */
export function byVersion(run: Run): Map<string, Conclusion> {
  const result = new Map<string, Conclusion>();

  for (const job of run.jobs) {
    const version = magentoVersion(job.name);

    if (version === null) continue;

    const previous = result.get(version);

    if (previous === undefined || SEVERITY[job.conclusion] > SEVERITY[previous]) result.set(version, job.conclusion);
  }

  return result;
}

export function runUrl(run: Run): string {
  return `https://github.com/${run.repo}/actions/runs/${run.runId}`;
}
