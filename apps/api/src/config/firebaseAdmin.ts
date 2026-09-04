import { initializeApp, getApps, getApp, App, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const projectId =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  "gen-lang-client-0072881404";
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

export const isFirebaseConfigured = Boolean(clientEmail && privateKey);

// Warn in production if service account credentials are missing
if (process.env.NODE_ENV === "production" && !isFirebaseConfigured) {
  console.warn("⚠️  NOTICE: FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY not set. Using native JWT authentication.");
}

let firebaseAdminApp: App;

if (!getApps().length) {
  try {
    if (clientEmail && privateKey) {
      firebaseAdminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
      console.log(`🔥 Firebase Admin initialized with service account for: ${projectId}`);
    } else {
      firebaseAdminApp = initializeApp({
        projectId,
      });
      console.log(`🔥 Firebase Admin initialized for project: ${projectId}`);
    }
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
