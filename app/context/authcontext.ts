// import React, {
//   createContext,
//   useContext,
//   useEffect,
//   useMemo,
//   useState,
// } from "react";
// import { auth } from "@/app/firebase";

// import {
//   User,
//   onAuthStateChanged,
//   signInWithEmailAndPassword,
//   createUserWithEmailAndPassword,
//   signOut,
//   GoogleAuthProvider,
//   signInWithCredential,
// } from "firebase/auth";

// import * as WebBrowser from "expo-web-browser";
// import * as Google from "expo-auth-session/providers/google";

// WebBrowser.maybeCompleteAuthSession();

// type AuthContextValue = {
//   user: User | null;
//   status: "loading" | "authenticated" | "unauthenticated";
//   loginWithEmail: (email: string, password: string) => Promise<void>;
//   signupWithEmail: (email: string, password: string) => Promise<void>;
//   loginWithGoogle: () => Promise<void>;
//   logout: () => Promise<void>;
// };

// const AuthContext = createContext<AuthContextValue | null>(null);

// export function useAuth() {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error("useAuth must be used within AuthProvider");
//   return ctx;
// }

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [user, setUser] = useState<User | null>(null);
//   const [status, setStatus] = useState<AuthContextValue["status"]>("loading");

//   // ---- Keep Firebase auth state in sync ----
//   useEffect(() => {
//     const unsub = onAuthStateChanged(auth, (u) => {
//       setUser(u);
//       setStatus(u ? "authenticated" : "unauthenticated");
//     });
//     return unsub;
//   }, []);

//   // ---- Google OAuth (get id_token) ----
//   const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
//     clientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
//     iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
//     androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
//     webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
//   });

//   // When Google returns an id_token, exchange for Firebase credential
//   useEffect(() => {
//     (async () => {
//       if (response?.type !== "success") return;

//       const idToken = response.params?.id_token;
//       if (!idToken) return;

//       const credential = GoogleAuthProvider.credential(idToken);
//       await signInWithCredential(auth, credential);
//     })();
//   }, [response]);

//   const loginWithEmail = async (email: string, password: string) => {
//     await signInWithEmailAndPassword(auth, email, password);
//   };

//   const signupWithEmail = async (email: string, password: string) => {
//     await createUserWithEmailAndPassword(auth, email, password);
//   };

//   const loginWithGoogle = async () => {
//     // promptAsync opens the browser flow
//     await promptAsync();
//   };

//   const logout = async () => {
//     await signOut(auth);
//   };

//   const value = useMemo<AuthContextValue>(
//     () => ({
//       user,
//       status,
//       loginWithEmail,
//       signupWithEmail,
//       loginWithGoogle,
//       logout,
//     }),
//     [user, status, request] // request changes rarely, ok
//   );

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// }
