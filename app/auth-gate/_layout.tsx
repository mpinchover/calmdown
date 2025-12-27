import { useAuth } from "@/app/context/authcontext";
import { Redirect, Slot } from "expo-router";

export default function AuthGateLayout() {
  const { user, status } = useAuth();

  // Still resolving Firebase auth
  if (status === "loading") {
    return null; // or splash / loader
  }

  // ❌ Not logged in → index (/)
  if (!user) {
    return <Redirect href="/" />;
  }

  // ✅ Logged in → allow access
  return <Slot />;
}
