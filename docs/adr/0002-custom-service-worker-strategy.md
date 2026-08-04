# ADR 0002: Custom Offline-First Service Worker Strategy

* **Status:** Accepted
* **Date:** 2026-07-29
* **Context:** Choosing between `vite-plugin-pwa` (Workbox abstraction) and a custom manually-maintained `sw.js` Service Worker for PWA capabilities and offline synchronization.

## Context & Problem Statement
The ALD platform requires robust PWA capabilities for school operators in areas with intermittent internet access (pesantren & madrasah environments). Requirements include:
1. Custom background upload queueing for documents uploaded offline.
2. Controlled cache invalidation to ensure UI updates deploy cleanly.
3. Precaching essential core shell assets without locking up storage for large PDF documents.

## Decision Drivers
* Direct control over background sync queues (`ald_background_upload_queue` in LocalStorage/IndexedDB).
* Fine-grained cache strategies (Stale-While-Revalidate for app shell, Cache-First for static icons, Network-Only for dynamic audit logs).
* Custom offline page fallback (`/public/offline.html`).

## Decision Outcome
Chosen **Custom Service Worker (`public/sw.js`)**.
Rather than utilizing standard Workbox generation via `vite-plugin-pwa`, a dedicated Service Worker was retained and hardened:
* Custom cache versioning (`v2.1-prod`).
* Explicit routing handlers for static assets vs dynamic Firestore API calls.
* Offline fallback page serving during connectivity loss.

## Consequences
* **Positive:** Complete architectural transparency and zero-dependency offline handling customized for institutional document sync workflows.
* **Negative:** Cache version numbers must be bumped manually or via CI scripts upon major shell updates.
