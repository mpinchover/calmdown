import { useAuth } from "@/app/context/authcontext";
import { ThemedText } from "@/components/themed-text";
import AntDesign from "@expo/vector-icons/AntDesign";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, TextInput, View } from "react-native";

export default function ModalScreen() {
  const { loginWithEmail, signupWithEmail, loginWithGoogle } = useAuth();

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
      // router.dismiss();
    } catch (e: any) {
      Alert.alert("Auth error", e?.message ?? "Something went wrong");
    }
  };

  const onGoogle = async () => {
    try {
      // await loginWithGoogle();
      // The provider effect will sign into Firebase; modal can close when auth state updates,
      // but simplest is to close immediately after launching prompt.
      // If you prefer: don't close here; close after user becomes authed.
    } catch (e: any) {
      Alert.alert("Google sign-in error", e?.message ?? "Something went wrong");
    }
  };

  return (
    <View style={styles.container}>
      {/* Close button */}
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
          keyboardType="email-address"
          style={styles.input}
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor="rgba(209,213,219,0.6)"
          secureTextEntry
          style={styles.input}
        />

        <Pressable style={styles.primaryBtn} onPress={onSubmit}>
          <ThemedText style={styles.primaryBtnText}>
            {isLogin ? "Log in" : "Sign up"}
          </ThemedText>
        </Pressable>

        <Pressable style={styles.googleBtn} onPress={onGoogle}>
          <ThemedText style={styles.secondaryBtnText}>
            Continue with Google
          </ThemedText>
        </Pressable>

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

        {/* <Link href="/" dismissTo style={styles.closeLink}> */}
        {/* <ThemedText style={styles.linkText}>Close</ThemedText> */}
        {/* </Link> */}
      </View>
    </View>
  );
}
const GREY = "#d1d5db";

const styles = StyleSheet.create({
  // Semi-transparent backdrop so previous screen shows through
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.8)",
  },

  // Card itself
  card: {
    borderRadius: 16,
    padding: 20,
    // backgroundColor: "rgba(0,0,0,0.75)",
    // borderWidth: 1,
    // borderColor: "rgba(209,213,219,0.18)",
  },

  title: {
    marginBottom: 16,
    color: GREY,
  },

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

  primaryBtnText: {
    color: GREY,
    fontWeight: "600",
  },

  googleBtn: {
    marginTop: 10,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(209,213,219,0.25)",
  },

  secondaryBtnText: {
    color: GREY,
  },

  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 18,
  },

  switchText: {
    color: "rgba(209,213,219,0.7)",
  },

  linkText: {
    color: GREY,
  },
  closeButton: {
    position: "absolute",
    top: 24,
    right: 24,
    zIndex: 10,
  },

  // closeLink: {
  //   marginTop: 20,
  //   alignItems: "center",
  //   paddingVertical: 8,
  // },
});
