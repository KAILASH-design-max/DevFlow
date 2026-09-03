import { initializeApp, getApps, getApp, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const projectId =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  "gen-lang-client-0072881404";

let firebaseAdminApp: App;

if (!getApps().length) {
  try {
    firebaseAdminApp = initializeApp({
      projectId,
    });
    console.log(`🔥 Firebase Admin initialized for project: ${projectId}`);
  } catch (err) {
    console.warn("⚠️ Firebase Admin initialization warning:", err);
    firebaseAdminApp = getApp();
  }
} else {
  firebaseAdminApp = getApp();
}

export const adminAuth = getAuth(firebaseAdminApp);
export const adminFirestore = getFirestore(firebaseAdminApp);
export default firebaseAdminApp;
