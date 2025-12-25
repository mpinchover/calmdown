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
  Text,
  View,
} from "react-native";

import Card from "./components/card";

const fakeData = [
  {
    id: 1,
    url: "https://storage.googleapis.com/voyager-feed-public/videos/6440ada6-6d9f-48b9-b2d1-458dd9aa7d60",
  },
  {
    id: 2,
    url: "https://storage.googleapis.com/voyager-feed-public/videos/4f00790b-b906-4875-9153-4c328d774e57",
  },
];

const fakeDataAfterLoading = [
  {
    id: 3,
    url: "https://storage.googleapis.com/voyager-feed-public/videos/961d8c19-c4f4-4e18-9d43-20b26cb6530c",
  },
  {
    id: 4,
    url: "https://storage.googleapis.com/voyager-feed-public/videos/38a86c89-f87f-429c-a9e2-e4b45ece090b",
  },
];

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const LOADING_HEIGHT = Math.round(SCREEN_HEIGHT * 0.3);
const ADVANCE_THRESHOLD = 0.2 * SCREEN_HEIGHT;
const FAKE_API_MS = 3000; // ✅ fake “network call”
const FADE_MS = 180;
const SCROLL_BACK_MS = 300; // animation timing

const LoginModal = () => <View style={styles.loginModal} />;

export default function MainFeed() {
  // List data (grows after “fetch”)
  const [items, setItems] = useState(fakeData);

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
        return (
          <View style={[styles.loadingCard, { height: LOADING_HEIGHT }]}>
            <Text style={styles.loadingText}>Loading…</Text>
          </View>
        );
      }

      return (
        <Card
          url={item.url}
          isActive={index === activeIndex}
          isMuted={isMuted}
          toggleMute={toggleMute}
          toggleColorFilter={toggleColorFilter}
          overlayOpacity={overlayOpacity}
        />
      );
    },
    [activeIndex, isMuted, toggleMute, toggleColorFilter, overlayOpacity]
  );

  // Cleanup timer if unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    };
  }, []);

  return (
    <View style={styles.container}>
      <LoginModal />
      <StatusBar hidden />
      <FlatList
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  loadingCard: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.15)",
  },
  loadingText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 18,
    fontWeight: "600",
  },
  loginModal: {
    position: "absolute",
  },
});
