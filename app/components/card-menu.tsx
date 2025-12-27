// card-menu.ts
import { useAuth } from "@/app/context/authcontext";
import AntDesign from "@expo/vector-icons/AntDesign";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";

const ICON_SIZE = 24;
const GAP = 20;
const PAD = 20;
const EXTRA_COUNT_LOGGED_IN = 2;
const EXTRA_COUNT_LOGGED_OUT = 1;

const CardMenu = ({
  isMuted,
  toggleMute,
  toggleColorFilter,
  setIsMenuOpen,
  isMenuOpen,
  cardMenuRef,
  onMenuLayout,
  menuOpacity,
  menuPointerEvents,
}) => {
  const { user, logout } = useAuth();
  const t = useRef(new Animated.Value(isMenuOpen ? 1 : 0)).current;
  const extraCount = user ? EXTRA_COUNT_LOGGED_IN : EXTRA_COUNT_LOGGED_OUT;

  useEffect(() => {
    Animated.timing(t, {
      toValue: isMenuOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: false, // height => JS driver
    }).start();
  }, [isMenuOpen, t]);

  const middleFullHeight =
    2 * GAP + extraCount * ICON_SIZE + (extraCount - 1) * GAP;

  const closedHeight = PAD * 2 + ICON_SIZE * 2 + GAP;
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

  return (
    // ✅ OUTER: opacity only (native driver is OK here)
    <Animated.View
      ref={cardMenuRef}
      onLayout={onMenuLayout}
      pointerEvents={menuPointerEvents}
      style={[styles.menuOpacityWrap, { opacity: menuOpacity }]}
    >
      {/* ✅ INNER: height animation only (JS driver) */}
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

            {user && (
              <Pressable
                onPress={() => router.push("/account-modal")}
                hitSlop={12}
              >
                <MaterialCommunityIcons
                  name="account"
                  size={ICON_SIZE}
                  color="#d1d5db"
                />
              </Pressable>
            )}
          </View>
        </Animated.View>

        <Pressable onPress={() => setIsMenuOpen((p) => !p)} hitSlop={12}>
          <AntDesign name="menu" size={ICON_SIZE} color="#d1d5db" />
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

export default CardMenu;

const styles = StyleSheet.create({
  // ✅ opacity wrapper: positioning lives here now
  menuOpacityWrap: {
    position: "absolute",
    bottom: "10%",
    right: "5%",
  },

  // ✅ actual menu box styling stays here
  cardMenu: {
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
