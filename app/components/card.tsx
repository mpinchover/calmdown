import AntDesign from "@expo/vector-icons/AntDesign";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { ResizeMode, Video } from "expo-av";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const ICON_SIZE = 24;
const GAP = 20;
const PAD = 20;
const EXTRA_COUNT = 2;

const COLOR_FILTER = "rgba(255, 247, 25, 1)";

const CardMenu = ({
  isMuted,
  toggleMute,
  toggleColorFilter,
  setIsMenuOpen,
  isMenuOpen,
}) => {
  //   const [open, setOpen] = useState(false);
  const t = useRef(new Animated.Value(0)).current;

  const middleFullHeight =
    2 * GAP + EXTRA_COUNT * ICON_SIZE + (EXTRA_COUNT - 1) * GAP;

  const EXTRA_GAP = GAP;
  const closedHeight = PAD * 2 + ICON_SIZE * 2 + EXTRA_GAP;
  const openHeight = closedHeight + middleFullHeight;

  const animatedHeight = t.interpolate({
    inputRange: [0, 1],
    outputRange: [closedHeight, openHeight],
  });

  const middleHeight = t.interpolate({
    inputRange: [0, 1],
    outputRange: [0, middleFullHeight],
  });

  const extrasOpacity = t.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 0, 1],
  });

  const toggleMenu = () => {
    const next = !isMenuOpen;
    setIsMenuOpen(next);
    Animated.timing(t, {
      toValue: next ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  return (
    <Animated.View style={[styles.cardMenu, { height: animatedHeight }]}>
      <Pressable onPress={toggleMute} hitSlop={12}>
        <Feather
          name={isMuted ? "volume-x" : "volume-2"}
          size={ICON_SIZE}
          color="#d1d5db"
        />
      </Pressable>

      <Animated.View
        style={[
          styles.middleWrap,
          { height: middleHeight, opacity: extrasOpacity },
        ]}
        pointerEvents={isMenuOpen ? "auto" : "none"}
      >
        <View style={styles.middleInner}>
          <Pressable onPress={toggleColorFilter} hitSlop={12}>
            <Ionicons name="color-filter" size={ICON_SIZE} color="#d1d5db" />
          </Pressable>

          <Pressable onPress={() => router.push("/account-modal")} hitSlop={12}>
            <MaterialCommunityIcons
              name="account"
              size={ICON_SIZE}
              color="#d1d5db"
            />
          </Pressable>
        </View>
      </Animated.View>

      <Pressable onPress={toggleMenu} hitSlop={12}>
        <AntDesign name="menu" size={ICON_SIZE} color="#d1d5db" />
      </Pressable>
    </Animated.View>
  );
};

export default function Card({
  url,
  isActive,
  isMuted,
  toggleMute,
  toggleColorFilter,
  overlayOpacity, // ✅ animated value from MainFeed
  setIsMenuOpen,
  isMenuOpen,
}) {
  const videoRef = useRef(null);

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
        shouldPlay={isActive}
        isMuted={!isActive || isMuted}
      />

      <Animated.View
        pointerEvents="none"
        style={[styles.desaturateOverlay, { opacity: overlayOpacity }]}
      />

      <CardMenu
        isMuted={isMuted}
        toggleMute={toggleMute}
        toggleColorFilter={toggleColorFilter}
        setIsMenuOpen={setIsMenuOpen}
        isMenuOpen={isMenuOpen}
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
  cardMenu: {
    position: "absolute",
    bottom: "10%",
    right: "5%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 16,
    padding: PAD,
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
  },
  middleWrap: { width: "100%", overflow: "hidden" },
  middleInner: { marginVertical: GAP, alignItems: "center", rowGap: GAP },
});
