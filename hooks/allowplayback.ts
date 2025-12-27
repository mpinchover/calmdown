import { useIsFocused } from "@react-navigation/native";
import { useSegments } from "expo-router";

export function useAllowPlayback(allowedOverlays: string[]) {
  const isFocused = useIsFocused();
  const segments = useSegments();

  // If any allowed overlay is present in the current route tree, allow playback.
  const overlayAllowed = allowedOverlays.some((name) =>
    // @ts-ignore
    segments.includes(name)
  );

  return isFocused || overlayAllowed;
}
