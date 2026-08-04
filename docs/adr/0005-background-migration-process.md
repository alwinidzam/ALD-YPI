# ADR 0005: Zero-Downtime Background Document Migration

* **Status:** Accepted
* **Date:** 2026-07-29
* **Context:** Migrating existing legacy inline document chunks in Firestore to Firebase Storage without breaking user access or requiring application downtime.

## Context & Problem Statement
Prior versions stored legacy PDFs in base64 format in Firestore documents or chunks. Moving to Firebase Storage required converting these base64 payloads to Blobs, uploading them to Firebase Storage buckets, updating metadata paths (`storagePath`), and clearing inline `fileData` without interrupting live users.

## Decision Drivers
* Zero downtime for end users.
* Non-blocking batch processing (`MigrationService`).
* Idempotent operations (safe to re-run or recover from network drops).

## Decision Outcome
Chosen **Background Migration Service (`MigrationService`)**.
* `MigrationService` queries documents with `migrationState === 'LEGACY'` or `'FAILED_MIGRATION'`.
* Decodes base64 string, converts to Blob, uploads to Firebase Storage (`documents/{institution}/{id}.pdf`).
* Atomically updates Firestore document to `migrationState: 'STORAGE'` and clears base64 payload.
* Failed items are marked `FAILED_MIGRATION` for safe retry.

## Consequences
* **Positive:** Complete data integrity, seamless background execution, zero user downtime.
* **Negative:** Temporary duplicate storage utilization during transition window.
