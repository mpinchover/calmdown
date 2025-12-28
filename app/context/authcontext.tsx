import { auth } from "@/app/config/firebase";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  GoogleAuthProvider,
  OAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import * as AppleAuthentication from "expo-apple-authentication";
import * as Google from "expo-auth-session/providers/google";
import * as Crypto from "expo-crypto";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

type AuthContextValue = {
  user: User | null;
  status: "loading" | "authenticated" | "unauthenticated";
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// ---- helpers for Apple nonce ----
function randomNonce(length = 32) {
  const chars =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let res = "";
  for (let i = 0; i < length; i++)
    res += chars[Math.floor(Math.random() * chars.length)];
  return res;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setStatus(u ? "authenticated" : "unauthenticated");
    });
    return unsub;
  }, []);

  // ✅ Google (Expo Auth Session)
  const [, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: "1:724373166676:web:d9a8feaf82e26256e4abc1", //process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
    iosClientId: "callysto", // process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: "1:724373166676:web:d9a8feaf82e26256e4abc1", // process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    (async () => {
      if (response?.type !== "success") return;
      const idToken = response.params?.id_token;
      if (!idToken) return;

      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
    })();
  }, [response]);

  const loginWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signupWithEmail = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    // opens browser prompt; auth updates via response effect above
    await promptAsync();
  };

  // ✅ Apple Sign In (iOS)
  const loginWithApple = async () => {
    const available = await AppleAuthentication.isAvailableAsync();
    if (!available) {
      throw new Error("Apple Sign In is not available on this device.");
    }

    // Firebase recommends a nonce for Apple
    const rawNonce = randomNonce();
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawNonce
    );

    const appleCred = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce, // hashed goes to Apple
    });

    if (!appleCred.identityToken) {
      throw new Error("Apple Sign In failed: missing identity token.");
    }

    const provider = new OAuthProvider("apple.com");
    const credential = provider.credential({
      idToken: appleCred.identityToken,
      rawNonce, // raw goes to Firebase
    });

    await signInWithCredential(auth, credential);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      loginWithEmail,
      signupWithEmail,
      loginWithGoogle,
      loginWithApple,
      logout,
    }),
    [user, status]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
