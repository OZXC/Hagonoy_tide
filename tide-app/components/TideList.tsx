
import { View, Text, StyleSheet } from "react-native";
import type { TideExtreme } from "../lib/tide";

type Props = {
  extremes: TideExtreme[];
};

export default function TideList({ extremes }: Props) {
  return (
    <View style={styles.container}>
      {extremes.map((event, index) => {
        const isHigh = event.type === "HIGH";

        return (
          <View
            key={`${event.type}-${event.time}-${index}`}
            style={styles.row}
          >
            <Text
              style={[
                styles.type,
                isHigh ? styles.high : styles.low,
              ]}
            >
              {isHigh ? "High tide" : "Low tide"}
            </Text>

            <Text style={styles.time}>
              {event.time}
            </Text>

            <Text style={styles.height}>
              {event.height.toFixed(2)} m
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#dcd8cf",
  },
  type: {
    flex: 1,
    fontWeight: "600",
  },
  high: {
    color: "#1d6e63",
  },
  low: {
    color: "#8a6410",
  },
  time: {
    flex: 1,
    textAlign: "center",
    color: "#16232b",
  },
  height: {
    flex: 1,
    textAlign: "right",
    color: "#4c5b63",
  },
});
