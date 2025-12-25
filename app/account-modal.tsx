// import { useAuth } from "@/app/context/authcontext";
import { ThemedText } from "@/components/themed-text";
import AntDesign from "@expo/vector-icons/AntDesign";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, TextInput, View } from "react-native";

export default function AccountModal() {
  // const { loginWithEmail, signupWithEmail, loginWithGoogle } = useAuth();

  // Replace this later with Firebase user email, e.g.:
  // const email = user?.email ?? "";
  const [email] = useState("user@example.com");

  const onSubmit = async () => {
    try {
      // no-op for account screen
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Something went wrong");
    }
  };

  return (
    <View style={styles.container}>
      {/* Close button */}
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        style={styles.closeButton}
      >
        <AntDesign name="close" size={24} color={GREY} />
      </Pressable>

      <View style={styles.card}>
        <ThemedText type="title" style={styles.title}>
          Account
        </ThemedText>

        <TextInput
          value={email}
          editable={false}
          selectTextOnFocus={false}
          pointerEvents="none"
          placeholder="Email"
          placeholderTextColor="rgba(209,213,219,0.6)"
          style={[styles.input, { opacity: 0.7 }]}
        />

        {/* Optional: keep button (currently no-op) or remove it if you want */}
        {/* <Pressable style={styles.primaryBtn} onPress={onSubmit}>
          <ThemedText style={styles.primaryBtnText}>Done</ThemedText>
        </Pressable> */}
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
