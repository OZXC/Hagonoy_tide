
import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Pressable,
} from "react-native";

import {
  fetchTodayTides,
  fetchTodayTimeline,
  getCurrentPredictedLevel,
  getManilaDate,
  shiftDate,
  type TideExtreme,
} from "./lib/tide";

import TideList from "./components/TideList";
import WaveAnimation from "./components/WaveAnimation";

export default function App() {
  const [selectedDate, setSelectedDate] = useState(getManilaDate);
  const [extremes, setExtremes] = useState<TideExtreme[]>([]);
  const [timeline, setTimeline] = useState<
    Awaited<ReturnType<typeof fetchTodayTimeline>>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [reloadKey, setReloadKey] = useState(0);

  const todayDate = getManilaDate();
  const isToday = selectedDate === todayDate;

  const displayDate = new Date(
    `${selectedDate}T12:00:00+08:00`
  ).toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Update the clock every minute.
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => clearInterval(timer);
  }, []);

  // Fetch tide events and timeline for the selected date.
  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const [events, points] = await Promise.all([
          fetchTodayTides(selectedDate),
          fetchTodayTimeline(selectedDate),
        ]);

        if (active) {
          setExtremes(events);
          setTimeline(points);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load tide predictions."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [selectedDate, reloadKey]);

  const currentLevel = isToday
    ? getCurrentPredictedLevel(timeline, now)
    : null;

  const highTides = extremes.filter(
    (event) => event.type === "HIGH"
  );

  const lowTides = extremes.filter(
    (event) => event.type === "LOW"
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F5F2E9"
      />

      <ScrollView contentContainerStyle={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandContainer}>
            <Text style={styles.brand}>SOLUNE</Text>
            <Text style={styles.tagline}>
              Your tides, at a glance.
            </Text>
          </View>

          <View style={styles.locationBadge}>
            <Text style={styles.locationIcon}>⌖</Text>
            <Text style={styles.locationText}>
              Hagonoy, Bulacan
            </Text>
          </View>
        </View>

        {/* Date selector */}
        <View style={styles.dateSelector}>
          <TouchableOpacity
            style={styles.dateArrow}
            onPress={() =>
              setSelectedDate((date) => shiftDate(date, -1))
            }
            accessibilityLabel="Previous day"
          >
            <Text style={styles.arrowText}>‹</Text>
          </TouchableOpacity>

          <View style={styles.dateInfo}>
            <Text style={styles.dateTitle}>
              {displayDate}
            </Text>

            <Text style={styles.dateSubtitle}>
              {isToday
                ? "Today · Philippine Time"
                : "Tide forecast"}
            </Text>

            {!isToday && (
              <TouchableOpacity
                onPress={() => setSelectedDate(getManilaDate())}
              >
                <Text style={styles.todayButton}>
                  Back to Today
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.dateArrow}
            onPress={() =>
              setSelectedDate((date) => shiftDate(date, 1))
            }
            accessibilityLabel="Next day"
          >
            <Text style={styles.arrowText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Tide overview */}
        <View style={styles.dateRow}>
          <Text style={styles.sectionEyebrow}>
            TIDE OVERVIEW
          </Text>
          <Text style={styles.date}>{displayDate}</Text>
        </View>

        {/* Main water-level card */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.cardEyebrow}>
                WATER LEVEL
              </Text>
              <Text style={styles.heroTitle}>
                Bay conditions
              </Text>
            </View>

            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>API DATA</Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.feedback}>
              <ActivityIndicator
                color="#1D6E63"
                size="large"
              />
              <Text style={styles.feedbackText}>
                Loading tide data...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.feedback}>
              <Text style={styles.errorText}>{error}</Text>

              <Pressable
                style={styles.retryButton}
                onPress={() =>
                  setReloadKey((key) => key + 1)
                }
              >
                <Text style={styles.retryText}>
                  Try again
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              {isToday && currentLevel !== null ? (
                <>
                  <View style={styles.levelRow}>
                    <Text style={styles.levelNumber}>
                      {currentLevel.toFixed(2)}
                    </Text>
                    <Text style={styles.levelUnit}>m</Text>
                  </View>

                  <Text style={styles.levelCaption}>
                    Current predicted level · Philippine time
                  </Text>

                  <View style={styles.waveCard}>
                    <WaveAnimation level={currentLevel} />
                  </View>
                </>
              ) : (
                <View style={styles.feedback}>
                  <Text style={styles.feedbackText}>
                    {isToday
                      ? "Current water-level prediction is unavailable."
                      : "You're viewing another date. Select Today to view the current predicted water level."}
                  </Text>
                </View>
              )}

              <Text style={styles.disclaimer}>
                Prediction from the connected tide station;
                not a live sensor reading.
              </Text>
            </>
          )}
        </View>

        {/* Tide summaries and event list */}
        {!loading && !error && (
          <>
            {extremes.length > 0 ? (
              <>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>
                      HIGH TIDES
                    </Text>
                    <Text style={styles.summaryCount}>
                      {highTides.length}
                    </Text>
                    <Text style={styles.summaryHint}>
                      Selected day's events
                    </Text>
                  </View>

                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>
                      LOW TIDES
                    </Text>
                    <Text style={styles.summaryCount}>
                      {lowTides.length}
                    </Text>
                    <Text style={styles.summaryHint}>
                      Selected day's events
                    </Text>
                  </View>
                </View>

                <View style={styles.tideSection}>
                  <View style={styles.sectionHeader}>
                    <View>
                      <Text style={styles.sectionTitle}>
                        Tide events
                      </Text>
                      <Text style={styles.sectionSubtitle}>
                        Predicted high and low points
                      </Text>
                    </View>

                    <View style={styles.eventBadge}>
                      <Text style={styles.eventBadgeText}>
                        {extremes.length} EVENTS
                      </Text>
                    </View>
                  </View>

                  <View style={styles.listCard}>
                    <TideList extremes={extremes} />
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.feedback}>
                <Text style={styles.feedbackText}>
                  No tide events are available for this date.
                </Text>
              </View>
            )}
          </>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerBrand}>SOLUNE</Text>
          <Text style={styles.footerText}>
            Observe the tides. Plan your day.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F2E9",
  },
  page: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 36,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
  },
  brandContainer: {
    flexShrink: 1,
  },
  brand: {
    fontSize: 27,
    fontWeight: "800",
    letterSpacing: 4,
    color: "#162F2B",
  },
  tagline: {
    fontSize: 12,
    color: "#71817A",
    marginTop: 4,
  },
  locationBadge: {
    backgroundColor: "#E7E9DE",
    borderRadius: 18,
    paddingHorizontal: 11,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexShrink: 1,
  },
  locationIcon: {
    fontSize: 17,
    color: "#1D6E63",
  },
  locationText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#31534B",
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 22,
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E7E5DA",
  },
  dateArrow: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EDF2F5",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: {
    fontSize: 32,
    lineHeight: 36,
    color: "#16232B",
  },
  dateInfo: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 4,
  },
  dateTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#16232B",
    textAlign: "center",
  },
  dateSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: "#4C5B63",
  },
  todayButton: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
    color: "#1D6E63",
  },
  dateRow: {
    marginBottom: 14,
    gap: 5,
  },
  sectionEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
    color: "#71817A",
  },
  date: {
    fontSize: 15,
    color: "#263D37",
    fontWeight: "600",
  },
  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E7E5DA",
    marginBottom: 16,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.7,
    color: "#71817A",
  },
  heroTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#162F2B",
    marginTop: 5,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EAF3EB",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 14,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#3E8661",
  },
  liveText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#3E7355",
    letterSpacing: 0.7,
  },
  levelRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 20,
  },
  levelNumber: {
    fontSize: 46,
    fontWeight: "700",
    color: "#1D6E63",
    letterSpacing: -1.5,
  },
  levelUnit: {
    fontSize: 19,
    fontWeight: "600",
    color: "#66877F",
    marginLeft: 6,
  },
  levelCaption: {
    fontSize: 11,
    color: "#71817A",
    marginBottom: 18,
  },
  waveCard: {
    backgroundColor: "#E6EFED",
    borderRadius: 18,
    paddingVertical: 12,
    overflow: "hidden",
  },
  disclaimer: {
    fontSize: 10,
    lineHeight: 15,
    color: "#78857F",
    marginTop: 12,
  },
  feedback: {
    minHeight: 150,
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    gap: 12,
  },
  feedbackText: {
    fontSize: 13,
    color: "#66766F",
    textAlign: "center",
  },
  errorText: {
    fontSize: 13,
    color: "#B42318",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#1D6E63",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#E8EBE0",
    borderRadius: 18,
    padding: 16,
  },
  summaryLabel: {
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: "800",
    color: "#61766C",
  },
  summaryCount: {
    fontSize: 30,
    fontWeight: "700",
    color: "#1D5147",
    marginTop: 9,
  },
  summaryHint: {
    fontSize: 11,
    color: "#71817A",
    marginTop: 3,
  },
  tideSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: "#162F2B",
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#71817A",
    marginTop: 4,
  },
  eventBadge: {
    backgroundColor: "#E7E9DE",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
  },
  eventBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#31534B",
    letterSpacing: 0.5,
  },
  listCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#E7E5DA",
    overflow: "hidden",
  },
  footer: {
    alignItems: "center",
    paddingTop: 20,
    gap: 5,
  },
  footerBrand: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 3,
    color: "#526D63",
  },
  footerText: {
    fontSize: 11,
    color: "#8A948A",
  },
});
