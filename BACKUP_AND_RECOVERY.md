# Backup & Recovery Procedures

This document outlines the backup and recovery strategies for the ALD platform data hosted on Google Cloud and Firebase.

## 1. Firebase Firestore Backup
Firestore data contains the core logic of the platform, including user accounts, staff directories, and document metadata.

### Automated Backups
- Google Cloud Platform supports Point-in-Time Recovery (PITR) for Firestore. PITR should be enabled in the Google Cloud Console to allow restoring the database to any minute within the past 7 days.
- Scheduled backups should be configured via Google Cloud Storage using standard Firestore export functions.

### Manual Export
To manually export the database for archiving:
```bash
gcloud firestore export gs://[YOUR_BACKUP_BUCKET_NAME]
```

## 2. Firebase Storage Backup
Firebase Storage houses the actual physical files (PDFs, Images).

### Automated Backups
Storage buckets can be configured with Object Versioning and Lifecycle Management policies to retain deleted or modified objects for a specified period (e.g., 30 days) before permanent deletion.

## 3. Disaster Recovery Plan
In the event of a catastrophic data loss:
1. Identify the timestamp of the failure.
2. If within 7 days, utilize Firestore PITR to restore the database to the minute prior to the failure.
3. If older than 7 days, import the latest nightly backup from the Cloud Storage backup bucket.
4. Verify data integrity against the restored metadata and physical files in Firebase Storage.
