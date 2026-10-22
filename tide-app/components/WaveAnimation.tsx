
import { useEffect, useRef } from "react";
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Dimensions,
} from "react-native";
import Svg, { Path } from "react-native-svg";

const { width: W } = Dimensions.get("window");

const H = 220;
const MAX_LEVEL = 3;
const WAVE_HEIGHT = 30;
const SVG_HEIGHT = H + 40;
const TICKS = [3, 2.5, 2, 1.5, 1, 0.5, 0];

function createWave(amplitude: number) {
  return `
    M 0 ${WAVE_HEIGHT}
    Q ${W / 4} ${WAVE_HEIGHT - amplitude}
      ${W / 2} ${WAVE_HEIGHT}
    T ${W} ${WAVE_HEIGHT}
    T ${W * 1.5} ${WAVE_HEIGHT}
    T ${W * 2} ${WAVE_HEIGHT}
    V ${SVG_HEIGHT}
    H 0
    Z
  `;
}

export default function WaveAnimation({
  level,
}: {
  level: number;
}) {
  const vertical = useRef(new Animated.Value(0)).current;
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const safeLevel = Math.max(0, Math.min(MAX_LEVEL, level));

    Animated.timing(vertical, {
      toValue: safeLevel,
      duration: 1500,
      useNativeDriver: true,
    }).start();
  }, [level, vertical]);

  useEffect(() => {
    const animation1 = Animated.loop(
      Animated.timing(wave1, {
        toValue: 1,
        duration: 3500,
        useNativeDriver: true,
      })
    );

    const animation2 = Animated.loop(
      Animated.timing(wave2, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: true,
      })
    );

    animation1.start();
    animation2.start();

    return () => {
      animation1.stop();
      animation2.stop();
    };
  }, [wave1, wave2]);

  const translateY = vertical.interpolate({
    inputRange: [0, MAX_LEVEL],
    outputRange: [H - WAVE_HEIGHT, -WAVE_HEIGHT],
    extrapolate: "clamp",
  });

  const translateX1 = wave1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -W],
  });

  const translateX2 = wave2.interpolate({
    inputRange: [0, 1],
    outputRange: [-W, 0],
  });

  return (
    <View style={styles.container}>
      {/* Fixed meter scale */}
      <View style={styles.scale}>
        {TICKS.map((meter) => (
          <View
            key={meter}
            style={[
              styles.tick,
              {
                top: ((MAX_LEVEL - meter) / MAX_LEVEL) * (H - 18),
              },
            ]}
          >
            <Text style={styles.label}>
              {meter.toFixed(1)} m
            </Text>
            <View style={styles.tickLine} />
          </View>
        ))}
      </View>

      {/* Water and moving wave layers */}
      <View style={styles.waterBox}>
        <Animated.View
          style={[
            styles.waveLayer,
            {
              transform: [
                { translateY },
                { translateX: translateX1 },
              ],
            },
          ]}
        >
          <Svg width={W * 2} height={SVG_HEIGHT}>
            <Path d={createWave(14)} fill="#1d6e63" />
          </Svg>
        </Animated.View>

        <Animated.View
          style={[
            styles.waveLayer,
            {
              transform: [
                { translateY },
                { translateX: translateX2 },
              ],
            },
          ]}
        >
          <Svg width={W * 2} height={SVG_HEIGHT}>
            <Path
              d={createWave(8)}
              fill="#42a89a"
              opacity={0.65}
            />
          </Svg>
        </Animated.View>

        <View style={styles.reading}>
          <Text style={styles.readingText}>
            {level.toFixed(2)} m
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: H,
    marginHorizontal: 16,
    flexDirection: "row",
  },
  scale: {
    width: 55,
    height: H,
    position: "relative",
  },
  tick: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  label: {
    fontSize: 11,
    color: "#47615d",
    marginRight: 4,
  },
  tickLine: {
    width: 7,
    height: 1,
    backgroundColor: "#8da7a1",
  },
  waterBox: {
    flex: 1,
    height: H,
    overflow: "hidden",
    backgroundColor: "#e6efed",
    borderRadius: 16,
    position: "relative",
  },
  waveLayer: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  reading: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#ffffffdd",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  readingText: {
    color: "#1d6e63",
    fontSize: 14,
    fontWeight: "bold",
  },
});
