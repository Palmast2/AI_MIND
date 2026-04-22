// EyeClosed.tsx
import Svg, { Path } from 'react-native-svg';

export function PauseIcon({ size = 24, color = 'white' }) {
  return (
    <Svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      class="icon icon-tabler icons-tabler-filled icon-tabler-player-pause">
      <Path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <Path d="M9 4h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2z" />
      <Path d="M17 4h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2z" />
    </Svg>
  );
}
