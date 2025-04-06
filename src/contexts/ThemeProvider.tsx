
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";
type TextSize = "default" | "large" | "larger";
type ColorContrast = "default" | "increased" | "high";
type AnimationPreference = "full" | "reduced" | "none";
type UIDensity = "compact" | "comfortable" | "spacious";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  contrast: ColorContrast;
  setContrast: (contrast: ColorContrast) => void;
  animations: AnimationPreference;
  setAnimations: (preference: AnimationPreference) => void;
  density: UIDensity;
  setDensity: (density: UIDensity) => void;
  reducedMotion: boolean;
  setReducedMotion: (reduced: boolean) => void;
  screenReader: boolean;
  setScreenReader: (enabled: boolean) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  textSize: "default",
  setTextSize: () => null,
  contrast: "default",
  setContrast: () => null,
  animations: "full",
  setAnimations: () => null,
  density: "comfortable",
  setDensity: () => null,
  reducedMotion: false,
  setReducedMotion: () => null,
  screenReader: false,
  setScreenReader: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(`${storageKey}-theme`) as Theme) || defaultTheme
  );
  
  const [textSize, setTextSize] = useState<TextSize>(
    () => (localStorage.getItem(`${storageKey}-textSize`) as TextSize) || "default"
  );
  
  const [contrast, setContrast] = useState<ColorContrast>(
    () => (localStorage.getItem(`${storageKey}-contrast`) as ColorContrast) || "default"
  );
  
  const [animations, setAnimations] = useState<AnimationPreference>(
    () => (localStorage.getItem(`${storageKey}-animations`) as AnimationPreference) || "full"
  );
  
  const [density, setDensity] = useState<UIDensity>(
    () => (localStorage.getItem(`${storageKey}-density`) as UIDensity) || "comfortable"
  );
  
  const [reducedMotion, setReducedMotion] = useState<boolean>(
    () => localStorage.getItem(`${storageKey}-reducedMotion`) === "true"
  );
  
  const [screenReader, setScreenReader] = useState<boolean>(
    () => localStorage.getItem(`${storageKey}-screenReader`) === "true"
  );

  // Apply theme class
  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  // Apply text size
  useEffect(() => {
    const root = window.document.documentElement;
    
    root.classList.remove("text-size-default", "text-size-large", "text-size-larger");
    root.classList.add(`text-size-${textSize}`);
  }, [textSize]);

  // Apply contrast
  useEffect(() => {
    const root = window.document.documentElement;
    
    root.classList.remove("contrast-default", "contrast-increased", "contrast-high");
    root.classList.add(`contrast-${contrast}`);
  }, [contrast]);

  // Apply animations preference
  useEffect(() => {
    const root = window.document.documentElement;
    
    root.classList.remove("animations-full", "animations-reduced", "animations-none");
    root.classList.add(`animations-${animations}`);
  }, [animations]);

  // Apply UI density
  useEffect(() => {
    const root = window.document.documentElement;
    
    root.classList.remove("density-compact", "density-comfortable", "density-spacious");
    root.classList.add(`density-${density}`);
  }, [density]);

  // Apply reduced motion preference
  useEffect(() => {
    const root = window.document.documentElement;
    
    if (reducedMotion) {
      root.classList.add("reduced-motion");
    } else {
      root.classList.remove("reduced-motion");
    }
  }, [reducedMotion]);

  // Apply screen reader optimization
  useEffect(() => {
    const root = window.document.documentElement;
    
    if (screenReader) {
      root.classList.add("screen-reader-optimized");
    } else {
      root.classList.remove("screen-reader-optimized");
    }
  }, [screenReader]);

  // Save preferences to localStorage
  const savePreference = (key: string, value: string | boolean) => {
    localStorage.setItem(`${storageKey}-${key}`, String(value));
  };

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      savePreference("theme", theme);
      setTheme(theme);
    },
    textSize,
    setTextSize: (size: TextSize) => {
      savePreference("textSize", size);
      setTextSize(size);
    },
    contrast,
    setContrast: (contrast: ColorContrast) => {
      savePreference("contrast", contrast);
      setContrast(contrast);
    },
    animations,
    setAnimations: (preference: AnimationPreference) => {
      savePreference("animations", preference);
      setAnimations(preference);
    },
    density,
    setDensity: (density: UIDensity) => {
      savePreference("density", density);
      setDensity(density);
    },
    reducedMotion,
    setReducedMotion: (reduced: boolean) => {
      savePreference("reducedMotion", reduced);
      setReducedMotion(reduced);
    },
    screenReader,
    setScreenReader: (enabled: boolean) => {
      savePreference("screenReader", enabled);
      setScreenReader(enabled);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};
