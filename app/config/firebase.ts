import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

// const firebaseConfig = {
//   apiKey: "AIzaSyCIsEqg8LfdNtwjtIyR0rRYGH4tLdJrU9Q",
//   authDomain: "callysto-6286f.firebaseapp.com",
//   projectId: "callysto-6286f",
//   storageBucket: "callysto-6286f.firebasestorage.app",
//   messagingSenderId: "724373166676",
//   appId: "1:724373166676:web:d9a8feaf82e26256e4abc1",
// };

const firebaseConfig = {
  apiKey: "fake-api-key",
  authDomain: "localhost",
  projectId: "callysto-6286f",
  appId: "callysto-6286f",
};

// const firebaseConfig = {};
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ✅ initializeAuth once, otherwise fall back to getAuth
export const auth = (() => {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (e: any) {
    // If auth was already initialized, Firebase throws
    return getAuth(app);
  }
})();

// --- Firestore ---
export const db = getFirestore(app);

// 👇 Connect emulators ONLY once, ONLY in dev, ONLY in browser
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  // Auth emulator
  if (!("emulatorConnected" in auth)) {
    connectAuthEmulator(auth, "http://localhost:9099", {
      disableWarnings: true,
    });

    // @ts-ignore
    auth.emulatorConnected = true;
  }

  // Firestore emulator
  if (!("emulatorConnected" in db)) {
    connectFirestoreEmulator(db, "localhost", 8080);
    // @ts-ignore
    db.emulatorConnected = true;
  }
}
