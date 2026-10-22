import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { fetchTodayTides, type TideExtreme } from "./lib/tide";

export default function App() {
  const [extremes, setExtremes] = useState<TideExtreme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTodayTides()
      .then(setExtremes)
      .catch(() => setError("Could not reach the backend. Is it running?"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hagonoy Tides</Text>
      {extremes.map((e, i) => (
        <Text key={i} style={styles.row}>
          {e.type.toUpperCase()}{"   "}
          {new Date(e.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          {"   "}
          {e.height.toFixed(1)} m
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 80, paddingHorizontal: 24 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 16 },
  row: { fontSize: 16, marginBottom: 8 },
});