# Hardware Database Runbook

## Purpose

This runbook defines the CLI-only workflow for initializing, backing up, resetting, and verifying the Hardware Mode SQLite database used by the web application and the Chainway C5 integration.

The workflow targets `web/prisma/hardware.db` only. It does not target `simulation.db`.

## Prerequisites

- Run commands from `C:\Users\Admin\Documents\RFID Demo\web`
- Install web dependencies first: `npm.cmd install`
- Prisma migrations must exist in `web/prisma/migrations/`
- Stop the Next.js dev server and any other SQLite clients before reset or backup-heavy maintenance

## Safety Warning

Stop the dev server before running `hardware:reset`. An active SQLite connection can leave the database locked or cause sidecar files to change while the backup is being copied.

Do not use `npm.cmd run prisma:migrate` for Hardware-only maintenance. That command migrates both `simulation.db` and `hardware.db`.

## Commands

Initialize the Hardware database baseline:

```powershell
npm.cmd run hardware:init
```

Create a timestamped Hardware backup:

```powershell
npm.cmd run hardware:backup
```

Reset Hardware Mode only:

```powershell
npm.cmd run hardware:reset
```

Verify the clean Hardware baseline:

```powershell
npm.cmd run hardware:verify
```

## Expected Clean Baseline

Canonical locations:

- `LINEN-RM | Main Linen Room | STORAGE`
- `EXT-LDY | Central Laundry | LAUNDRY`

Expected counts:

- `Location: 2`
- `Linen: 0`
- `LaundryBatch: 0`
- `Transaction: 0`
- `TransactionItem: 0`
- `RFIDReadSession: 0`
- `RFIDRead: 0`
- `Asset: 0`

`hardware:verify` prints `PASS` only when the migration table exists, all application tables exist, the two canonical locations match exactly, and all operational tables remain empty.

## Backup Layout

Backups are written under:

```text
web/prisma/backups/hardware/<timestamp>/
```

Each backup may contain:

- `hardware.db`
- `hardware.db-wal` when present
- `hardware.db-shm` when present

The backup command does not overwrite an existing timestamp directory.

## Manual Restore

1. Stop the dev server and any SQLite tools.
2. Choose the desired backup directory under `web/prisma/backups/hardware/`.
3. Copy `hardware.db` back to `web/prisma/hardware.db`.
4. If the backup contains `hardware.db-wal` and `hardware.db-shm`, copy them back beside the database file as well.
5. Run `npm.cmd run hardware:verify`.
6. If verification fails because the restored database is not a clean baseline, inspect it with the application workflow you intended to restore.

## Troubleshooting

Locked SQLite database:

- Stop `npm.cmd run dev`, Prisma Studio, DB Browser for SQLite, or any shell session holding the database open.
- Retry the backup or reset command after the lock is released.

Missing migration table:

- Run `npm.cmd run hardware:init` or `npm.cmd run hardware:reset`.
- These scripts apply Prisma migrations to `file:./hardware.db` only.

Failed backup:

- Confirm `web/prisma/hardware.db` exists.
- Confirm the backup target directory is writable.
- Confirm the database is not being mutated by another process during copy.

Incorrect Location count:

- Run `npm.cmd run hardware:init` to upsert the canonical location rows.
- Run `npm.cmd run hardware:verify` again.
- If extra rows still exist, inspect the Hardware database contents before choosing a reset.

## Git Safety

- Never commit runtime database files.
- Never use `git add .` around database files, WAL/SHM sidecars, or backup directories.
- This repository currently tracks some runtime DB paths already; `.gitignore` prevents new backup and sidecar artifacts from being added accidentally, but it does not untrack existing files already in Git history.

## Scope Confirmation

This workflow does not modify `simulation.db`, does not require the dev server to be running, and does not change the web UI or Android application.
