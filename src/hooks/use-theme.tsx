import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemePreset = "light" | "dark" | "amoled" | "iitk" | "cyberpunk";

export const THEME_PRESETS: { id: ThemePreset; label: string; hint: string }[] = [
  { id: "light", label: "Minimal White", hint: "Soft warm light" },
  { id: "dark", label: "Midnight", hint: "Default dark" },
  { id: "amoled", label: "AMOLED", hint: "True black, OLED-friendly" },
  { id: "iitk", label: "IITK Blue", hint: "Deep navy + cyan" },
  { id: "cyberpunk", label: "Cyberpunk", hint: "Neon magenta + cyan" },
];

const ALL_CLASSES = ["dark", "theme-amoled", "theme-iitk", "theme-cyberpunk"];
const STORAGE_KEY = "gf-theme";

function applyTheme(t: ThemePreset) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  ALL_CLASSES.forEach((c) => html.classList.remove(c));
  if (t === "light") return;
  // All non-light themes share the dark base tokens
  html.classList.add("dark");
  if (t === "amoled") html.classList.add("theme-amoled");
  else if (t === "iitk") html.classList.add("theme-iitk");
  else if (t === "cyberpunk") html.classList.add("theme-cyberpunk");
}

const ThemeContext = createContext<{
  theme: ThemePreset;
  setTheme: (t: ThemePreset) => void;
  toggle: () => void;
}>({ theme: "dark", setTheme: () => {}, toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreset>("dark");

  useEffect(() => {
    const stored = (typeof window !== "undefined" && (localStorage.getItem(STORAGE_KEY) as ThemePreset | null)) || "dark";
    const safe = (["light", "dark", "amoled", "iitk", "cyberpunk"] as const).includes(stored as ThemePreset)
      ? (stored as ThemePreset) : "dark";
    setThemeState(safe);
  }, []);

  useEffect(() => {
    applyTheme(theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme: setThemeState,
        toggle: () => setThemeState((t) => (t === "light" ? "dark" : "light")),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
