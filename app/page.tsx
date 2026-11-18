import { readFileSync } from "node:fs";
import { join } from "node:path";
import { byVersion, type Conclusion, parseRuns, type Run, runUrl } from "@/lib/runs";

const runs = parseRuns(readFileSync(join(process.cwd(), "data/runs.json"), "utf8"));

const ISSUE_URL = "https://github.com/graycoreio/github-actions-magento2/issues/346";

const PR_URL = "https://github.com/graycoreio/github-actions-magento2/pull/348";

const UPSTREAM_ISSUE_URL = "https://github.com/thephpleague/flysystem/issues/1925";
const DEMO_REPO_URL = "https://github.com/cherylaurelia/graycore-demo";
const VERSIONS = ["2.4.7-p10", "2.4.8-p5", "2.4.9"];

const WORKFLOWS = [
  { label: "Check Extension Test", before: "main-check-extension", after: "fix-check-extension" },
  { label: "Setup Magento Test", before: "main-setup", after: "fix-setup" },
  { label: "Integration Test", before: "main-integration", after: "fix-integration" },
  { label: "Check Store Test", before: "main-check-store", after: "fix-check-store" },
];

const DIFF = `# fix-magento-install/action.yml (integration.yaml's copy of the fixups gets the same check)
+    # Composer 2.9+ blocks league/flysystem 2.x (PKSA-w9tt-7782-78jx), which 2.4.7 requires. Remove both
+    # steps once thephpleague/flysystem#1925 ships a patched 2.x or 2.4.7 leaves the supported matrix.
+    - name: Check if this version of composer blocks insecure packages
+      uses: graycoreio/github-actions-magento2/semver-compare@main
+      id: is-composer-blocking-insecure
+      if: |
+        startsWith(steps.init-magento-get-magento-version.outputs.version, '"2.4.7')
+      with:
+        version: 2.9
+        compare_against: \${{ steps.init-magento-get-composer-version.outputs.version }}
+
+    - run: |
+        composer config --no-interaction --merge --json audit.ignore \\
+          '{"PKSA-w9tt-7782-78jx": {"apply": "block", "reason": "No patched league/flysystem 2.x: https://github.com/thephpleague/flysystem/issues/1925"}}'
+      shell: bash
+      name: Fixup league/flysystem advisory blocking install
+      working-directory: \${{ inputs.magento_directory }}
+      if: |
+        startsWith(steps.init-magento-get-magento-version.outputs.version, '"2.4.7')
+        && steps.is-composer-blocking-insecure.outputs.result < 1`;

function findRun(key: string): Run {
  const run = runs.find((r) => r.key === key);

  if (run === undefined) throw new Error(`data/runs.json has no run ${key}`);

  return run;
}

const STATUS_STYLE: Record<Conclusion, { text: string; className: string }> = {
  success: { text: "passed", className: "bg-pass/10 text-pass" },
  failure: { text: "failed", className: "bg-fail/10 text-fail" },
  cancelled: { text: "cancelled", className: "bg-skip/10 text-skip" },
  skipped: { text: "skipped", className: "bg-skip/10 text-skip" },
};

function Status({ conclusion }: { conclusion: Conclusion | undefined }) {
  if (conclusion === undefined) return <span className="text-skip">not in run</span>;
  const style = STATUS_STYLE[conclusion];

  return <span className={`rounded px-2 py-0.5 text-sm font-medium ${style.className}`}>{style.text}</span>;
}

function RunCells({ run }: { run: Run }) {
  const results = byVersion(run);

  return (
    <>
      {VERSIONS.map((version) => (
        <td key={version} className="px-3 py-2">
          <Status conclusion={results.get(version)} />
        </td>
      ))}
      <td className="px-3 py-2 text-sm">
        <a className="underline" href={runUrl(run)}>
          run {run.runId}
        </a>
      </td>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-4 space-y-4 text-lg leading-relaxed text-muted">{children}</div>
    </section>
  );
}

