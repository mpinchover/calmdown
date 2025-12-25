import { Dimensions, StyleSheet, Text, View } from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const LOADING_HEIGHT = Math.round(SCREEN_HEIGHT * 0.3);

const LoadingCard = () => {
  return (
    <View style={[styles.loadingCard, { height: LOADING_HEIGHT }]}>
      <Text style={styles.loadingText}>Loading…</Text>
    </View>
  );
};

export default LoadingCard;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black", position: "relative" },
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
