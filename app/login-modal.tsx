import { useAuth } from "@/app/context/authcontext";
import { ThemedText } from "@/components/themed-text";
import AntDesign from "@expo/vector-icons/AntDesign";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

export default function ModalScreen() {
  const { loginWithEmail, signupWithEmail, loginWithGoogle, loginWithApple } =
    useAuth();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const isLogin = mode === "login";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing info", "Please enter email and password.");
      return;
    }
    try {
      if (isLogin) await loginWithEmail(email.trim(), password);
      else await signupWithEmail(email.trim(), password);
      router.dismiss();
    } catch (e: any) {
      Alert.alert("Auth error", e?.message ?? "Something went wrong");
    }
  };

  const onGoogle = async () => {
    try {
      await loginWithGoogle();
      // optional: you can dismiss after auth state changes instead
      // router.dismiss();
    } catch (e: any) {
      Alert.alert("Google sign-in error", e?.message ?? "Something went wrong");
    }
  };

  const onApple = async () => {
    try {
      await loginWithApple();
      // optional: router.dismiss();
    } catch (e: any) {
      Alert.alert("Apple sign-in error", e?.message ?? "Something went wrong");
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => router.dismiss()}
        hitSlop={12}
        style={styles.closeButton}
      >
        <AntDesign name="close" size={24} color={GREY} />
      </Pressable>

      <View style={styles.card}>
        <ThemedText type="title" style={styles.title}>
          {isLogin ? "Log in" : "Create account"}
        </ThemedText>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="rgba(209,213,219,0.6)"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          textContentType="none"
          autoComplete="off"
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor="rgba(209,213,219,0.6)"
          secureTextEntry
          style={styles.input}
          textContentType="none"
          autoComplete="off"
        />

        <Pressable style={styles.primaryBtn} onPress={onSubmit}>
          <ThemedText style={styles.primaryBtnText}>
            {isLogin ? "Log in" : "Sign up"}
          </ThemedText>
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <ThemedText style={styles.dividerText}>OR</ThemedText>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.oauthGroup}>
          <Pressable style={styles.oauthBtn} onPress={onGoogle}>
            <ThemedText style={styles.secondaryBtnText}>
              Continue with Google
            </ThemedText>
          </Pressable>

          {Platform.OS === "ios" && (
            <Pressable style={styles.oauthBtn} onPress={onApple}>
              <ThemedText style={styles.secondaryBtnText}>
                Continue with Apple
              </ThemedText>
            </Pressable>
          )}
        </View>
        <Pressable
          onPress={() => setMode(isLogin ? "signup" : "login")}
          style={styles.switchRow}
        >
          <ThemedText style={styles.switchText}>
            {isLogin ? "New here? " : "Already have an account? "}
          </ThemedText>
          <ThemedText style={styles.linkText}>
            {isLogin ? "Sign up" : "Log in"}
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}
const GREY = "#d1d5db";
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  card: { borderRadius: 16, padding: 20 },
  title: { marginBottom: 16, color: GREY },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(209,213,219,0.25)",
    color: GREY,
  },
  primaryBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: GREY,
    marginTop: 6,
  },
  primaryBtnText: { color: GREY, fontWeight: "600" },
  googleBtn: {
    marginTop: 10,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(209,213,219,0.25)",
  },
  secondaryBtnText: { color: GREY },
  switchRow: { flexDirection: "row", justifyContent: "center", marginTop: 18 },
  switchText: { color: "rgba(209,213,219,0.7)" },
  linkText: { color: GREY },
  closeButton: { position: "absolute", top: 24, right: 24, zIndex: 10 },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(209,213,219,0.25)",
  },

  dividerText: {
    marginHorizontal: 10,
    color: "rgba(209,213,219,0.6)",
    fontSize: 12,
  },

  oauthGroup: {
    rowGap: 10,
  },

  oauthBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(209,213,219,0.25)",
  },
});
