export const THEME_COLORS = ['teal', 'blue', 'indigo', 'purple', 'rose', 'orange', 'green'] as const;
export type ThemeColor = (typeof THEME_COLORS)[number];

interface ThemeDef {
  label: string;
  /** OKLCH hue for primary + neutral surfaces */
  h: number;
  /** Primary chroma — some hues need less to stay in sRGB gamut */
  pC: number;
  /** Sidebar lightness + chroma at this hue */
  sL: number;
  sC: number;
  /** Swatch colour shown in the picker (hex approximation) */
  swatch: string;
}

export const THEMES: Record<ThemeColor, ThemeDef> = {
  teal:   { label: 'Teal',   h: 183, pC: 0.118, sL: 0.26, sC: 0.09, swatch: '#0d9488' },
  blue:   { label: 'Blue',   h: 220, pC: 0.140, sL: 0.26, sC: 0.08, swatch: '#2563eb' },
  indigo: { label: 'Indigo', h: 250, pC: 0.140, sL: 0.26, sC: 0.08, swatch: '#4f46e5' },
  purple: { label: 'Purple', h: 280, pC: 0.130, sL: 0.26, sC: 0.07, swatch: '#7c3aed' },
  rose:   { label: 'Rose',   h: 10,  pC: 0.130, sL: 0.26, sC: 0.07, swatch: '#e11d48' },
  orange: { label: 'Orange', h: 40,  pC: 0.140, sL: 0.28, sC: 0.08, swatch: '#ea580c' },
  green:  { label: 'Green',  h: 145, pC: 0.118, sL: 0.26, sC: 0.09, swatch: '#16a34a' },
};

export function isThemeColor(value: unknown): value is ThemeColor {
  return THEME_COLORS.includes(value as ThemeColor);
}

/** Returns a <style> block that overrides the CSS variables for the given theme. */
export function getThemeCSS(themeColor: string): string {
  const t = THEMES[isThemeColor(themeColor) ? themeColor : 'teal'];
  const { h, pC, sL, sC } = t;
  const primary = `oklch(0.585 ${pC} ${h})`;

  return `
:root {
  --primary: ${primary};
  --ring: ${primary};
  --background: oklch(0.963 0.008 ${h});
  --secondary: oklch(0.945 0.007 ${h});
  --muted: oklch(0.945 0.007 ${h});
  --accent: oklch(0.940 0.009 ${h});
  --border: oklch(0.912 0.008 ${h});
  --input: oklch(0.905 0.008 ${h});
  --sidebar: oklch(${sL} ${sC} ${h});
}
.dark {
  --primary: ${primary};
  --ring: ${primary};
  --background: oklch(0.082 0.008 ${h});
  --card: oklch(0.130 0.010 ${h});
  --popover: oklch(0.155 0.012 ${h});
  --secondary: oklch(0.200 0.012 ${h});
  --muted: oklch(0.200 0.012 ${h});
  --accent: oklch(0.210 0.012 ${h});
  --sidebar: oklch(0.18 0.06 ${h});
}`.trim();
}
