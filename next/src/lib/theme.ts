/**
 * Theme Configuration
 * Loads color variables from environment and applies them to the DOM
 */

interface ThemeColors {
  light: Record<string, string>;
  dark: Record<string, string>;
  semantic: Record<string, string>;
}

// Static mapping of env variables for Next.js compatibility
// (Next.js requires NEXT_PUBLIC_ vars to be statically known at build time)
const nextEnvVars: Record<string, string | undefined> = {
  NEXT_PUBLIC_COLOR_BACKGROUND_LIGHT: process.env.NEXT_PUBLIC_COLOR_BACKGROUND_LIGHT,
  NEXT_PUBLIC_COLOR_FOREGROUND_LIGHT: process.env.NEXT_PUBLIC_COLOR_FOREGROUND_LIGHT,
  NEXT_PUBLIC_COLOR_CARD_LIGHT: process.env.NEXT_PUBLIC_COLOR_CARD_LIGHT,
  NEXT_PUBLIC_COLOR_PRIMARY_LIGHT: process.env.NEXT_PUBLIC_COLOR_PRIMARY_LIGHT,
  NEXT_PUBLIC_COLOR_PRIMARY_FOREGROUND_LIGHT: process.env.NEXT_PUBLIC_COLOR_PRIMARY_FOREGROUND_LIGHT,
  NEXT_PUBLIC_COLOR_SECONDARY_LIGHT: process.env.NEXT_PUBLIC_COLOR_SECONDARY_LIGHT,
  NEXT_PUBLIC_COLOR_SECONDARY_FOREGROUND_LIGHT: process.env.NEXT_PUBLIC_COLOR_SECONDARY_FOREGROUND_LIGHT,
  NEXT_PUBLIC_COLOR_MUTED_LIGHT: process.env.NEXT_PUBLIC_COLOR_MUTED_LIGHT,
  NEXT_PUBLIC_COLOR_MUTED_FOREGROUND_LIGHT: process.env.NEXT_PUBLIC_COLOR_MUTED_FOREGROUND_LIGHT,
  NEXT_PUBLIC_COLOR_BORDER_LIGHT: process.env.NEXT_PUBLIC_COLOR_BORDER_LIGHT,
  NEXT_PUBLIC_COLOR_SIDEBAR_BACKGROUND_LIGHT: process.env.NEXT_PUBLIC_COLOR_SIDEBAR_BACKGROUND_LIGHT,
  NEXT_PUBLIC_COLOR_SIDEBAR_FOREGROUND_LIGHT: process.env.NEXT_PUBLIC_COLOR_SIDEBAR_FOREGROUND_LIGHT,
  NEXT_PUBLIC_COLOR_SIDEBAR_PRIMARY_LIGHT: process.env.NEXT_PUBLIC_COLOR_SIDEBAR_PRIMARY_LIGHT,
  NEXT_PUBLIC_COLOR_ACCENT_LIGHT: process.env.NEXT_PUBLIC_COLOR_ACCENT_LIGHT,
  NEXT_PUBLIC_COLOR_BACKGROUND_DARK: process.env.NEXT_PUBLIC_COLOR_BACKGROUND_DARK,
  NEXT_PUBLIC_COLOR_FOREGROUND_DARK: process.env.NEXT_PUBLIC_COLOR_FOREGROUND_DARK,
  NEXT_PUBLIC_COLOR_CARD_DARK: process.env.NEXT_PUBLIC_COLOR_CARD_DARK,
  NEXT_PUBLIC_COLOR_PRIMARY_DARK: process.env.NEXT_PUBLIC_COLOR_PRIMARY_DARK,
  NEXT_PUBLIC_COLOR_PRIMARY_FOREGROUND_DARK: process.env.NEXT_PUBLIC_COLOR_PRIMARY_FOREGROUND_DARK,
  NEXT_PUBLIC_COLOR_SECONDARY_DARK: process.env.NEXT_PUBLIC_COLOR_SECONDARY_DARK,
  NEXT_PUBLIC_COLOR_SECONDARY_FOREGROUND_DARK: process.env.NEXT_PUBLIC_COLOR_SECONDARY_FOREGROUND_DARK,
  NEXT_PUBLIC_COLOR_MUTED_DARK: process.env.NEXT_PUBLIC_COLOR_MUTED_DARK,
  NEXT_PUBLIC_COLOR_MUTED_FOREGROUND_DARK: process.env.NEXT_PUBLIC_COLOR_MUTED_FOREGROUND_DARK,
  NEXT_PUBLIC_COLOR_BORDER_DARK: process.env.NEXT_PUBLIC_COLOR_BORDER_DARK,
  NEXT_PUBLIC_COLOR_SIDEBAR_BACKGROUND_DARK: process.env.NEXT_PUBLIC_COLOR_SIDEBAR_BACKGROUND_DARK,
  NEXT_PUBLIC_COLOR_SIDEBAR_FOREGROUND_DARK: process.env.NEXT_PUBLIC_COLOR_SIDEBAR_FOREGROUND_DARK,
  NEXT_PUBLIC_COLOR_SIDEBAR_PRIMARY_DARK: process.env.NEXT_PUBLIC_COLOR_SIDEBAR_PRIMARY_DARK,
  NEXT_PUBLIC_COLOR_ACCENT_DARK: process.env.NEXT_PUBLIC_COLOR_ACCENT_DARK,
  NEXT_PUBLIC_COLOR_DESTRUCTIVE: process.env.NEXT_PUBLIC_COLOR_DESTRUCTIVE,
  NEXT_PUBLIC_COLOR_SUCCESS: process.env.NEXT_PUBLIC_COLOR_SUCCESS,
  NEXT_PUBLIC_COLOR_WARNING: process.env.NEXT_PUBLIC_COLOR_WARNING,
  NEXT_PUBLIC_COLOR_INFO: process.env.NEXT_PUBLIC_COLOR_INFO,
};

