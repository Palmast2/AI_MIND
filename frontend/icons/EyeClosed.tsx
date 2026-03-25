// EyeClosed.tsx
import React from "react";
import Svg, { Path } from "react-native-svg";

export function EyeClosed({ size = 24, color = "white" }) {
  return (
    <Svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
    >
      <Path d="M21 9c-2.4 2.667 -5.4 4 -9 4c-3.6 0 -6.6 -1.333 -9 -4" />
      <Path d="M3 15l2.5 -3.8" />
      <Path d="M21 14.976l-2.492 -3.776" />
      <Path d="M9 17l.5 -4" />
      <Path d="M15 17l-.5 -4" />
    </Svg>
  );
}