export default function Page() {
  const corsBefore = findRun("cors-before");
  const corsAfter = findRun("cors-after");
  const controlSetup = findRun("control-setup");
  const controlCheck = findRun("control-check-extension");

  return (
    <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <div aria-hidden="true" className="hero-glow" />
      <p className="text-sm font-semibold tracking-wide text-ink uppercase">
        github-actions-magento2 · issue #346 · unofficial demo
      </p>
      <h1 className="mt-3 text-4xl leading-tight font-bold tracking-tight sm:text-6xl">
        Magento 2.4.7 jobs, <span className="accent-text">green again.</span>
      </h1>
      <p className="mt-6 max-w-3xl text-xl leading-relaxed">
        <strong>Problem:</strong> Composer 2.9 blocks every league/flysystem 2.x release (advisory PKSA-w9tt-7782-78jx), and
        no patched 2.x exists, so composer can&apos;t resolve Magento 2.4.7-p10 and every 2.4.7 job fails (
        <a className="underline" href="https://github.com/graycoreio/github-actions-magento2/actions/runs/39268531485">
          main&apos;s CI run, October 19
        </a>
        ).
      </p>
      <p className="mt-3 max-w-3xl text-xl leading-relaxed">
        <strong>Fix:</strong> one step skips blocking for that one advisory on 2.4.7 only. <code>composer audit</code> still
        reports it, and every other advisory still blocks.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <a className="rounded-md bg-ink px-5 py-3 font-medium text-white" href={PR_URL}>
          See the PR (#348)
        </a>
        <a className="rounded-md border border-line bg-card px-5 py-3 font-medium" href={ISSUE_URL}>
          Issue #346
        </a>
        <a className="rounded-md border border-line bg-card px-5 py-3 font-medium" href={DEMO_REPO_URL}>
          This page&apos;s repo
        </a>
      </div>

      <Section title="Your CI, before and after">
        <p>
          The same four internal workflows, on main (before) and on the fix branch (after), for each Magento version in
          the <code>currently-supported</code> matrix. Every result links to its GitHub Actions run.
        </p>
        <div className="overflow-x-auto rounded-lg border border-line bg-card">
          <table className="w-full min-w-[640px] text-left text-base text-ink">
            <thead className="border-b border-line text-sm text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Workflow</th>
                <th className="px-3 py-2 font-medium">Branch</th>
                {VERSIONS.map((version) => (
                  <th key={version} className="px-3 py-2 font-medium">
                    {version}
                  </th>
                ))}
                <th className="px-3 py-2 font-medium">Run</th>
              </tr>
            </thead>
            <tbody>
              {WORKFLOWS.map((workflow) => (
                <WorkflowRows key={workflow.label} label={workflow.label} before={findRun(workflow.before)} after={findRun(workflow.after)} />
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-base">
          &ldquo;Cancelled&rdquo; on main is fail-fast: once the 2.4.7-p10 leg fails, Check Extension cancels the 2.4.8-p5
          and 2.4.9 legs too, so a broken 2.4.7 hides results for the other versions as well.
        </p>
      </Section>

      <Section title="The change">
        <pre className="rounded-lg bg-ink p-4 font-mono text-sm leading-relaxed break-all whitespace-pre-wrap text-white">{DIFF}</pre>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Only the disposable project.</strong> It writes to the Magento project the action creates for testing, the
            same place the existing monolog and dotmailer fixups go. It never touches an extension&apos;s or store&apos;s
            own lock file.
          </li>
          <li>
            <strong>Unblocks, doesn&apos;t hide.</strong> <code>&quot;apply&quot;: &quot;block&quot;</code> lets composer
            resolve flysystem 2.5.0, while <code>composer audit</code> still lists the advisory. <code>--merge</code> keeps
            any ignore entries a project already has.
          </li>
          <li>
            <strong>Only 2.4.7, only Composer 2.9+.</strong> Only 2.4.7 pairs an affected flysystem with a blocking Composer
            in the matrix: 2.4.8+ use flysystem 3.x, where a fixed release exists, and 2.4.2–2.4.6 get Composer 2.2 or 1,
            which don&apos;t block. The Composer check uses your <code>semver-compare</code> action, the way
            coding-standard gates allow-plugins: Composer 2.2 rejects <code>audit.ignore</code> outright, so without it a
            custom 2.4.7 + Composer 2.2 matrix that works today would start failing.
            Once flysystem ships a fixed 2.x (
            <a className="underline" href={UPSTREAM_ISSUE_URL}>
              flysystem#1925
            </a>
            ), the step can be deleted.
          </li>
        </ul>
      </Section>

      <Section title="What it gives extensions back">
        <p>
          magento2-cors runs <code>check-extension</code> on a monthly schedule. Its November 10 run failed only on the
          2.4.7-p10 legs. The same workflow pointed at the fix branch:
        </p>
        <div className="overflow-x-auto rounded-lg border border-line bg-card">
          <table className="w-full min-w-[560px] text-left text-base text-ink">
            <thead className="border-b border-line text-sm text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">magento2-cors</th>
                {VERSIONS.map((version) => (
                  <th key={version} className="px-3 py-2 font-medium">
                    {version}
                  </th>
                ))}
                <th className="px-3 py-2 font-medium">Run</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-line">
                <td className="px-3 py-2">Scheduled, Nov 10 (v8.11.0)</td>
                <RunCells run={corsBefore} />
              </tr>
              <tr>
                <td className="px-3 py-2">With the fix branch</td>
                <RunCells run={corsAfter} />
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          The same 2.4.7-p10 failure shows up in six more of your modules&apos; scheduled runs (magento2-cron-group-relocation,
          -daffodil, -graph-ql-cache, -graphql-introspection-cache, -graphql-logger, -stdlogging). Outside users work
          around it by deleting 2.4.7-p10 from their matrix: mage-os/module-seo, module-aeo and mage-os-lab/module-blog each
          carry a comment that, while it&apos;s out, nothing tests the 2.4.7 floor their composer.json declares.
        </p>
      </Section>

      <Section title="How it was checked">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Locally:</strong> in the <code>composer:2.9.8</code> image (the Composer the matrix pins for 2.4.7-p10),
            <code> create-project magento/project-community-edition:2.4.7-p10 --no-install</code> and{" "}
            <code>composer update</code> reproduce the exact CI error. With the step added, it resolves and{" "}
            <code>composer audit</code> still reports PKSA-w9tt-7782-78jx.
          </li>
          <li>
            <strong>Your CI on a fork:</strong> setup-magento calls <code>fix-magento-install@main</code>, so a branch alone
            can&apos;t exercise the change. A proof branch (not part of the fix) points the internal <code>@main</code>{" "}
            refs at the fork, the same rewrite your release pinback does. A control branch with the same rewrite and no fix
            still fails on 2.4.7-p10 (
            <a className="underline" href={runUrl(controlSetup)}>
              setup
            </a>
            ,{" "}
            <a className="underline" href={runUrl(controlCheck)}>
              check-extension
            </a>
            ), so the green runs come from the fix, not the rewrite.
          </li>
          <li>
            <strong>Not covered:</strong> Magento 2.4.6 or older run with Composer 2.9+ outside the supported matrix (the
            step is gated on 2.4.7).
          </li>
        </ul>
      </Section>

      <footer className="mt-16 border-t border-line pt-6 text-sm text-muted">
        Unofficial demo by Cheryl Aurelia: not affiliated with Graycore. Built from public CI runs and issues in
        graycoreio/github-actions-magento2.
      </footer>
    </main>
  );
}

function WorkflowRows({ label, before, after }: { label: string; before: Run; after: Run }) {
  return (
    <>
      <tr>
        <td className="px-3 pt-3 pb-1 font-medium" rowSpan={2}>
          {label}
        </td>
        <td className="px-3 pt-3 pb-1 text-sm text-muted">main</td>
        <RunCells run={before} />
      </tr>
      <tr className="border-b border-line">
        <td className="px-3 pb-3 text-sm text-muted">fix</td>
        <RunCells run={after} />
      </tr>
    </>
  );
}
