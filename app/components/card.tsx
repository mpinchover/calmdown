import AntDesign from "@expo/vector-icons/AntDesign";
import Feather from "@expo/vector-icons/Feather";

import { ResizeMode, Video } from "expo-av";
import React, { useEffect, useRef } from "react";
import { Dimensions, Pressable, StyleSheet, View } from "react-native";
const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const CardMenu = ({ isMuted, toggleMute }) => {
  return (
    <View style={styles.cardMenu}>
      <Pressable onPress={toggleMute} hitSlop={12}>
        <Feather
          name={isMuted ? "volume-x" : "volume-2"}
          size={24}
          color="#d1d5db"
        />
      </Pressable>

      <AntDesign name="menu" size={24} color="#d1d5db" />
    </View>
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
  cardMenu: {
    position: "absolute",
    bottom: "10%",
    right: "5%",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // translucent black
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    borderRadius: 16, // use number, not percentage (RN best practice)
    rowGap: 20,
  },
});

export default Card;
