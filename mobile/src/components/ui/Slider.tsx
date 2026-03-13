import { useRef, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import type { LayoutChangeEvent, GestureResponderEvent } from 'react-native';

interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function Slider({
  value,
  onValueChange,
  min = 1,
  max = 10,
}: SliderProps): React.ReactElement {
  const trackWidth = useRef(0);
  const trackX = useRef(0);

  function handleLayout(e: LayoutChangeEvent): void {
    trackWidth.current = e.nativeEvent.layout.width;
    trackX.current = e.nativeEvent.layout.x;
  }

  const clampToStep = useCallback(
    (pageX: number): number => {
      const x = pageX - trackX.current;
      const ratio = Math.max(0, Math.min(1, x / trackWidth.current));
      return Math.round(ratio * (max - min) + min);
    },
    [min, max],
  );

  function handlePress(e: GestureResponderEvent): void {
    onValueChange(clampToStep(e.nativeEvent.locationX));
  }

  function handleMove(e: GestureResponderEvent): void {
    onValueChange(clampToStep(e.nativeEvent.locationX));
  }

  const progress = ((value - min) / (max - min)) * 100;

  return (
    <View
      onLayout={handleLayout}
      onStartShouldSetResponderCapture={() => true}
      onMoveShouldSetResponderCapture={() => true}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={handlePress}
      onResponderMove={handleMove}
      className="h-10 justify-center"
    >
      {/* Track */}
      <View className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
        {/* Fill */}
        <View
          className="h-2 rounded-full bg-emerald-500"
          style={{ width: `${progress}%` }}
        />
      </View>
      {/* Thumb */}
      <View
        className="absolute w-6 h-6 rounded-full bg-emerald-500 border-2 border-white shadow-md"
        style={{ left: `${progress}%`, marginLeft: -12 }}
        pointerEvents="none"
      />
      {/* Step indicators */}
      <View className="flex-row justify-between mt-1 px-0.5">
        {Array.from({ length: max - min + 1 }, (_, i) => (
          <Text
            key={i + min}
            className="text-[10px] text-gray-400 dark:text-gray-500 w-4 text-center"
          >
            {i + min}
          </Text>
        ))}
      </View>
    </View>
  );
}
