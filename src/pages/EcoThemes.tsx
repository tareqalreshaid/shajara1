import { useNavigate } from 'react-router-dom';
import { useTheme, ThemeName } from '@/contexts/ThemeContext';
import { ArrowLeft, Check, Palette, Leaf, Waves, Sun, Flower2, Mountain } from 'lucide-react';

interface ThemeOption {
  name: ThemeName;
  label: string;
  description: string;
  icon: React.ReactNode;
  colors: string[];
  gradient: string;
}

const themes: ThemeOption[] = [
  {
    name: 'forest',
    label: 'Forest',
    description: 'Lush emerald greens inspired by ancient woodlands',
    icon: <Leaf className="w-6 h-6" />,
    colors: ['#059669', '#10B981', '#34D399', '#6EE7B7', '#A7F3D0'],
    gradient: 'from-emerald-600 to-green-400',
  },
  {
    name: 'ocean',
    label: 'Ocean',
    description: 'Deep blues and cyans from the crystal seas',
    icon: <Waves className="w-6 h-6" />,
    colors: ['#0284C7', '#0EA5E9', '#38BDF8', '#7DD3FC', '#BAE6FD'],
    gradient: 'from-sky-600 to-cyan-400',
  },
  {
    name: 'sunset',
    label: 'Sunset',
    description: 'Warm oranges and reds of a golden horizon',
    icon: <Sun className="w-6 h-6" />,
    colors: ['#EA580C', '#F97316', '#FB923C', '#FDBA74', '#FED7AA'],
    gradient: 'from-orange-600 to-amber-400',
  },
  {
    name: 'lavender',
    label: 'Lavender',
    description: 'Soft purples and violets from blooming fields',
    icon: <Flower2 className="w-6 h-6" />,
    colors: ['#7C3AED', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE'],
    gradient: 'from-violet-600 to-purple-400',
  },
  {
    name: 'earth',
    label: 'Earth',
    description: 'Rich browns and warm tans of natural terrain',
    icon: <Mountain className="w-6 h-6" />,
    colors: ['#92400E', '#B45309', '#D97706', '#F59E0B', '#FCD34D'],
    gradient: 'from-amber-700 to-yellow-500',
  },
];

export default function EcoThemes() {
  const navigate = useNavigate();
  const { theme, setTheme, isLoading } = useTheme();

  return (
    <div className="min-h-screen theme-bg pb-24 transition-colors duration-300">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b theme-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/profile')}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex items-center gap-2">
            <Palette className="w-6 h-6 theme-icon" />
            <h1 className="text-xl font-bold text-gray-900">Eco Themes</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Description */}
        <div className="mb-6 text-center">
          <p className="text-gray-600">
            Choose a theme inspired by nature. Your selection will be applied across the entire app.
          </p>
        </div>

        {/* Theme Grid */}
        <div className="space-y-4">
          {themes.map((t) => {
            const isActive = theme === t.name;
            return (
              <button
                key={t.name}
                onClick={() => setTheme(t.name)}
                disabled={isLoading}
                className={`w-full text-left rounded-2xl border-2 p-5 transition-all duration-300 ${
                  isActive
                    ? 'bg-white shadow-lg scale-[1.02]'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }`}
                style={isActive ? { borderColor: 'var(--theme-button-bg)', boxShadow: `0 10px 25px -5px var(--theme-accent-100)` } : undefined}
              >
                <div className="flex items-start gap-4">
                  {/* Theme Icon */}
                  <div
                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white shrink-0`}
                  >
                    {t.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-bold text-gray-900">{t.label}</h3>
                      {isActive && (
                        <span
                          className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: 'var(--theme-accent-100)', color: 'var(--theme-accent-700)' }}
                        >
                          <Check className="w-3 h-3" />
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-3">{t.description}</p>

                    {/* Color Swatches */}
                    <div className="flex gap-2">
                      {t.colors.map((color, i) => (
                        <div
                          key={i}
                          className="w-8 h-8 rounded-lg shadow-sm border border-black/5"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Info */}
        <div className="mt-8 p-4 rounded-xl border" style={{ backgroundColor: 'var(--theme-accent-50)', borderColor: 'var(--theme-card-border)' }}>
          <p className="text-sm text-center" style={{ color: 'var(--theme-accent-700)' }}>
            🌿 Your theme preference is saved to your profile and synced across devices.
          </p>
        </div>
      </div>
    </div>
  );
}