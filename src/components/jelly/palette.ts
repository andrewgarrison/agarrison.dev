type RGBA = [number, number, number, number];

export interface JellyPalette {
  tintTop: RGBA; // straight alpha, 0..1
  tintBottom: RGBA;
  specular: number;
  rim: number;
  glow: number;
  stroke: number;
  shadow: number;
}

type Theme = 'light' | 'dark';

// The dock's glassy dark tint.
export const JELLY_PALETTES: Record<Theme, JellyPalette> = {
  light: {
    tintTop: [0.02, 0.18, 0.32, 0.16],
    tintBottom: [0.02, 0.18, 0.32, 0.06],
    specular: 0.55,
    rim: 0.28,
    glow: 0.22,
    stroke: 0.22,
    shadow: 0.16,
  },
  dark: {
    tintTop: [0, 0, 0, 0.32],
    tintBottom: [0, 0, 0, 0.16],
    specular: 0.32,
    rim: 0.16,
    glow: 0.12,
    stroke: 0.12,
    shadow: 0.3,
  },
};

// A milky, almost solid jelly: switch thumbs and popover surfaces.
export const MILK_PALETTES: Record<Theme, JellyPalette> = {
  light: {
    tintTop: [1, 1, 1, 0.94],
    tintBottom: [0.9, 0.95, 1, 0.86],
    specular: 0.7,
    rim: 0.12,
    glow: 0.1,
    stroke: 0.25,
    shadow: 0.22,
  },
  dark: {
    tintTop: [0.86, 0.9, 0.97, 0.92],
    tintBottom: [0.7, 0.76, 0.86, 0.84],
    specular: 0.5,
    rim: 0.1,
    glow: 0.08,
    stroke: 0.2,
    shadow: 0.4,
  },
};

// Frosted glass for larger surfaces like popovers.
export const GLASS_PALETTES: Record<Theme, JellyPalette> = {
  light: {
    tintTop: [0.05, 0.32, 0.55, 0.42],
    tintBottom: [0.02, 0.22, 0.42, 0.5],
    specular: 0.45,
    rim: 0.3,
    glow: 0.25,
    stroke: 0.3,
    shadow: 0.2,
  },
  dark: {
    tintTop: [0.08, 0.12, 0.22, 0.78],
    tintBottom: [0.04, 0.07, 0.14, 0.84],
    specular: 0.3,
    rim: 0.18,
    glow: 0.14,
    stroke: 0.18,
    shadow: 0.4,
  },
};
