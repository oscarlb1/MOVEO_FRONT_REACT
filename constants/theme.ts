/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const moveoOrange = '#E67E50';
const moveoBlueDark = '#092C4C';
const moveoBlueLight = '#374B54';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: moveoOrange,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: moveoOrange,
    primary: moveoOrange,
    backgroundGradient: [moveoBlueDark, moveoBlueLight, moveoBlueDark],
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: '#fff',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#fff',
    primary: moveoOrange,
    backgroundGradient: [moveoBlueDark, moveoBlueLight, moveoBlueDark],
  },
};

export const WebColors = {
  dark: {
    background: '#0a0f1a', // Rich Black/Blue (Web Body)
    card: '#1a2332',       // Dark Slate (Web Cards)
    cardBorder: '#2a3441', // Subtle Border
    text: '#ffffff',
    textSecondary: '#9ca3af', // Gray-400
    primary: '#E67E50',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6'
  }
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
