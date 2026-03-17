import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { client } from '@/lib/api';

export type ThemeName = 'forest' | 'ocean' | 'sunset' | 'lavender' | 'earth';

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'forest',
  setTheme: () => {},
  isLoading: false,
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    const saved = localStorage.getItem('eco-theme');
    return (saved as ThemeName) || 'forest';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  // Apply theme class to body
  useEffect(() => {
    const body = document.body;
    // Remove all theme classes
    body.classList.remove('theme-forest', 'theme-ocean', 'theme-sunset', 'theme-lavender', 'theme-earth');
    // Add current theme class
    body.classList.add(`theme-${theme}`);
    // Save to localStorage
    localStorage.setItem('eco-theme', theme);
  }, [theme]);

  // Load theme from user profile on auth
  useEffect(() => {
    const loadThemeFromProfile = async () => {
      try {
        const userResponse = await client.auth.me();
        if (userResponse.data) {
          const profileResponse = await client.entities.user_profiles.query({
            query: {},
            limit: 1,
          });
          if (profileResponse.data.items.length > 0) {
            const userProfile = profileResponse.data.items[0];
            setProfileId(userProfile.id?.toString() || null);
            if (userProfile.theme && ['forest', 'ocean', 'sunset', 'lavender', 'earth'].includes(userProfile.theme)) {
              setThemeState(userProfile.theme as ThemeName);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load theme from profile:', error);
      }
    };

    loadThemeFromProfile();
  }, []);

  const setTheme = async (newTheme: ThemeName) => {
    setThemeState(newTheme);
    setIsLoading(true);

    try {
      if (profileId) {
        await client.entities.user_profiles.update({
          id: profileId,
          data: { theme: newTheme },
        });
      }
    } catch (error) {
      console.error('Failed to save theme to profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}