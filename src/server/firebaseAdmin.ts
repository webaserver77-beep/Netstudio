import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import path from 'path';
import fs from 'fs';

let firestoreInstance: Firestore | null = null;
let hasCheckedCredentials = false;
let hasValidCredentials = false;

function checkHasCredentials(): boolean {
  if (hasCheckedCredentials) return hasValidCredentials;
  hasCheckedCredentials = true;

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    hasValidCredentials = true;
    return true;
  }

  // Check for common service account files
  const saPaths = [
    path.join(process.cwd(), 'service-account.json'),
    path.join(process.cwd(), 'firebase-service-account.json'),
    path.join(process.cwd(), 'credentials.json')
  ];

  for (const p of saPaths) {
    if (fs.existsSync(p)) {
      hasValidCredentials = true;
      return true;
    }
  }

  hasValidCredentials = false;
  return false;
}

export function getFirebaseAdminFirestore(): Firestore | null {
  if (!checkHasCredentials()) {
    // Avoid unauthenticated gRPC calls that produce 7 PERMISSION_DENIED errors
    return null;
  }

  if (firestoreInstance) {
    return firestoreInstance;
  }

  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(configPath)) {
      return null;
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    if (!config || !config.projectId) {
      return null;
    }

    const existingApps = getApps();
    const app = existingApps.length > 0
      ? getApp()
      : initializeApp({
          projectId: config.projectId,
          storageBucket: config.storageBucket
        });

    const dbId = config.firestoreDatabaseId;
    if (dbId && dbId !== '(default)') {
      firestoreInstance = getFirestore(app, dbId);
    } else {
      firestoreInstance = getFirestore(app);
    }

    return firestoreInstance;
  } catch (err) {
    return null;
  }
}

