# Deployment Guide

ALD is a single-page application built with React, Vite, and Firebase. This guide outlines how to deploy the application to production.

## Prerequisites
- Node.js (v18+)
- Firebase CLI installed globally (`npm install -g firebase-tools`)
- Access to the YPI Firebase Project

## 1. Environment Configuration
Ensure your `firebase-applet-config.json` is correctly populated with the production Firebase project credentials.

## 2. Building the Application
Run the build script to compile the application and bundle assets:
```bash
npm install
npm run build
```
This will generate optimized, minified files in the `/dist` directory.

## 3. Deploying to Firebase Hosting
The primary deployment target is Firebase Hosting.

1. Authenticate with Firebase:
```bash
firebase login
```
2. Initialize Firebase (if not already done):
```bash
firebase init hosting
```
   - Select the production project.
   - Set the public directory to `dist`.
   - Configure as a single-page app (rewrite all URLs to `/index.html`).
3. Deploy:
```bash
firebase deploy --only hosting
```

## 4. Deploying to Google Cloud Run (Alternative)
For containerized deployments:
1. Ensure the Express middleware `server.ts` is configured.
2. Build the Docker image and deploy to Cloud Run using the standard GCP CI/CD pipeline.
