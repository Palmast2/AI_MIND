// EyeClosed.tsx
import Svg, { Path } from 'react-native-svg';

export function PincelIcon({ size = 24, color = 'white' }) {
  return (
    <Svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="icon icon-tabler icons-tabler-outline icon-tabler-brush">
      <Path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <Path d="M3 21v-4a4 4 0 1 1 4 4h-4" />
      <Path d="M21 3a16 16 0 0 0 -12.8 10.2" />
      <Path d="M21 3a16 16 0 0 1 -10.2 12.8" />
      <Path d="M10.6 9a9 9 0 0 1 4.4 4.4" />
    </Svg>
  );
}
