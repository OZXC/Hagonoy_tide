import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { fetchTodayTides, getCurrentNormalizedHeight, type TideExtreme } from "./lib/tide";
import TideList from "./components/TideList";
import WaveAnimation from "./components/WaveAnimation";

export default function App() {
  const [extremes, setExtremes] = useState<TideExtreme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTodayTides()
      .then(setExtremes)
      .catch(() => setError("Could not load tides. Is the backend running?"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1d6e63" />
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

  const level = getCurrentNormalizedHeight(extremes);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hagonoy Tides</Text>
      <Text style={styles.subtitle}>Hagonoy, Bulacan</Text>
      <WaveAnimation level={level} />
      <TideList extremes={extremes} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#faf9f6", paddingTop: 70 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 26, fontWeight: "700", textAlign: "center", color: "#16232b" },
  subtitle: { textAlign: "center", color: "#4c5b63", marginBottom: 16 },
});