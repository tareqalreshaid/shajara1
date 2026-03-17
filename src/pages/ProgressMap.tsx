import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { client, getOrCreateUserProfile, UserProfile } from '@/lib/api';
import AnimalAvatar, {
  ANIMAL_INFO,
  type AnimalType,
  type AvatarColor,
  type AvatarAccessory,
} from '@/components/AnimalAvatar';
import {
  TreePine, Lock, Trophy, Star, Zap, Sparkles, ArrowLeft, PawPrint,
} from 'lucide-react';

// ─── Data ────────────────────────────────────────────────────────────────────

interface MilestoneData {
  points: number;
  title: string;
  zone: string;
  landmark: string;
  reward: string;
  rewardIcon: string;
}

const MILESTONES: MilestoneData[] = [
  { points: 0, title: 'First Seed', zone: 'Eco Beginner', landmark: 'Seedling Meadow', reward: 'Welcome Badge', rewardIcon: '🌱' },
  { points: 25, title: 'Sprout Guardian', zone: 'Eco Beginner', landmark: 'Flower Field', reward: 'Sprout Badge', rewardIcon: '🌸' },
  { points: 50, title: 'Green Thumb', zone: 'Green Advocate', landmark: 'Forest Edge', reward: 'Green Thumb Badge', rewardIcon: '🌿' },
  { points: 100, title: 'Nature Walker', zone: 'Green Advocate', landmark: 'Woodland Trail', reward: 'Trail Badge', rewardIcon: '🦋' },
  { points: 150, title: 'River Keeper', zone: 'Earth Protector', landmark: 'Crystal River', reward: 'River Badge', rewardIcon: '💧' },
  { points: 200, title: 'Mountain Climber', zone: 'Earth Protector', landmark: 'Eagle Peak', reward: 'Mountain Badge', rewardIcon: '🏔️' },
  { points: 250, title: 'Wind Rider', zone: 'Climate Champion', landmark: 'Wind Valley', reward: 'Wind Badge', rewardIcon: '💨' },
  { points: 300, title: 'Solar Pioneer', zone: 'Climate Champion', landmark: 'Solar Plains', reward: 'Solar Badge', rewardIcon: '☀️' },
  { points: 400, title: 'Ecosystem Builder', zone: 'Planet Guardian', landmark: 'Harmony Grove', reward: 'Ecosystem Badge', rewardIcon: '🌳' },
  { points: 500, title: 'Sustainability Legend', zone: 'Sustainability Legend', landmark: 'Green City', reward: 'Legend Badge', rewardIcon: '🌍' },
];

function getZoneInfo(points: number) {
  if (points >= 400) return { name: 'Sustainability Legend', theme: 'Green cities & future' };
  if (points >= 300) return { name: 'Planet Guardian', theme: 'Lush ecosystems' };
  if (points >= 200) return { name: 'Climate Champion', theme: 'Solar & wind energy' };
  if (points >= 100) return { name: 'Earth Protector', theme: 'Rivers & mountains' };
  if (points >= 25) return { name: 'Green Advocate', theme: 'Trees & wildlife' };
  return { name: 'Eco Beginner', theme: 'Seeds & flowers' };
}

// ─── Pixel Art Components ────────────────────────────────────────────────────

function PixelTree({ size = 'md', variant = 'green' }: { size?: 'sm' | 'md' | 'lg'; variant?: 'green' | 'dark' | 'autumn' }) {
  const sizeMap = { sm: 'w-4 h-6', md: 'w-6 h-8', lg: 'w-8 h-10' };
  const colorMap = { green: 'text-green-500', dark: 'text-green-700', autumn: 'text-orange-500' };
  return <div className={`${sizeMap[size]} ${colorMap[variant]} pixel-bounce`}>🌲</div>;
}

function PixelAnimal({ type }: { type: 'bird' | 'deer' | 'butterfly' }) {
  const emojiMap = { bird: '🐦', deer: '🦌', butterfly: '🦋' };
  return <div className="text-sm pixel-bounce">{emojiMap[type]}</div>;
}

function PixelMountain({ variant = 'snow' }: { variant?: 'snow' | 'green' }) {
  return <div className="text-lg">{variant === 'snow' ? '🏔️' : '⛰️'}</div>;
}

