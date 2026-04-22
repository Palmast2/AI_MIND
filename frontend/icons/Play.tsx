// EyeClosed.tsx
import Svg, { Path } from 'react-native-svg';

export function PlayIcon({ size = 24, color = 'white' }) {
  return (
    <Svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      class="icon icon-tabler icons-tabler-filled icon-tabler-player-play">
      <Path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <Path d="M6 4v16a1 1 0 0 0 1.524 .852l13 -8a1 1 0 0 0 0 -1.704l-13 -8a1 1 0 0 0 -1.524 .852z" />
    </Svg>
  );
}
