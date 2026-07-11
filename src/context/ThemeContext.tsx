import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  isLight: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("theme") as Theme) || "dark";
  });

  // Keep track of whether this is the initial page load
  const isFirstRender = useRef(true);

  useEffect(() => {
    const root = document.documentElement;

    // Only add the transitioning class if it's a subsequent toggle change
    if (!isFirstRender.current) {
      root.classList.add("theme-transitioning");
    } else {
      isFirstRender.current = false;
    }

    // Toggle the theme class
    root.classList.toggle("light", theme === "light");
    localStorage.setItem("theme", theme);

    // Clean up the transition class after it finishes
    const timer = setTimeout(() => {
      root.classList.remove("theme-transitioning");
    }, 200);

    return () => clearTimeout(timer);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isLight: theme === "light",
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
};