import { ResizeMode, Video } from "expo-av";
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const GAP = 20;
const PAD = 20;

const COLOR_FILTER = "rgba(255, 247, 25, 1)";

export default function Card({
  url,
  isActive,
  isMuted,
  overlayOpacity, // ✅ animated value from MainFeed
  isScreenFocused,
  screen,
}) {
  const videoRef = useRef(null);
  const shouldPlay = isActive && isScreenFocused;
  console.log(
    `${screen} SHOULD PLAY, ${shouldPlay} is_active ${isActive} isScreenFocused ${isScreenFocused}`
  );

  // reset when leaving
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    (async () => {
      try {
        if (!isActive) await v.setPositionAsync(0);
      } catch {}
    })();
  }, [isActive]);

  return (
    <View style={styles.card}>
      <Video
        ref={videoRef}
        source={{ uri: url }}
        style={StyleSheet.absoluteFill}
        resizeMode={ResizeMode.COVER}
        isLooping
        shouldPlay={shouldPlay}
        isMuted={!isActive || isMuted}
      />

      <Animated.View
        pointerEvents="none"
        style={[styles.desaturateOverlay, { opacity: overlayOpacity }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: SCREEN_HEIGHT,
    width: "100%",
    position: "relative",
    backgroundColor: "black",
  },
  desaturateOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLOR_FILTER,
  },
});
