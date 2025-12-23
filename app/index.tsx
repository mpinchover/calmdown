import { ResizeMode, Video } from "expo-av";
import React, { useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

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

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const Card = ({ index, url, isActive }) => {
  return (
    <View style={styles.card}>
      <Video
        source={{ uri: url }}
        style={StyleSheet.absoluteFill}
        resizeMode={ResizeMode.COVER}
        isLooping
        shouldPlay={isActive}
        isMuted={!isActive}
        // Optional: keeps playback going when switching cards quickly
        // You can also set useNativeControls={false} (default)
      />
      <View style={styles.overlay}>
        <Text style={styles.text}>Card #{index + 1}</Text>
      </View>
    </View>
  );
};

export default function MainFeed() {
  const listRef = useRef(null);
  const maxIndex = useMemo(() => fakeData.length - 1, []);
  const [activeIndex, setActiveIndex] = useState(0);

  const currentIndexRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const snappingToIndexRef = useRef(null); // when we trigger an animated snap

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(v, hi));

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
    itemVisiblePercentThreshold: 80,
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    const v = viewableItems?.find((x) => x.isViewable);
    if (v?.index != null) setActiveIndex(v.index);
  }).current;

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <FlatList
        ref={listRef}
        data={fakeData}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <Card isActive={index === activeIndex} index={index} url={item.url} />
        )}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        pagingEnabled
        decelerationRate="fast"
        snapToAlignment="start"
        disableIntervalMomentum
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
        onViewableItemsChanged={onViewableItemsChanged}
        onScrollBeginDrag={(e) => {
          dragStartOffsetRef.current = e.nativeEvent.contentOffset.y;
          snappingToIndexRef.current = null;
        }}
        onScrollEndDrag={(e) => {
          const endY = e.nativeEvent.contentOffset.y;

          // Pick a target using halfway rule, then clamp to +/-1 max
          const current = currentIndexRef.current;
          const rawTarget = decideTargetFromDrag(endY);
          const oneStepTarget = clamp(rawTarget, current - 1, current + 1);

          scrollToIndexAnimated(oneStepTarget);
        }}
        onMomentumScrollEnd={(e) => {
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
  container: { flex: 1, backgroundColor: "white" },
  card: {
    height: SCREEN_HEIGHT,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  text: { color: "black", fontSize: 24, fontWeight: "600" },
  overlay: {
    position: "absolute",
    left: 16,
    bottom: 24,
  },
});