function PixelWater() { return <div className="text-lg animate-sparkle">💧</div>; }
function PixelSolarPanel() { return <div className="text-lg animate-sparkle">☀️</div>; }
function PixelWindTurbine() { return <div className="text-lg pixel-bounce">💨</div>; }
function PixelHouse({ variant = 'eco' }: { variant?: 'eco' | 'city' }) {
  return <div className="text-lg">{variant === 'eco' ? '🏡' : '🏙️'}</div>;
}

// ─── Confetti ────────────────────────────────────────────────────────────────

function ConfettiCelebration({ active }: { active: boolean }) {
  if (!active) return null;
  const pieces = Array.from({ length: 30 }, (_, i) => {
    const left = Math.random() * 100;
    const delay = Math.random() * 2;
    const size = `${Math.random() * 8 + 4}px`;
    const color = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'][Math.floor(Math.random() * 5)];
    return { i, left, delay, size, color };
  });

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map(({ i, left, delay, size, color }) => (
        <div
          key={i}
          className="absolute top-0 animate-confetti-fall"
          style={{
            left: `${left}%`,
            animationDelay: `${delay}s`,
            width: size,
            height: size,
            backgroundColor: color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  );
}

// ─── Zone Background Decorations ─────────────────────────────────────────────

function ZoneDecorations({ zoneIndex, side }: { zoneIndex: number; side: 'left' | 'right' }) {
  const isLeft = side === 'left';

  if (zoneIndex === 0) {
    return (
      <div className={`flex flex-col gap-2 items-center ${isLeft ? 'mr-2' : 'ml-2'}`}>
        <PixelTree size="sm" variant="green" />
        <span className="text-xs">🌸</span>
        <PixelTree size="sm" variant="autumn" />
      </div>
    );
  }
  if (zoneIndex === 1) {
    return (
      <div className={`flex flex-col gap-2 items-center ${isLeft ? 'mr-2' : 'ml-2'}`}>
        <PixelTree size="md" variant="green" />
        <PixelAnimal type="bird" />
        <PixelTree size="md" variant="dark" />
      </div>
    );
  }
  if (zoneIndex === 2) {
    return (
      <div className={`flex flex-col gap-2 items-center ${isLeft ? 'mr-2' : 'ml-2'}`}>
        {isLeft ? <PixelMountain variant="snow" /> : <PixelWater />}
        <PixelAnimal type="deer" />
        <PixelTree size="lg" variant="dark" />
      </div>
    );
  }
  if (zoneIndex === 3) {
    return (
      <div className={`flex flex-col gap-2 items-center ${isLeft ? 'mr-2' : 'ml-2'}`}>
        {isLeft ? <PixelSolarPanel /> : <PixelWindTurbine />}
        <PixelTree size="md" variant="green" />
        {isLeft ? <PixelWindTurbine /> : <PixelSolarPanel />}
      </div>
    );
  }
  if (zoneIndex === 4) {
    return (
      <div className={`flex flex-col gap-2 items-center ${isLeft ? 'mr-2' : 'ml-2'}`}>
        <PixelTree size="lg" variant="green" />
        <PixelAnimal type="butterfly" />
        <PixelTree size="lg" variant="dark" />
        <PixelHouse variant="eco" />
      </div>
    );
  }
  return (
    <div className={`flex flex-col gap-2 items-center ${isLeft ? 'mr-2' : 'ml-2'}`}>
      <PixelHouse variant="city" />
      <PixelTree size="lg" variant="green" />
      <PixelSolarPanel />
      <PixelWindTurbine />
      <PixelHouse variant="city" />
    </div>
  );
}

// ─── Map Node ────────────────────────────────────────────────────────────────

function MapNode({
  milestone,
  isUnlocked,
  isCurrent,
  isNext,
  userPoints,
  userAvatar,
}: {
  milestone: MilestoneData;
  isUnlocked: boolean;
  isCurrent: boolean;
  isNext: boolean;
  userPoints: number;
  userAvatar?: { animal: AnimalType; color: AvatarColor; accessory: AvatarAccessory } | null;
}) {
  const zoneIndex = Math.min(Math.floor(milestone.points / 100), 5);

  return (
    <div className="relative flex items-center gap-3 py-3">
      <div className="w-12 flex-shrink-0 flex justify-end">
        <ZoneDecorations zoneIndex={zoneIndex} side="left" />
      </div>

      <div className="flex flex-col items-center flex-shrink-0">
        <div
          className="w-1 h-6"
          style={{ backgroundColor: isUnlocked ? 'var(--theme-button-bg)' : '#d1d5db' }}
        />

        <div className="relative">
          {isCurrent && (
            <div className="absolute -inset-2 rounded-full animate-ping opacity-30" style={{ backgroundColor: 'var(--theme-highlight)' }} />
          )}

          <div
            className="relative z-10 w-14 h-14 rounded-xl flex items-center justify-center border-2 transition-all duration-300 shadow-lg"
            style={{
              backgroundColor: isCurrent
                ? 'var(--theme-button-bg)'
                : isUnlocked
                  ? 'var(--theme-accent-600)'
                  : '#e5e7eb',
              borderColor: isCurrent
                ? 'var(--theme-highlight)'
                : isUnlocked
                  ? 'var(--theme-accent-200)'
                  : '#d1d5db',
              transform: isCurrent ? 'scale(1.1)' : 'scale(1)',
            }}
          >
            {isCurrent && userAvatar ? (
              <AnimalAvatar
                config={userAvatar}
                size={40}
                animation="jump"
              />
            ) : isCurrent ? (
              <div className="text-xl animate-bounce">🧑‍🌾</div>
            ) : isUnlocked ? (
              <span className="text-xl">{milestone.rewardIcon}</span>
            ) : (
              <Lock className="w-5 h-5 text-gray-400" />
            )}
          </div>

          <div
            className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold z-20 border"
            style={{
              backgroundColor: isUnlocked ? '#facc15' : '#f3f4f6',
              color: isUnlocked ? '#713f12' : '#9ca3af',
              borderColor: isUnlocked ? '#eab308' : '#e5e7eb',
            }}
          >
            {milestone.points}
          </div>
        </div>

        <div
          className="w-1 h-6"
          style={{ backgroundColor: isUnlocked ? 'var(--theme-button-bg)' : '#d1d5db' }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div
          className="rounded-xl p-3 transition-all duration-300 border"
          style={{
            background: isCurrent
              ? `linear-gradient(to right, var(--theme-accent-50), var(--theme-bg-gradient-to))`
              : isUnlocked
                ? 'var(--theme-card-bg)'
                : '#f9fafb',
            borderColor: isCurrent
              ? 'var(--theme-highlight)'
              : isUnlocked
                ? 'var(--theme-accent-200)'
                : '#e5e7eb',
            borderWidth: isCurrent ? '2px' : '1px',
            opacity: isUnlocked ? 1 : 0.6,
          }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-accent-700)' }}>
              {milestone.zone}
            </span>
          </div>
          <h3 className={`text-sm font-bold mb-0.5 ${isUnlocked ? 'theme-text' : 'text-gray-400'}`}>
            {milestone.landmark}
          </h3>

          {isUnlocked && (
            <div className="flex items-center gap-1 mt-1.5">
              <Trophy className="w-3 h-3 text-yellow-500" />
              <span className="text-[11px] theme-text-muted">{milestone.reward}</span>
            </div>
          )}

          {isNext && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-[10px] theme-text-muted mb-1">
                <span>{userPoints} / {milestone.points} pts</span>
                <span>{Math.round((userPoints / milestone.points) * 100)}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${Math.min((userPoints / milestone.points) * 100, 100)}%`,
                    background: `linear-gradient(to right, var(--theme-highlight), var(--theme-button-bg))`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="w-12 flex-shrink-0 flex justify-start">
        <ZoneDecorations zoneIndex={zoneIndex} side="right" />
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ProgressMap() {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<(UserProfile & { avatar_animal?: string; avatar_color?: string; avatar_accessory?: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const currentNodeRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const user = await client.auth.me();
      if (user?.data) {
        const profile = await getOrCreateUserProfile(user.data.id, user.data.name || 'Eco Warrior');
        setUserProfile(profile as UserProfile & { avatar_animal?: string; avatar_color?: string; avatar_accessory?: string });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (currentNodeRef.current) {
      setTimeout(() => {
        currentNodeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }, [userProfile]);

  const userPoints = userProfile?.total_points ?? 0;
  const zoneInfo = getZoneInfo(userPoints);

  const currentMilestoneIndex = MILESTONES.findIndex((m) => m.points > userPoints) - 1;
  const nextMilestoneIndex = currentMilestoneIndex + 1;
  const nextMilestone = MILESTONES[nextMilestoneIndex];
  const progressToNext = nextMilestone
    ? ((userPoints - (MILESTONES[currentMilestoneIndex]?.points ?? 0)) /
        (nextMilestone.points - (MILESTONES[currentMilestoneIndex]?.points ?? 0))) *
      100
    : 100;

  const triggerCelebration = () => {
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);
  };

  // Build user avatar config if they have one selected
  const userAvatar = userProfile?.avatar_animal
    ? {
        animal: userProfile.avatar_animal as AnimalType,
        color: (userProfile.avatar_color as AvatarColor) || 'default',
        accessory: (userProfile.avatar_accessory as AvatarAccessory) || 'none',
      }
    : null;

  if (loading) {
    return (
      <div className="min-h-screen theme-bg flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center animate-pulse" style={{ backgroundColor: 'var(--theme-accent-100)' }}>
            <TreePine className="w-8 h-8" style={{ color: 'var(--theme-button-bg)' }} />
          </div>
          <p className="font-medium" style={{ color: 'var(--theme-accent-700)' }}>Loading your journey...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-bg pb-24 transition-colors duration-300">
      <ConfettiCelebration active={showCelebration} />

      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti-fall {
          animation: confetti-fall 3s ease-in-out forwards;
        }
        @keyframes pixel-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .pixel-bounce {
          animation: pixel-bounce 2s ease-in-out infinite;
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        .animate-sparkle {
          animation: sparkle 1.5s ease-in-out infinite;
        }
        @keyframes avatar-idle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes avatar-wave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-15deg); }
          75% { transform: rotate(15deg); }
        }
        @keyframes avatar-jump {
          0%, 100% { transform: translateY(0) scale(1); }
          30% { transform: translateY(-12px) scale(1.05); }
          50% { transform: translateY(-16px) scale(1.08); }
          70% { transform: translateY(-12px) scale(1.05); }
        }
        @keyframes avatar-water {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-4px) rotate(-5deg); }
          50% { transform: translateY(0) rotate(0deg); }
          75% { transform: translateY(-4px) rotate(5deg); }
        }
        .animate-avatar-idle { animation: avatar-idle 3s ease-in-out infinite; }
        .animate-avatar-wave { animation: avatar-wave 1s ease-in-out infinite; }
        .animate-avatar-jump { animation: avatar-jump 1.2s ease-in-out infinite; }
        .animate-avatar-water { animation: avatar-water 2s ease-in-out infinite; }
      `}</style>

      {/* Header */}
      <div className="sticky top-0 z-40 text-white shadow-lg" style={{ background: `linear-gradient(to right, var(--theme-button-bg), hsl(var(--theme-primary)))` }}>
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-2">
            <Link to="/" className="p-1 rounded-lg hover:bg-white/20 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex-1">
              <h1 className="text-base font-bold tracking-wide flex items-center gap-2">
                🗺️ Eco Journey Map
              </h1>
              <p className="text-white/70 text-xs">{zoneInfo.name} — {zoneInfo.theme}</p>
            </div>
            <button
              onClick={() => navigate(userAvatar ? '/avatar-customize' : '/avatar-select')}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              title="My Guardian Avatar"
            >
              <PawPrint className="w-4 h-4" />
            </button>
            <button
              onClick={triggerCelebration}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              title="Celebrate!"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white/20 rounded-full h-3 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 relative"
              style={{
                width: `${Math.min((userPoints / 500) * 100, 100)}%`,
                background: 'linear-gradient(to right, #fde047, var(--theme-highlight), var(--theme-button-bg))',
              }}
            >
              <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/50 rounded-full animate-pulse" />
            </div>
          </div>
          <div className="flex justify-between items-center mt-1 text-[11px] text-white/70">
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3" /> {userPoints} points
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {nextMilestone ? `Next: ${nextMilestone.title} (${nextMilestone.points}pts)` : 'Max Level!'}
            </span>
          </div>
        </div>
      </div>

      {/* Guardian Avatar Card (small addition) */}
      {userAvatar && (
        <div className="max-w-2xl mx-auto px-4 pt-3">
          <div
            className="flex items-center gap-3 p-3 rounded-xl border shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
            style={{ backgroundColor: 'var(--theme-accent-50)', borderColor: 'var(--theme-card-border)' }}
            onClick={() => navigate('/avatar-customize')}
          >
            <AnimalAvatar config={userAvatar} size={44} animation="idle" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-900">
                {ANIMAL_INFO[userAvatar.animal].emoji} {ANIMAL_INFO[userAvatar.animal].name} Guardian
              </p>
              <p className="text-[10px]" style={{ color: 'var(--theme-accent-700)' }}>
                {ANIMAL_INFO[userAvatar.animal].trait} • Tap to customize
              </p>
            </div>
          </div>
        </div>
      )}

      {!userAvatar && (
        <div className="max-w-2xl mx-auto px-4 pt-3">
          <button
            onClick={() => navigate('/avatar-select')}
            className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed transition-all hover:scale-[1.01]"
            style={{ borderColor: 'var(--theme-button-bg)', backgroundColor: 'var(--theme-accent-50)' }}
          >
            <PawPrint className="w-8 h-8 flex-shrink-0" style={{ color: 'var(--theme-button-bg)' }} />
            <div className="text-left">
              <p className="text-xs font-bold text-gray-900">Choose Your Guardian Animal!</p>
              <p className="text-[10px] text-gray-500">Pick an avatar to represent you on the map</p>
            </div>
          </button>
        </div>
      )}

      {/* Stats cards */}
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl p-2.5 text-center shadow-sm border theme-card transition-colors duration-300">
            <div className="text-lg font-bold" style={{ color: 'var(--theme-accent-700)' }}>{userPoints}</div>
            <div className="text-[10px] theme-text-muted uppercase tracking-wider">Total Points</div>
          </div>
          <div className="rounded-xl p-2.5 text-center shadow-sm border theme-card transition-colors duration-300">
            <div className="text-lg font-bold" style={{ color: 'var(--theme-accent-700)' }}>
              {MILESTONES.filter((m) => m.points <= userPoints).length - 1}
            </div>
            <div className="text-[10px] theme-text-muted uppercase tracking-wider">Milestones</div>
          </div>
          <div className="rounded-xl p-2.5 text-center shadow-sm border theme-card transition-colors duration-300">
            <div className="text-lg font-bold" style={{ color: 'var(--theme-accent-700)' }}>{Math.round(progressToNext)}%</div>
            <div className="text-[10px] theme-text-muted uppercase tracking-wider">Next Goal</div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div ref={scrollContainerRef} className="max-w-2xl mx-auto px-2">
        <div className="relative">
          {[...MILESTONES].reverse().map((milestone, reverseIdx) => {
            const idx = MILESTONES.length - 1 - reverseIdx;
            const isUnlocked = userPoints >= milestone.points;
            const isCurrent = idx === currentMilestoneIndex || (idx === 0 && currentMilestoneIndex < 0);
            const isNext = idx === nextMilestoneIndex;

            return (
              <div
                key={milestone.points}
                ref={isCurrent ? currentNodeRef : undefined}
              >
                {(idx === 0 || MILESTONES[idx].zone !== MILESTONES[idx - 1]?.zone) && (
                  <div className="flex items-center gap-2 px-4 py-2 mt-2">
                    <div className="flex-1 h-px" style={{ backgroundColor: 'var(--theme-accent-200)' }} />
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                      style={{
                        backgroundColor: isUnlocked ? 'var(--theme-accent-100)' : '#f5f5f5',
                        color: isUnlocked ? 'var(--theme-accent-700)' : '#9e9e9e',
                      }}
                    >
                      {milestone.zone}
                    </span>
                    <div className="flex-1 h-px" style={{ backgroundColor: 'var(--theme-accent-200)' }} />
                  </div>
                )}

                <MapNode
                  milestone={milestone}
                  isUnlocked={isUnlocked}
                  isCurrent={isCurrent}
                  isNext={isNext}
                  userPoints={userPoints}
                  userAvatar={userAvatar}
                />
              </div>
            );
          })}

          <div className="text-center py-4">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium"
              style={{ backgroundColor: 'var(--theme-accent-100)', color: 'var(--theme-accent-700)' }}
            >
              🌱 Your eco journey begins here!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}