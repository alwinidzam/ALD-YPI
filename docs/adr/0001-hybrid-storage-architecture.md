# ADR 0001: Hybrid Document Storage Architecture

* **Status:** Accepted
* **Date:** 2026-07-29
* **Context:** Document storage transitioned from inline base64 strings in Firestore documents to Firebase Storage for binary files while maintaining metadata and chunk fallbacks in Firestore.

## Context & Problem Statement
Initially, document binary data (PDF files and images) were stored directly within Firestore documents as base64-encoded strings or multi-chunk Firestore collections. While this provided zero-configuration storage during initial prototyping, it introduced severe production limitations:
1. Firestore document 1MB payload size limit.
2. High document read costs when querying metadata for search/filtering.
3. Excessive client memory usage decoding large base64 strings.

## Decision Drivers
* Scalability for large PDF archives (up to 50MB+).
* Cost efficiency in Firestore reads (querying metadata without loading binary content).
* Backward compatibility during gradual migration.

## Considered Options
1. **Option 1:** Migrate entirely to Firebase Storage in a single blocking script.
2. **Option 2:** Hybrid Storage Model (Firestore for metadata + Firebase Storage for binaries + Legacy Chunk fallback).

## Decision Outcome
Chosen **Option 2 (Hybrid Storage Model)**.
* **Metadata Store:** Firestore `documents` collection containing indexable metadata (`title`, `category`, `institution`, `year`, `storagePath`, `migrationState`).
* **Binary Storage:** Firebase Storage bucket paths (`documents/{institution}/{docId}.pdf`).
* **Legacy Fallback:** If `migrationState === 'LEGACY'`, the app gracefully fetches from base64 field or `documentChunks` until background migration completes.

## Consequences
* **Positive:** Significantly reduced Firestore read bandwidth and document payload sizes; fast search queries.
* **Negative:** Requires state management for migration states (`LEGACY` vs `STORAGE`).
