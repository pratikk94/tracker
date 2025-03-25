'use client';

import React, { createContext, useState, useEffect } from 'react';
import { ConfigProvider, theme, App as AntdApp } from 'antd';
import { AuthProvider } from '@/lib/AuthContext';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleTheme: () => {}
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    // Check for stored theme preference
    try {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme === 'dark') {
        setIsDarkMode(true);
        document.documentElement.setAttribute('data-theme', 'dark');
      } else if (!storedTheme) {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDarkMode(prefersDark);
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        localStorage.setItem('theme', prefersDark ? 'dark' : 'light');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
    }
  }, []);
  
  const toggleTheme = () => {
    try {
      const newThemeValue = !isDarkMode;
      setIsDarkMode(newThemeValue);
      document.documentElement.setAttribute('data-theme', newThemeValue ? 'dark' : 'light');
      localStorage.setItem('theme', newThemeValue ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Prevent theme flash during SSR
  if (!mounted) {
    return <>{children}</>;
  }
  
  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      <ConfigProvider
        theme={{
          algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
          token: {
            colorPrimary: '#1890ff',
            borderRadius: 6,
          },
          components: {
            Layout: {
              siderBg: isDarkMode ? '#141414' : '#fff',
              headerBg: isDarkMode ? '#141414' : '#fff',
            },
            Menu: {
              darkItemBg: '#141414',
            },
            Card: {
              colorBgContainer: isDarkMode ? '#1f1f1f' : '#fff',
            },
          },
        }}
      >
        <AntdApp>
          <AuthProvider>{children}</AuthProvider>
        </AntdApp>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
} 