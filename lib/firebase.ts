import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, initializeFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const isFirebaseConfigured = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.appId,
].every(Boolean);

let app: FirebaseApp | any = null;
let db: Firestore | any = null;
let auth: Auth | any = null;
let analytics: Analytics | Promise<Analytics | null> | null = null;

if (isFirebaseConfigured) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    try {
      db = initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
      });
    } catch {
      db = getFirestore(app);
    }
    auth = getAuth(app);
    analytics =
      typeof window !== "undefined"
        ? isSupported().then((yes) => (yes && app ? getAnalytics(app) : null))
        : null;
  } catch (error) {
    console.warn(
      "Advertencia: No se pudo inicializar Firebase. Revisa las variables NEXT_PUBLIC_FIREBASE_* del build.",
      error
    );
  }
} else {
  console.warn(
    "Advertencia: Firebase no esta configurado. Faltan variables NEXT_PUBLIC_FIREBASE_* durante el build."
  );
}

export { app, db, auth, analytics, isFirebaseConfigured };
