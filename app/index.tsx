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

const dataWithLoading = [
  ...fakeData,
  {
    id: "loading",
    type: "loading",
  },
];

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const LOADING_HEIGHT = Math.round(SCREEN_HEIGHT * 0.3);
const ADVANCE_THRESHOLD = 0.2 * SCREEN_HEIGHT;
const LOADING_STICK_MS = 300;
const FADE_MS = 180;

const LoginModal = () => {
  return <View style={styles.loginModal} />;
};

export default function MainFeed() {
  // TODO - replace with firebase auth
  const [auth, setAuth] = useState({ user: "123" });
  const listRef = useRef(null);
  const maxIndex = useMemo(() => dataWithLoading.length - 1, []);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const pushedModalRef = useRef(false);
  const [lastRealIndex, setLastRealIndex] = useState(fakeData.length - 1);
  const [loadingIndex, setLoadingIndex] = useState(dataWithLoading.length - 1);
  const bounceBackLockRef = useRef(false);
  const loadingTimeoutRef = useRef(null);
  const isShowingLoadingRef = useRef(false);
  const [colorFilterOn, setColorFilterOn] = useState(false);

  const overlayOpacity = useRef(
    new Animated.Value(colorFilterOn ? 0.3 : 0)
  ).current;

  const currentIndexRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const snappingToIndexRef = useRef(null); // when we trigger an animated snap

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(v, hi));

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const toggleColorFilter = useCallback(() => {
    setColorFilterOn((prev) => !prev);
  }, []);

  const scrollToIndexAnimated = (index) => {
    const clamped = clamp(index, 0, maxIndex);
    currentIndexRef.current = clamped;
    snappingToIndexRef.current = clamped;

    listRef.current?.scrollToOffset({
      offset: clamped * SCREEN_HEIGHT,
      animated: true,
    });
  };

  const decideTargetFromDrag = (endOffsetY) => {
    const startOffset = dragStartOffsetRef.current;
    const delta = endOffsetY - startOffset; // >0 => swipe up

    const current = currentIndexRef.current;

    if (Math.abs(delta) >= ADVANCE_THRESHOLD) {
      return delta > 0 ? current + 1 : current - 1;
    }
    return current;
  };

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 30,
  }).current;

  // ✅ animate overlay whenever global filter changes
  useEffect(() => {
    overlayOpacity.stopAnimation();
    Animated.timing(overlayOpacity, {
      toValue: colorFilterOn ? 0.3 : 0,
      duration: FADE_MS,
      useNativeDriver: true,
    }).start();
  }, [colorFilterOn, overlayOpacity]);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    const loading = viewableItems?.find(
      (x) => x.isViewable && x.item?.type === "loading"
    );

    if (loading) {
      if (bounceBackLockRef.current) return;

      bounceBackLockRef.current = true;
      isShowingLoadingRef.current = true;

      // If already scheduled, don't schedule again
      if (loadingTimeoutRef.current) return;

      loadingTimeoutRef.current = setTimeout(() => {
        listRef.current?.scrollToIndex({
          index: lastRealIndex,
          animated: true,
          viewPosition: 0,
        });

        // cleanup
        loadingTimeoutRef.current = null;
        isShowingLoadingRef.current = false;

        // unlock shortly after we start scrolling back
        setTimeout(() => {
          bounceBackLockRef.current = false;
        }, 250);
      }, LOADING_STICK_MS);

      if (!auth && !pushedModalRef.current) {
        pushedModalRef.current = true;
        router.push("/login-modal");
        pushedModalRef.current = false;
      }

      return;
    }

    const v = viewableItems?.find((x) => x.isViewable);
    if (!v) return;

    if (v.index != null && v.index <= lastRealIndex) {
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
              offset: SCREEN_HEIGHT * fakeData.length,
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
          const oneStepTarget = clamp(rawTarget, current - 1, current + 1);

          scrollToIndexAnimated(oneStepTarget);
        }}
        onMomentumScrollEnd={(e) => {
          if (isShowingLoadingRef.current) return;

          const y = e.nativeEvent.contentOffset.y;
          const landed = clamp(Math.round(y / SCREEN_HEIGHT), 0, maxIndex);

          const current = currentIndexRef.current;
          const oneStepLanded = clamp(landed, current - 1, current + 1);

          if (snappingToIndexRef.current != null) {
            const target = snappingToIndexRef.current;
            const targetOffset = target * SCREEN_HEIGHT;
            const dist = Math.abs(y - targetOffset);

            currentIndexRef.current = target;

            if (dist < 2) {
              listRef.current?.scrollToOffset({
                offset: targetOffset,
                animated: false,
              });
            }

            snappingToIndexRef.current = null;
            return;
          }

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
