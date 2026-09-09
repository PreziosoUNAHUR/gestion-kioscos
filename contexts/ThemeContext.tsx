import React, { createContext, useContext, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

type Theme = 'light' | 'dark';

type ThemeContextType = {
  colorScheme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  colorScheme: 'light',
  isDark: false,
  toggleTheme: () => {},
  setTheme: () => {},
});

export const ThemeProviderCustom: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useSystemColorScheme();
  const [override, setOverride] = useState<Theme | null>(null);

  const colorScheme: Theme = override ?? (systemScheme === 'dark' ? 'dark' : 'light');
  const isDark = colorScheme === 'dark';

  const toggleTheme = () => {
    setOverride((prev) => {
      if (prev === 'dark') return 'light';
      if (prev === 'light') return 'dark';
      return systemScheme === 'dark' ? 'light' : 'dark';
    });
  };

  const setTheme = (theme: Theme) => setOverride(theme);

  return (
    <ThemeContext.Provider value={{ colorScheme, isDark, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);