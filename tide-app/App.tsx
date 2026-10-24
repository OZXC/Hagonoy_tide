
import { useEffect, useState } from "react";
import {View,Text,StyleSheet,TouchableOpacity,SafeAreaView,ScrollView,StatusBar,ActivityIndicator,Pressable,} from "react-native";
import Svg, {Circle,Line,Polyline,} from "react-native-svg";
import {fetchTodayTides, fetchTodayTimeline, getCurrentPredictedLevel, getManilaDate, shiftDate, type TideExtreme,} from "./lib/tide";
import TideList from "./components/TideList";
import WaveAnimation from "./components/WaveAnimation";

type ViewMode = "daily" | "weekly";

type WeeklyDay = {
  date: string;
  events: TideExtreme[];
  timeline: Awaited<ReturnType<typeof fetchTodayTimeline>>;
  error: boolean;
};

function formatDate(date: string, options?: Intl.DateTimeFormatOptions) {
  return new Date(`${date}T12:00:00+08:00`).toLocaleDateString(
    "en-PH",
    {
      timeZone: "Asia/Manila",
      ...options,
    }
  );
}

function getDateLabel(date: string) {
  const today = getManilaDate();

  if (date === today) return "Today";
  if (date === shiftDate(today, 1)) return "Tomorrow";

  return formatDate(date, { weekday: "short" });
}

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [selectedDate, setSelectedDate] = useState(getManilaDate);

  const [extremes, setExtremes] = useState<TideExtreme[]>([]);
  const [timeline, setTimeline] = useState<
    Awaited<ReturnType<typeof fetchTodayTimeline>>
  >([]);

  const [weeklyDays, setWeeklyDays] = useState<WeeklyDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [reloadKey, setReloadKey] = useState(0);

  const todayDate = getManilaDate();
  const isToday = selectedDate === todayDate;

  const displayDate = formatDate(selectedDate, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Keep the current-level estimate updated.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  // Load the selected day's tide events and timeline.
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
        if (active) setLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [selectedDate, reloadKey]);

  // Load today plus the next six days for the weekly view.
  useEffect(() => {
    if (viewMode !== "weekly") return;

    let active = true;

    async function loadWeek() {
      setWeeklyLoading(true);

      const dates = Array.from({ length: 7 }, (_, index) =>
        shiftDate(getManilaDate(), index)
      );

      const results = await Promise.all(
  dates.map(async (date): Promise<WeeklyDay> => {
    try {
      const [events, timeline] = await Promise.all([
        fetchTodayTides(date),
        fetchTodayTimeline(date),
      ]);

      return { date, events, timeline, error: false };
    } catch {
      return {
        date,
        events: [],
        timeline: [],
        error: true,
      };
    }
  })
);

      if (active) {
        setWeeklyDays(results);
        setWeeklyLoading(false);
      }
    }

    loadWeek();

    return () => {
      active = false;
    };
  }, [viewMode, reloadKey]);

  const currentLevel = isToday
    ? getCurrentPredictedLevel(timeline, now)
    : null;

  const highTides = extremes.filter((event) => event.type === "HIGH");
  const lowTides = extremes.filter((event) => event.type === "LOW");

  function openDay(date: string) {
    setSelectedDate(date);
    setViewMode("daily");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F2E9" />

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
            <Text style={styles.locationText}>Hagonoy, Bulacan</Text>
          </View>
        </View>

        {/* Daily / weekly toggle */}
        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              viewMode === "daily" && styles.modeButtonActive,
            ]}
            onPress={() => setViewMode("daily")}
          >
            <Text
              style={[
                styles.modeText,
                viewMode === "daily" && styles.modeTextActive,
              ]}
            >
              Daily
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeButton,
              viewMode === "weekly" && styles.modeButtonActive,
            ]}
            onPress={() => setViewMode("weekly")}
          >
            <Text
              style={[
                styles.modeText,
                viewMode === "weekly" && styles.modeTextActive,
              ]}
            >
              7 Days
            </Text>
          </TouchableOpacity>
        </View>

        {viewMode === "daily" ? (
          <>
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
                <Text style={styles.dateTitle}>{displayDate}</Text>
                <Text style={styles.dateSubtitle}>
                  {isToday ? "Today · Philippine Time" : "Tide forecast"}
                </Text>

                {!isToday && (
                  <TouchableOpacity
                    onPress={() => setSelectedDate(getManilaDate())}
                  >
                    <Text style={styles.todayButton}>Back to Today</Text>
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

            <View style={styles.dateRow}>
              <Text style={styles.sectionEyebrow}>TIDE OVERVIEW</Text>
              <Text style={styles.date}>{displayDate}</Text>
            </View>

            {/* Daily water-level card */}
            <View style={styles.heroCard}>
              <View style={styles.heroHeader}>
                <View>
                  <Text style={styles.cardEyebrow}>WATER LEVEL</Text>
                  <Text style={styles.heroTitle}>Bay conditions</Text>
                </View>

                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>API DATA</Text>
                </View>
              </View>

              {loading ? (
                <View style={styles.feedback}>
                  <ActivityIndicator color="#1D6E63" size="large" />
                  <Text style={styles.feedbackText}>
                    Loading tide data...
                  </Text>
                </View>
              ) : error ? (
                <View style={styles.feedback}>
                  <Text style={styles.errorText}>{error}</Text>
                  <Pressable
                    style={styles.retryButton}
                    onPress={() => setReloadKey((key) => key + 1)}
                  >
                    <Text style={styles.retryText}>Try again</Text>
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
                          : "Select Today to see the current predicted water level."}
                      </Text>
                    </View>
                  )}

                  <Text style={styles.disclaimer}>
                    Prediction from the connected tide station; not a live
                    sensor reading.
                  </Text>
                </>
              )}
            </View>

            {!loading && !error && (
              extremes.length > 0 ? (
                <>
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryCard}>
                      <Text style={styles.summaryLabel}>HIGH TIDES</Text>
                      <Text style={styles.summaryCount}>
                        {highTides.length}
                      </Text>
                      <Text style={styles.summaryHint}>
                        Selected day's events
                      </Text>
                    </View>

                    <View style={styles.summaryCard}>
                      <Text style={styles.summaryLabel}>LOW TIDES</Text>
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
                        <Text style={styles.sectionTitle}>Tide events</Text>
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
              )
            )}
          </>
        ) : (
          <>
            {/* Weekly overview */}
            <View style={styles.weekHeading}>
              <Text style={styles.sectionEyebrow}>TIDE FORECAST</Text>
              <Text style={styles.sectionTitle}>The next 7 days</Text>
              <Text style={styles.sectionSubtitle}>
                {formatDate(todayDate, { month: "short", day: "numeric" })}
                {" – "}
                {formatDate(shiftDate(todayDate, 6), {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </Text>
            </View>

            {weeklyLoading ? (
              <View style={styles.feedback}>
                <ActivityIndicator color="#1D6E63" size="large" />
                <Text style={styles.feedbackText}>
                  Loading your weekly forecast...
                </Text>
              </View>
            ) : (
              <View style={styles.weekList}>
                {weeklyDays.map((day) => {
                  const highs = day.events.filter(
                    (event) => event.type === "HIGH"
                  );
                  const lows = day.events.filter(
                    (event) => event.type === "LOW"
                  );

                  const highest = highs.length
                    ? Math.max(...highs.map((event) => event.height))
                    : null;

                  const lowest = lows.length
                    ? Math.min(...lows.map((event) => event.height))
                    : null;

                  return (
                    <Pressable
                      key={day.date}
                      style={styles.weekCard}
                      onPress={() => openDay(day.date)}
                    >
                      <View style={styles.weekCardTop}>
                        <View>
                          <Text style={styles.weekDayName}>
                            {getDateLabel(day.date)}
                          </Text>
                          <Text style={styles.weekDate}>
                            {formatDate(day.date, {
                              month: "short",
                              day: "numeric",
                            })}
                          </Text>
                        </View>

                        <View style={styles.weekArrow}>
                          <Text style={styles.weekArrowText}>›</Text>
                        </View>
                      </View>

                      {day.error ? (
                        <Text style={styles.weekUnavailable}>
                          Forecast unavailable
                        </Text>
                      ) : day.events.length === 0 ? (
                        <Text style={styles.weekUnavailable}>
                          No tide events returned
                        </Text>
                      ) : (
                        <>
                          <View style={styles.weekStats}>
                            <View style={styles.weekStat}>
                              <Text style={styles.weekStatLabel}>
                                HIGH TIDES
                              </Text>
                              <Text style={styles.weekStatValue}>
                                {highs.length}
                              </Text>
                            </View>

                            <View style={styles.weekStat}>
                              <Text style={styles.weekStatLabel}>
                                LOW TIDES
                              </Text>
                              <Text style={styles.weekStatValue}>
                                {lows.length}
                              </Text>
                            </View>

                            <View style={styles.weekStat}>
                              <Text style={styles.weekStatLabel}>
                                HIGHEST
                              </Text>
                              <Text style={styles.weekHeight}>
                                {highest !== null
                                  ? `${highest.toFixed(2)} m`
                                  : "—"}
                              </Text>
                            </View>

                            <View style={styles.weekStat}>
                              <Text style={styles.weekStatLabel}>
                                LOWEST
                              </Text>
                              <Text style={styles.weekHeight}>
                                {lowest !== null
                                  ? `${lowest.toFixed(2)} m`
                                  : "—"}
                              </Text>
                            </View>
                          </View>

                          <Text style={styles.weekTapHint}>
                            Tap to view tide times
                          </Text>
                        </>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}

            <Text style={styles.weekDisclaimer}>
              Heights are predictions from the connected tide station.
              Actual conditions in Hagonoy may differ.
            </Text>
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
    marginBottom: 18,
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
  modeSelector: {
    flexDirection: "row",
    backgroundColor: "#E8EBE0",
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  modeButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    borderRadius: 11,
  },
  modeButtonActive: {
    backgroundColor: "#1D6E63",
  },
  modeText: {
    color: "#526D63",
    fontSize: 13,
    fontWeight: "700",
  },
  modeTextActive: {
    color: "#FFFFFF",
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  weekHeading: {
    marginBottom: 18,
    gap: 5,
  },
  weekList: {
    gap: 12,
  },
  weekCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E7E5DA",
    padding: 16,
  },
  weekCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  weekDayName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#162F2B",
  },
  weekDate: {
    fontSize: 12,
    color: "#71817A",
    marginTop: 3,
  },
  weekArrow: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#E8EBE0",
    alignItems: "center",
    justifyContent: "center",
  },
  weekArrowText: {
    fontSize: 25,
    lineHeight: 28,
    color: "#1D6E63",
  },
  weekStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 16,
  },
  weekStat: {
    width: "50%",
    gap: 4,
  },
  weekStatLabel: {
    fontSize: 9,
    letterSpacing: 0.8,
    fontWeight: "800",
    color: "#71817A",
  },
  weekStatValue: {
    fontSize: 23,
    fontWeight: "700",
    color: "#1D6E63",
  },
  weekHeight: {
    fontSize: 17,
    fontWeight: "700",
    color: "#31534B",
  },
  weekUnavailable: {
    fontSize: 13,
    color: "#8A6550",
    paddingVertical: 8,
  },
  weekTapHint: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#EDF0E8",
    fontSize: 11,
    fontWeight: "600",
    color: "#1D6E63",
  },
  weekDisclaimer: {
    fontSize: 11,
    lineHeight: 17,
    color: "#78857F",
    marginTop: 18,
  },
  footer: {
    alignItems: "center",
    paddingTop: 24,
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
