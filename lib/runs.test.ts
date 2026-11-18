import assert from "node:assert/strict";
import { test } from "node:test";
import { byVersion, magentoVersion, parseRuns } from "./runs.ts";

const sample = [
  {
    key: "main-check-extension",
    repo: "graycoreio/github-actions-magento2",
    runId: 39268531485,
    workflow: "Check Extension Test",
    branch: "main",
    createdAt: "2026-10-19T15:00:00Z",
    jobs: [
      { name: "compute_matrix", conclusion: "success" },
      { name: "check-workflow / compile-extension (magento/project-community-edition:2.4.7-p10)", conclusion: "failure" },
      { name: "check-workflow / unit-test-extension (magento/project-community-edition:2.4.7-p10)", conclusion: "success" },
      { name: "check-workflow / compile-extension (magento/project-community-edition:2.4.9)", conclusion: "cancelled" },
      { name: "check-workflow / unit-test-extension (magento/project-community-edition:2.4.9)", conclusion: "success" },
      { name: "check-workflow / coding-standard (magento/project-community-edition)", conclusion: "success" },
    ],
  },
];

test("magentoVersion reads the version from a matrix job name", () => {
  assert.equal(magentoVersion("setup-magento-store (magento/project-community-edition:2.4.8-p5)"), "2.4.8-p5");
  assert.equal(magentoVersion("coding-standard (magento/project-community-edition)"), null);
  assert.equal(magentoVersion("compute_matrix"), null);
});

test("byVersion keeps the worst conclusion per version and skips unversioned jobs", () => {
  const [run] = parseRuns(JSON.stringify(sample));
  assert.ok(run);
  assert.deepEqual([...byVersion(run)], [
    ["2.4.7-p10", "failure"],
    ["2.4.9", "cancelled"],
  ]);
});

test("parseRuns rejects unknown conclusions and missing fields", () => {
  assert.throws(() => parseRuns(JSON.stringify([{ ...sample[0], jobs: [{ name: "x", conclusion: "neutral" }] }])), /unknown job conclusion/);
  assert.throws(() => parseRuns(JSON.stringify([{ ...sample[0], repo: "" }])), /missing a repo/);
  assert.throws(() => parseRuns("{}"), /array/);
});
