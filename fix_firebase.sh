#!/bin/bash
sed -i "s/import { getFirestore, collection, doc, setDoc, deleteDoc, getDocs, writeBatch, query, where } from 'firebase\/firestore';/import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, doc, setDoc, deleteDoc, getDocs, writeBatch, query, where } from 'firebase\/firestore';/" src/firebase.ts

sed -i "s/export const db = firebaseConfig.firestoreDatabaseId/export const db = firebaseConfig.firestoreDatabaseId\n  ? initializeFirestore(app, { localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()}) }, firebaseConfig.firestoreDatabaseId)\n  : initializeFirestore(app, { localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()}) });\n\n\/*/" src/firebase.ts

sed -i "s/  : getFirestore(app);/  : getFirestore(app);\n*\//" src/firebase.ts

