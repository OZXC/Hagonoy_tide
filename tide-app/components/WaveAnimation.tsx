import { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, Dimensions } from "react-native";
import Svg, { Path } from "react-native-svg";

const { width: W } = Dimensions.get("window");
const H = 220;

export default function WaveAnimation({ level }: { level: number }) {
  const vertical = useRef(new Animated.Value(0)).current;
  const horizontal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(vertical, {
      toValue: level,
      duration: 1500,
      useNativeDriver: true,
    }).start();
  }, [level]);

  useEffect(() => {
    Animated.loop(
      Animated.timing(horizontal, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateY = vertical.interpolate({
    inputRange: [0, 1],
    outputRange: [H * 0.6, H * 0.05],
  });
  const translateX = horizontal.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -W],
  });

  const d = `M0 40 Q ${W / 4} 0, ${W / 2} 40 T ${W} 40 T ${W * 1.5} 40 T ${W * 2} 40 V ${H} H 0 Z`;

  return (
    <View style={styles.box}>
      <Animated.View style={{ transform: [{ translateY }, { translateX }] }}>
        <Svg width={W * 2} height={H}>
          <Path d={d} fill="#1d6e63" opacity={0.85} />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    height: H,
    marginHorizontal: 16,
    overflow: "hidden",
    backgroundColor: "#e6efed",
    borderRadius: 16,
  },
});