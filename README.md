# Magento 2.4.7 jobs, green again (github-actions-magento2 #346)

Unofficial demo by Cheryl Aurelia: not affiliated with Graycore.

## The problem
Composer 2.9 blocks every league/flysystem release covered by advisory
[PKSA-w9tt-7782-78jx](https://github.com/advisories/GHSA-cxf4-7mrp-vvpr) (`<=3.35.2`). Magento 2.4.7 requires
`league/flysystem ^2.4`, and no patched 2.x exists ([flysystem#1925](https://github.com/thephpleague/flysystem/issues/1925)),
so composer can't resolve Magento 2.4.7-p10. Every 2.4.7 job in
[graycoreio/github-actions-magento2](https://github.com/graycoreio/github-actions-magento2) fails, reported in
[#346](https://github.com/graycoreio/github-actions-magento2/issues/346). main's own CI has been red since 2026-10-19
([run 39268531485](https://github.com/graycoreio/github-actions-magento2/actions/runs/39268531485)).

## The fix
Branch [`fix/flysystem-advisory-247`](https://github.com/cherylaurelia/github-actions-magento2/tree/fix/flysystem-advisory-247):
for Magento 2.4.7 with Composer 2.9+, `fix-magento-install` (and `integration.yaml`'s copy of the fixups) adds that one
advisory to the throwaway project's `audit.ignore` with `"apply": "block"`, so composer resolves while `composer audit`
still reports it.

## What this page shows
Real GitHub Actions results, before (graycoreio main) and after (the fix, on a fork), per Magento version, plus a
control branch and graycoreio/magento2-cors run against the fix. `data/runs.json` is generated from `gh run view`:

```bash
npm install
node scripts/extract-runs.mjs main-setup=graycoreio/github-actions-magento2:39268531995 ...  # see data/runs.json keys
npm test
npm run build && npm run start
```
