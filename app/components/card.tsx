import AntDesign from "@expo/vector-icons/AntDesign";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { ResizeMode, Video } from "expo-av";
import React, { useEffect, useRef, useState } from "react";
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
const BG = "rgba(0, 0, 0, 0.5)";

const CardMenu = ({ isMuted, toggleMute }) => {
  const [open, setOpen] = useState(false);
  const t = useRef(new Animated.Value(0)).current; // 0 closed -> 1 open

  const middleFullHeight =
    2 * GAP + EXTRA_COUNT * ICON_SIZE + (EXTRA_COUNT - 1) * GAP;

  // Closed height includes padding and enough room for space-between to feel good.
  // We'll add an EXTRA_GAP so the two icons aren't cramped.
  const EXTRA_GAP = GAP; // tweak if you want more/less space when closed
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
    const next = !open;
    setOpen(next);
    Animated.timing(t, {
      toValue: next ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  return (
    <Animated.View style={[styles.cardMenu, { height: animatedHeight }]}>
      {/* TOP: Volume */}
      <Pressable onPress={toggleMute} hitSlop={12}>
        <Feather
          name={isMuted ? "volume-x" : "volume-2"}
          size={ICON_SIZE}
          color="#d1d5db"
        />
      </Pressable>

      {/* MIDDLE: expandable area */}
      <Animated.View
        style={[
          styles.middleWrap,
          { height: middleHeight, opacity: extrasOpacity },
        ]}
        pointerEvents={open ? "auto" : "none"}
      >
        <View style={styles.middleInner}>
          {/* <Pressable onPress={() => {}} hitSlop={12}>
            <Feather name="volume-x" size={ICON_SIZE} color="#d1d5db" />
          </Pressable> */}
          <Pressable onPress={() => {}} hitSlop={12}>
            <Ionicons name="color-filter" size={ICON_SIZE} color="#d1d5db" />
          </Pressable>
          <Pressable onPress={() => {}} hitSlop={12}>
            <MaterialCommunityIcons
              name="account"
              size={ICON_SIZE}
              color="#d1d5db"
            />
          </Pressable>
        </View>
      </Animated.View>

      {/* BOTTOM: Menu */}
      <Pressable onPress={toggleMenu} hitSlop={12}>
        <AntDesign name="menu" size={ICON_SIZE} color="#d1d5db" />
      </Pressable>
    </Animated.View>
  );
};

const Card = ({ url, isActive, isMuted, toggleMute }) => {
  const videoRef = useRef(null);

  // When leaving, reset to 0 so it’s ready next time
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    (async () => {
      try {
        if (!isActive) {
          await v.setPositionAsync(0);
        }
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
        // ✅ Let props control play/pause so rerenders don't stop playback
        shouldPlay={isActive}
        // ✅ Global mute + only active can have audio
        isMuted={!isActive || isMuted}
      />

      <CardMenu isMuted={isMuted} toggleMute={toggleMute} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    height: SCREEN_HEIGHT,
    width: "100%",
    backgroundColor: "black",
    position: "relative",
  },
  //   cardMenu: {
  //     position: "absolute",
  //     bottom: "10%",
  //     right: "5%",
  //     backgroundColor: "rgba(0, 0, 0, 0.5)", // translucent black
  //     flexDirection: "column",
  //     justifyContent: "center",
  //     alignItems: "center",
  //     padding: 20,
  //     borderRadius: 16, // use number, not percentage (RN best practice)
  //     rowGap: 20,
  //   },
  expandedStack: {
    backgroundColor: "rgba(0, 0, 0, 0.5)", // translucent black
    position: "absolute",
    // Sit on top of the volume+menu row, then animate upward from there.
    // 20 padding + volume icon + GAP puts the stack right above.
    bottom: 20 + ICON_SIZE + GAP,
    right: 20,
    alignItems: "center",
    rowGap: GAP,
  },
  root: {
    position: "absolute",
    bottom: "10%",
    right: "5%",
    alignItems: "center",
  },

  expandedMenu: {
    position: "absolute",
    bottom: "100%", // sit directly above the base menu
    marginBottom: GAP,
    backgroundColor: BG,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    rowGap: GAP,
  },
  cardMenu: {
    position: "absolute",
    bottom: "10%",
    right: "5%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 16,
    padding: PAD,
    alignItems: "center",
    justifyContent: "space-between", // ✅ key: evenly spaces top/bottom in closed state
    overflow: "hidden",
  },

  middleWrap: {
    width: "100%",
    overflow: "hidden",
  },

  middleInner: {
    marginVertical: GAP,
    alignItems: "center",
    rowGap: GAP,
  },
  // Middle section: has its own top/bottom spacing so it visually sits between volume/menu
  extrasMiddle: {
    marginVertical: GAP, // space above/below between volume and menu
    alignItems: "center",
    rowGap: GAP, // space between the middle icons
  },

  // Extras stack sits above the base row inside same container
  extras: {
    alignItems: "center",
    rowGap: GAP,
    marginBottom: GAP, // gap between extras and volume button
  },

  // Base row is always visible at the bottom
  base: {
    alignItems: "center",
    rowGap: GAP,
  },
});

export default Card;