const getEnvVariable = (key: string, fallback: string): string => {
  // Convert VITE_ prefix to NEXT_PUBLIC_ for backwards compatibility
  const nextKey = key.replace(/^VITE_/, "NEXT_PUBLIC_");
  return nextEnvVars[nextKey] || fallback;
};

/**
 * Load color theme from environment variables
 */
export const loadThemeColors = (): ThemeColors => {
  return {
    light: {
      background: getEnvVariable("VITE_COLOR_BACKGROUND_LIGHT", "0 0% 98%"),
      foreground: getEnvVariable("VITE_COLOR_FOREGROUND_LIGHT", "215 25% 12%"),
      card: getEnvVariable("VITE_COLOR_CARD_LIGHT", "0 0% 100%"),
      primary: getEnvVariable("VITE_COLOR_PRIMARY_LIGHT", "217 91% 60%"),
      "primary-foreground": getEnvVariable("VITE_COLOR_PRIMARY_FOREGROUND_LIGHT", "0 0% 100%"),
      secondary: getEnvVariable("VITE_COLOR_SECONDARY_LIGHT", "215 24% 25%"),
      "secondary-foreground": getEnvVariable("VITE_COLOR_SECONDARY_FOREGROUND_LIGHT", "0 0% 100%"),
      muted: getEnvVariable("VITE_COLOR_MUTED_LIGHT", "215 16% 47%"),
      "muted-foreground": getEnvVariable("VITE_COLOR_MUTED_FOREGROUND_LIGHT", "215 13% 34%"),
      border: getEnvVariable("VITE_COLOR_BORDER_LIGHT", "215 20% 92%"),
      "sidebar-background": getEnvVariable("VITE_COLOR_SIDEBAR_BACKGROUND_LIGHT", "215 24% 25%"),
      "sidebar-foreground": getEnvVariable("VITE_COLOR_SIDEBAR_FOREGROUND_LIGHT", "0 0% 95%"),
      "sidebar-primary": getEnvVariable("VITE_COLOR_SIDEBAR_PRIMARY_LIGHT", "217 91% 60%"),
      accent: getEnvVariable("VITE_COLOR_ACCENT_LIGHT", "217 91% 60%"),
    },
    dark: {
      background: getEnvVariable("VITE_COLOR_BACKGROUND_DARK", "215 28% 14%"),
      foreground: getEnvVariable("VITE_COLOR_FOREGROUND_DARK", "0 0% 95%"),
      card: getEnvVariable("VITE_COLOR_CARD_DARK", "215 28% 18%"),
      primary: getEnvVariable("VITE_COLOR_PRIMARY_DARK", "217 91% 60%"),
      "primary-foreground": getEnvVariable("VITE_COLOR_PRIMARY_FOREGROUND_DARK", "215 28% 14%"),
      secondary: getEnvVariable("VITE_COLOR_SECONDARY_DARK", "215 20% 65%"),
      "secondary-foreground": getEnvVariable("VITE_COLOR_SECONDARY_FOREGROUND_DARK", "215 28% 14%"),
      muted: getEnvVariable("VITE_COLOR_MUTED_DARK", "215 18% 40%"),
      "muted-foreground": getEnvVariable("VITE_COLOR_MUTED_FOREGROUND_DARK", "215 15% 58%"),
      border: getEnvVariable("VITE_COLOR_BORDER_DARK", "215 30% 35%"),
      "sidebar-background": getEnvVariable("VITE_COLOR_SIDEBAR_BACKGROUND_DARK", "215 24% 20%"),
      "sidebar-foreground": getEnvVariable("VITE_COLOR_SIDEBAR_FOREGROUND_DARK", "0 0% 90%"),
      "sidebar-primary": getEnvVariable("VITE_COLOR_SIDEBAR_PRIMARY_DARK", "217 91% 60%"),
      accent: getEnvVariable("VITE_COLOR_ACCENT_DARK", "217 91% 60%"),
    },
    semantic: {
      destructive: getEnvVariable("VITE_COLOR_DESTRUCTIVE", "0 84.2% 60.2%"),
      success: getEnvVariable("VITE_COLOR_SUCCESS", "16 100% 38%"),
      warning: getEnvVariable("VITE_COLOR_WARNING", "38 92% 50%"),
      info: getEnvVariable("VITE_COLOR_INFO", "217 91% 60%"),
    },
  };
};

/**
 * Apply theme colors to document CSS variables
 */
export const applyThemeColors = (): void => {
  const colors = loadThemeColors();
  const root = document.documentElement;

  // Apply light mode colors to :root
  Object.entries(colors.light).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });

  // Apply dark mode colors (will be used by .dark class)
  // This requires CSS to be updated to use :root.dark selector
  if (root.classList.contains("dark")) {
    Object.entries(colors.dark).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
  }

  // Apply semantic colors
  Object.entries(colors.semantic).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });
};

/**
 * Listen for dark mode changes and apply appropriate colors
 */
export const initializeThemeListener = (): void => {
  const root = document.documentElement;
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === "class") {
        applyThemeColors();
      }
    });
  });

  observer.observe(root, {
    attributes: true,
    attributeFilter: ["class"],
  });

  // Initial application
  applyThemeColors();
};

/**
 * Get a specific color value
 */
export const getThemeColor = (name: string, isDark: boolean = false): string => {
  const colors = loadThemeColors();
  const themeColors = isDark ? colors.dark : colors.light;
  return themeColors[name as keyof typeof themeColors] || "";
};

/**
 * Export colors for use in TypeScript
 */
export const themeColors = loadThemeColors();

