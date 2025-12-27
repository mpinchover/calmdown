import { router } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";

import Card from "./components/card";
import CardMenu from "./components/card-menu";
import LoadingCard from "./components/loading-card";
import initialFeed from "./fakedata/initial-feed.json";
import loadedFeed from "./fakedata/loaded-feed.json";

const fakeData = initialFeed;
const fakeDataAfterLoading = loadedFeed;

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const LOADING_HEIGHT = Math.round(SCREEN_HEIGHT * 0.3);
const ADVANCE_THRESHOLD = 0.2 * SCREEN_HEIGHT;
const FAKE_API_MS = 3000; // ✅ fake “network call”
const FADE_MS = 180;
const MENU_FADE_MS = 180;
const SCROLL_BACK_MS = 300; // animation timing
const TAP_SLOP = 8; // pixels

export default function Index() {
  // List data (grows after “fetch”)
  const [items, setItems] = useState(fakeData);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const menuOpacity = useRef(new Animated.Value(0)).current; // animated visibility

  // Derived indices/data
  const dataWithLoading = useMemo(
    () => [...items, { id: "loading", type: "loading" }],
    [items]
  );
  const lastRealIndex = items.length - 1;
  const loadingIndex = items.length;
  const maxIndex = dataWithLoading.length - 1; // includes loading sentinel

  // Refs to avoid stale closures (CRITICAL for viewability + timers)
  const listRef = useRef(null);
  const lastRealIndexRef = useRef(lastRealIndex);
  useEffect(() => {
    lastRealIndexRef.current = lastRealIndex;
  }, [lastRealIndex]);

  // UI state
  const [auth] = useState({ user: "123" }); // TODO replace with firebase auth
  // const auth = null;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [colorFilterOn, setColorFilterOn] = useState(false);

  const overlayOpacity = useRef(
    new Animated.Value(colorFilterOn ? 0.3 : 0)
  ).current;

  // Snap logic refs
  const currentIndexRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const snappingToIndexRef = useRef(null);

  // Loading behavior refs
  const pushedModalRef = useRef(false);
  const bounceBackLockRef = useRef(false);
  const isShowingLoadingRef = useRef(false);
  const loadingTimeoutRef = useRef(null);
  const hasLoadedMoreRef = useRef(false);

  const touchStartY = useRef(0);
  const touchStartX = useRef(0);

  const cardMenuRef = useRef(null);
  const menuRectRef = useRef(null); // { x, y, w, h } in window coords

  const showMenu = useCallback(() => {
    setIsMenuVisible(true);
    menuOpacity.stopAnimation();
    Animated.timing(menuOpacity, {
      toValue: 1,
      duration: MENU_FADE_MS,
      useNativeDriver: true,
    }).start();
  }, [menuOpacity]);

  const hideMenu = useCallback(() => {
    menuOpacity.stopAnimation();
    Animated.timing(menuOpacity, {
      toValue: 0,
      duration: MENU_FADE_MS,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsMenuVisible(false);
        setIsMenuOpen(false); // optional collapse
      }
    });
  }, [menuOpacity, setIsMenuOpen]);

  const refreshMenuRect = useCallback(() => {
    // measure after layout has happened
    requestAnimationFrame(() => {
      cardMenuRef.current?.measureInWindow((x, y, w, h) => {
        menuRectRef.current = { x, y, w, h };
      });
    });
  }, []);

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(v, hi));

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const toggleColorFilter = useCallback(() => {
    setColorFilterOn((prev) => !prev);
  }, []);

  // Animate overlay whenever global filter changes
  useEffect(() => {
    overlayOpacity.stopAnimation();
    Animated.timing(overlayOpacity, {
      toValue: colorFilterOn ? 0.3 : 0,
      duration: FADE_MS,
      useNativeDriver: true,
    }).start();
  }, [colorFilterOn, overlayOpacity]);

  useEffect(() => {
    if (isMenuVisible) refreshMenuRect();
  }, [isMenuVisible, isMenuOpen, refreshMenuRect]);

  const scrollToIndexAnimated = useCallback(
    (index) => {
      const clamped = clamp(index, 0, maxIndex);
      currentIndexRef.current = clamped;
      snappingToIndexRef.current = clamped;

      listRef.current?.scrollToOffset({
        offset: clamped * SCREEN_HEIGHT,
        animated: true,
      });
    },
    [maxIndex]
  );

  const decideTargetFromDrag = useCallback((endOffsetY) => {
    const startOffset = dragStartOffsetRef.current;
    const delta = endOffsetY - startOffset; // >0 => swipe up
    const current = currentIndexRef.current;

    if (Math.abs(delta) >= ADVANCE_THRESHOLD) {
      return delta > 0 ? current + 1 : current - 1;
    }
    return current;
  }, []);

  const viewabilityConfig = useRef({
    // Lower-ish so the 30% loading item can still be “viewable”
    itemVisiblePercentThreshold: 10,
  }).current;

  // ✅ Fake API + append + keep loading visible for 3 seconds, then snap back
  const handleLoadingStateRef = useRef(null);
  handleLoadingStateRef.current = () => {
    if (bounceBackLockRef.current) return;

    bounceBackLockRef.current = true;
    isShowingLoadingRef.current = true;

    const snapBackIndex = lastRealIndexRef.current;

    // ---------- FAST SCROLL BACK (300ms) ----------
    setTimeout(() => {
      listRef.current?.scrollToIndex({
        index: snapBackIndex,
        animated: true,
        viewPosition: 0,
      });

      isShowingLoadingRef.current = false;
      bounceBackLockRef.current = false;
    }, SCROLL_BACK_MS);

    // ---------- FAKE API CALL (3000ms) ----------
    if (!hasLoadedMoreRef.current) {
      hasLoadedMoreRef.current = true;

      setTimeout(() => {
        setItems((prev) => [...prev, ...fakeDataAfterLoading]);
      }, FAKE_API_MS);
    }

    // Optional auth gate (unchanged)
    if (!auth && !pushedModalRef.current) {
      pushedModalRef.current = true;
      router.push("/login-modal");
      pushedModalRef.current = false;
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    // Prefer detecting loading first (it can overlap with last full card)
    const loading = viewableItems?.find(
      (x) => x.isViewable && x.item?.type === "loading"
    );
    if (loading) {
      handleLoadingStateRef.current?.();
      return;
    }

    const v = viewableItems?.find((x) => x.isViewable);
    if (!v) return;

    // Use ref so newly appended items can become active
    if (v.index != null && v.index <= lastRealIndexRef.current) {
      setActiveIndex(v.index);
    }
  }).current;

  const viewabilityConfigCallbackPairs = useRef([
    { viewabilityConfig, onViewableItemsChanged },
  ]).current;

  const renderItem = useCallback(
    ({ item, index }) => {
      if (item.type === "loading") {
        return <LoadingCard />;
      }

      return (
        <Card
          url={item.url}
          isActive={index === activeIndex}
          isMuted={isMuted}
          overlayOpacity={overlayOpacity}
        />
      );
    },
    [
      activeIndex,
      isMuted,
      toggleMute,
      toggleColorFilter,
      overlayOpacity,
      isMenuOpen, // ✅ add
      setIsMenuOpen,
    ]
  );

  const onScreenTap = () => {
    // setIsMenuOpen((pr
    setIsMenuVisible((prev) => !prev);
  };

  // Cleanup timer if unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    };
  }, []);

  return (
    <View
      style={styles.container}
      onTouchStart={(e) => {
        const { pageX, pageY } = e.nativeEvent;
        touchStartX.current = pageX;
        touchStartY.current = pageY;
      }}
      onTouchEnd={(e) => {
        const { pageX, pageY } = e.nativeEvent;

        const dx = Math.abs(pageX - touchStartX.current);
        const dy = Math.abs(pageY - touchStartY.current);

        const isTap = dx < TAP_SLOP && dy < TAP_SLOP;
        if (!isTap) return;

        // If menu is visible and tap is INSIDE it, do nothing
        if (isMenuVisible && menuRectRef.current) {
          const { x, y, w, h } = menuRectRef.current;
          const inside =
            pageX >= x && pageX <= x + w && pageY >= y && pageY <= y + h;

          if (inside) return; // ✅ don't hide while using menu
        }

        // Otherwise toggle:
        // - if hidden -> show
        // - if visible + outside -> hide
        console.log("TAP (not scroll)");
        // setIsMenuVisible((prev) => !prev);

        // // optional: collapse when hiding
        // if (isMenuVisible) setIsMenuOpen(false);
        if (isMenuVisible) hideMenu();
        else showMenu();
      }}
    >
      <StatusBar hidden />

      <FlatList
        // initialNumToRender={2}
        // maxToRenderPerBatch={2}
        // updateCellsBatchingPeriod={50}
        // windowSize={3}
        // removeClippedSubviews={true}
        // android ^
        ref={listRef}
        data={dataWithLoading}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        pagingEnabled
        decelerationRate="fast"
        snapToAlignment="start"
        disableIntervalMomentum
        scrollEventThrottle={16}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
        getItemLayout={(_, index) => {
          if (index === loadingIndex) {
            return {
              length: LOADING_HEIGHT,
              offset: SCREEN_HEIGHT * items.length, // items.length is where loading starts
              index,
            };
          }
          return {
            length: SCREEN_HEIGHT,
            offset: SCREEN_HEIGHT * index,
            index,
          };
        }}
        onScrollBeginDrag={(e) => {
          dragStartOffsetRef.current = e.nativeEvent.contentOffset.y;
          snappingToIndexRef.current = null;
        }}
        onScrollEndDrag={(e) => {
          if (isShowingLoadingRef.current) return;

          const endY = e.nativeEvent.contentOffset.y;
          const current = currentIndexRef.current;
          const rawTarget = decideTargetFromDrag(endY);

          // limit to +/- 1 card per gesture
          const oneStepTarget = clamp(rawTarget, current - 1, current + 1);

          scrollToIndexAnimated(oneStepTarget);
        }}
        onMomentumScrollEnd={(e) => {
          if (isShowingLoadingRef.current) return;

          const y = e.nativeEvent.contentOffset.y;
          const landed = clamp(Math.round(y / SCREEN_HEIGHT), 0, maxIndex);

          const current = currentIndexRef.current;
          const oneStepLanded = clamp(landed, current - 1, current + 1);

          // If we initiated an animated snap, trust it.
          if (snappingToIndexRef.current != null) {
            const target = snappingToIndexRef.current;
            const targetOffset = target * SCREEN_HEIGHT;
            const dist = Math.abs(y - targetOffset);

            currentIndexRef.current = target;

            // tiny correction for fractional offsets
            if (dist < 2) {
              listRef.current?.scrollToOffset({
                offset: targetOffset,
                animated: false,
              });
            }

            snappingToIndexRef.current = null;
            return;
          }

          // If user somehow landed elsewhere, animate to allowed page
          if (oneStepLanded !== landed) {
            scrollToIndexAnimated(oneStepLanded);
          } else {
            currentIndexRef.current = landed;
          }
        }}
      />
      {/* <Pressable style={styles.tapCatcher} onPress={onScreenTap} /> */}

      {isMenuVisible && (
        <CardMenu
          cardMenuRef={cardMenuRef}
          onMenuLayout={refreshMenuRect}
          isMuted={isMuted}
          toggleMute={toggleMute}
          toggleColorFilter={toggleColorFilter}
          setIsMenuOpen={setIsMenuOpen}
          isMenuOpen={isMenuOpen}
          menuOpacity={menuOpacity}
          menuPointerEvents="auto"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black", position: "relative" },
  loginModal: {
    position: "absolute",
  },
  tapCatcher: {
    ...StyleSheet.absoluteFillObject,
    // keep it invisible
    backgroundColor: "transparent",
    // CardMenu has absolute positioning later in tree, so it renders above this.
  },
});
