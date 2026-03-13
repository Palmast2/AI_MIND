// EyeClosed.tsx
import Svg, { Path } from 'react-native-svg';

export function CreateUserIcon({ size = 24, color = 'white' }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      className="icon icon-tabler icons-tabler-outline icon-tabler-user-plus">
      <Path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <Path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" />
      <Path d="M16 19h6" />
      <Path d="M19 16v6" />
      <Path d="M6 21v-2a4 4 0 0 1 4 -4h4" />
    </Svg>
  );
}
