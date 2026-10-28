# Hen Engine

Approved payment submissions create `HenAsset` rows from immutable order snapshots.

- `quantity` is copied from the order.
- `dailyEggUnitsPerHen` and `maximumEggUnitsPerHen` are copied from the plan snapshot.
- `productionStartDate` is the approval date at UTC midnight.
- `productionEndDate` is derived from the snapshot validity window.
- `totalMaximumEggUnits` is `quantity * maximumEggUnitsPerHen`.

The accrual job is available through:

```powershell
pnpm jobs:egg-accrual
pnpm jobs:egg-accrual:dry-run
```

The HTTP job route is `POST /api/internal/jobs/egg-accrual` and requires `x-job-secret` to match `EGG_ACCRUAL_JOB_SECRET`.

The job is idempotent by production date. It uses one atomic PostgreSQL statement per eligible hen asset to lock the asset row, check that no accrual exists for the production date, insert one accrual row, insert one production ledger credit, and increment the produced total without exceeding the maximum.
