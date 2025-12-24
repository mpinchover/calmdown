import React, { useMemo, useRef, useState } from "react";
import {
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

const dataWithLoading = [
  ...fakeData,
  {
    id: "loading",
    type: "loading",
  },
];

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const LOADING_HEIGHT = Math.round(SCREEN_HEIGHT * 0.3);

export default function MainFeed() {
  const listRef = useRef(null);
  const maxIndex = useMemo(() => dataWithLoading.length - 1, []);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [lastRealIndex, setLastRealIndex] = useState(fakeData.length - 1);
  const [loadingIndex, setLoadingIndex] = useState(dataWithLoading.length - 1);
  const bounceBackLockRef = useRef(false);
  const loadingTimeoutRef = useRef(null);
  const isShowingLoadingRef = useRef(false);
  const LOADING_STICK_MS = 300;

  const currentIndexRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const snappingToIndexRef = useRef(null); // when we trigger an animated snap

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(v, hi));

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

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

    if (Math.abs(delta) >= SCREEN_HEIGHT / 2) {
      return delta > 0 ? current + 1 : current - 1;
    }
    return current;
  };

  // Consider an item "active" when >= 80% visible
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 10,
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    console.log("ON VIEWABLE HAS CHANGED");
    const loading = viewableItems?.find(
      (x) => x.isViewable && x.item?.type === "loading"
    );

    if (loading) {
      console.log("LOADING SCREEN DETECTED");

      if (bounceBackLockRef.current) return;

      bounceBackLockRef.current = true;
      isShowingLoadingRef.current = true;

      // If already scheduled, don't schedule again
      if (loadingTimeoutRef.current) return;

      loadingTimeoutRef.current = setTimeout(() => {
        console.log("SCROLLING BACK AFTER DELAY");

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

      return;
    }

    const v = viewableItems?.find((x) => x.isViewable);
    if (!v) {
      return;
    }

    console.log("V IS: ", v);

    // if (v.item?.type === "loading") {
    //   console.log("LOADING SCREEN");
    //   if (bounceBackLockRef.current) {
    //     return;
    //   }

    //   bounceBackLockRef.current = true;
    //   // Start fetch here (or set state that triggers fetch)
    //   // fetchMore();

    //   requestAnimationFrame(() => {
    //     console.log("SCROLLING BACK");
    //     listRef.current?.scrollToIndex({
    //       index: lastRealIndex,
    //       animated: true,
    //       viewPosition: 0,
    //     });
    //     // release lock shortly after
    //     setTimeout(() => {
    //       bounceBackLockRef.current = false;
    //     }, 250);
    //   });

    //   return;
    // }

    // Normal active card
    if (v.index != null && v.index <= lastRealIndex) {
      setActiveIndex(v.index);
    }
  }).current;

  const viewabilityConfigCallbackPairs = useRef([
    { viewabilityConfig, onViewableItemsChanged },
  ]).current;

  const renderItem = ({ item, index }) => {
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
        toggleMute={toggleMute}
        isMuted={isMuted}
        // pass isMuted/toggleMute too if you have them
      />
    );
  };

  return (
    <View style={styles.container}>
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
            // Offset is full pages for all real items
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
        // onViewableItemsChanged={onViewableItemsChanged}
        onScrollBeginDrag={(e) => {
          dragStartOffsetRef.current = e.nativeEvent.contentOffset.y;
          snappingToIndexRef.current = null;
        }}
        onScrollEndDrag={(e) => {
          if (isShowingLoadingRef.current) return;

          const endY = e.nativeEvent.contentOffset.y;

          // Pick a target using halfway rule, then clamp to +/-1 max
          const current = currentIndexRef.current;
          const rawTarget = decideTargetFromDrag(endY);
          const oneStepTarget = clamp(rawTarget, current - 1, current + 1);

          scrollToIndexAnimated(oneStepTarget);
        }}
        onMomentumScrollEnd={(e) => {
          if (isShowingLoadingRef.current) return;
          const y = e.nativeEvent.contentOffset.y;

          // Where did RN actually land?
          const landed = clamp(Math.round(y / SCREEN_HEIGHT), 0, maxIndex);

          // Enforce max +/-1 (prevents multi-card flings)
          const current = currentIndexRef.current;
          const oneStepLanded = clamp(landed, current - 1, current + 1);

          // If we initiated an animated snap, trust it.
          // Only do a non-animated "micro-correction" if we're already extremely close
          // (prevents the no-animation feel).
          if (snappingToIndexRef.current != null) {
            const target = snappingToIndexRef.current;

            const targetOffset = target * SCREEN_HEIGHT;
            const dist = Math.abs(y - targetOffset);

            currentIndexRef.current = target;

            // Only hard-correct if we're within a few pixels (fractional offset issue)
            if (dist < 2) {
              listRef.current?.scrollToOffset({
                offset: targetOffset,
                animated: false,
              });
            }

            snappingToIndexRef.current = null;
            return;
          }

          // If user somehow landed elsewhere, animate to the allowed page
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
});
