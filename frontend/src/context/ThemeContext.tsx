import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (isDark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

// Check if window is defined (so if in the browser or in node.js)
const isBrowser = typeof window !== 'undefined';

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Initialize with a default value that will be consistent for both server and client rendering
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false); // Always start with false for SSR
  const [mounted, setMounted] = useState(false);
  
  // Use useEffect to handle all client-side operations AFTER initial render
  useEffect(() => {
    // Mark component as mounted on client
    setMounted(true);
    
    // Now it's safe to access browser APIs
    try {
      // Check local storage first
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        setIsDarkMode(savedTheme === 'dark');
        return;
      }
      
      // Fall back to system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setIsDarkMode(true);
      }
    } catch (error) {
      console.error('Error accessing browser APIs:', error);
    }
  }, []);
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };
  
  // Set dark mode explicitly
  const setDarkMode = (isDark: boolean) => {
    setIsDarkMode(isDark);
  };
  
  // Update document and localStorage when theme changes
  useEffect(() => {
    if (!mounted) return;
    
    try {
      const root = window.document.documentElement;
      
      if (isDarkMode) {
        root.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        root.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    } catch (error) {
      console.error('Error updating theme:', error);
    }
  }, [isDarkMode, mounted]);
  
  // Listen for system theme changes
  useEffect(() => {
    if (!mounted) return;
    
    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e: MediaQueryListEvent) => {
        // Only apply system theme if user hasn't explicitly set a preference
        if (!localStorage.getItem('theme')) {
          setIsDarkMode(e.matches);
        }
      };
      
      // Modern browsers
      mediaQuery.addEventListener('change', handleChange);
      
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    } catch (error) {
      console.error('Error setting up media query listener:', error);
    }
  }, [mounted]);
  
  // During SSR or before hydration is complete, use a consistent value
  if (!mounted) {
    // Return a version that will match the initial server render
    return (
      <ThemeContext.Provider value={{ isDarkMode: false, toggleDarkMode, setDarkMode }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  // Client-side render after hydration is complete
  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;