# ADR 0004: Route-Level Code Splitting with React.lazy and Suspense

* **Status:** Accepted
* **Date:** 2026-07-29
* **Context:** Optimizing initial bundle size and page load time for the single-page application (SPA).

## Context & Problem Statement
As the ALD platform expanded to include Reporting Center, Attendance System, Scanner Page, User Management, and Audit Logs, importing all components eagerly in `App.tsx` increased initial bundle sizes, slowing down initial First Contentful Paint (FCP) on mobile networks.

## Decision Drivers
* Reduce initial main bundle size below 500KB.
* Faster initial application load time for public archive users.
* Defer heavy sub-domain modules (PDF viewer engines, Attendance QR scanner libraries, Reporting engines) until navigated to.

## Decision Outcome
Chosen **Route-Level Code Splitting via `React.lazy` & `React.Suspense`**.
* Secondary views (`PdfViewer`, `AuditLogView`, `UserManagementView`, `ReportingCenter`, `ScannerPage`, `AttendanceDashboardPage`, `StaffManagementPage`) are dynamic imports.
* Wrapped in a global `React.Suspense` boundary in `App.tsx` with a branded `RefreshCw` loading spinner fallback.

## Consequences
* **Positive:** Initial JS payload reduced significantly; faster startup on mobile networks.
* **Negative:** Short suspense transition when entering heavy sub-views for the first time.
