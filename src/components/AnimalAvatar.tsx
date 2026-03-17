export type AnimalType = 'fox' | 'owl' | 'turtle' | 'deer' | 'panda' | 'bee' | 'frog';
export type AvatarColor = 'default' | 'golden' | 'arctic' | 'forest';
export type AvatarAccessory = 'none' | 'crown' | 'flower-crown' | 'leaf' | 'explorer-hat' | 'glasses';

export interface AvatarConfig {
  animal: AnimalType;
  color: AvatarColor;
  accessory: AvatarAccessory;
}

export const ANIMAL_EMOJIS: Record<AnimalType, string> = {
  fox: '🦊',
  owl: '🦉',
  turtle: '🐢',
  deer: '🦌',
  panda: '🐼',
  bee: '🐝',
  frog: '🐸',
};

export const ANIMAL_INFO: Record<AnimalType, { name: string; emoji: string; trait: string; description: string }> = {
  fox: { name: 'Fox', emoji: '🦊', trait: 'Clever Explorer', description: 'Swift and smart, the fox navigates forests with ease' },
  owl: { name: 'Owl', emoji: '🦉', trait: 'Wise Guardian', description: 'The wise owl watches over the forest at night' },
  turtle: { name: 'Turtle', emoji: '🐢', trait: 'Patient Protector', description: 'Slow and steady, the turtle carries the world on its back' },
  deer: { name: 'Deer', emoji: '🦌', trait: 'Gentle Spirit', description: 'Graceful and kind, the deer brings peace to the meadow' },
  panda: { name: 'Panda', emoji: '🐼', trait: 'Peaceful Warrior', description: 'Strong yet gentle, the panda champions bamboo forests' },
  bee: { name: 'Bee', emoji: '🐝', trait: 'Busy Builder', description: 'Hardworking and vital, the bee pollinates the world' },
  frog: { name: 'Frog', emoji: '🐸', trait: 'Joyful Leaper', description: 'Cheerful and adaptable, the frog thrives in wetlands' },
};

export const ANIMAL_TYPES: AnimalType[] = ['fox', 'owl', 'turtle', 'deer', 'panda', 'bee', 'frog'];

export const ACCESSORY_EMOJIS: Record<AvatarAccessory, string> = {
  none: '✨',
  crown: '👑',
  'flower-crown': '🌸',
  leaf: '🍃',
  'explorer-hat': '🧢',
  glasses: '🕶️',
};

export const COLOR_OPTIONS: { id: AvatarColor; name: string; bg: string; preview: string }[] = [
  { id: 'default', name: 'Natural', bg: 'bg-amber-50', preview: 'bg-amber-100' },
  { id: 'golden', name: 'Golden', bg: 'bg-yellow-50', preview: 'bg-yellow-200' },
  { id: 'arctic', name: 'Arctic', bg: 'bg-blue-50', preview: 'bg-blue-100' },
  { id: 'forest', name: 'Forest', bg: 'bg-green-50', preview: 'bg-green-200' },
];

export const ACCESSORY_OPTIONS: { id: AvatarAccessory; name: string; emoji: string }[] = [
  { id: 'none', name: 'None', emoji: '✨' },
  { id: 'crown', name: 'Crown', emoji: '👑' },
  { id: 'flower-crown', name: 'Flower Crown', emoji: '🌸' },
  { id: 'leaf', name: 'Leaf', emoji: '🍃' },
  { id: 'explorer-hat', name: 'Explorer Hat', emoji: '🧢' },
  { id: 'glasses', name: 'Glasses', emoji: '🕶️' },
];

export type AvatarAnimation = 'idle' | 'wave' | 'jump' | 'water';

/**
 * Returns CSS position styles for each accessory relative to the avatar container.
 * The container is a circle with the animal emoji centered inside.
 * Positions are calculated as percentages of the container size.
 */
function getAccessoryPosition(accessory: AvatarAccessory): React.CSSProperties {
  switch (accessory) {
    case 'crown':
      // Centered on top of the head
      return {
        position: 'absolute',
        top: '-8%',
        left: '50%',
        transform: 'translateX(-50%)',
      };
    case 'flower-crown':
      // Top-right of the head, like tucked behind the ear
      return {
        position: 'absolute',
        top: '-2%',
        right: '2%',
        transform: 'rotate(15deg)',
      };
    case 'leaf':
      // Top-left, sitting on the head
      return {
        position: 'absolute',
        top: '-4%',
        left: '8%',
        transform: 'rotate(-20deg)',
      };
    case 'explorer-hat':
      // Resting on the forehead/top of the head, centered
      return {
        position: 'absolute',
        top: '-6%',
        left: '50%',
        transform: 'translateX(-50%) rotate(-5deg)',
      };
    case 'glasses':
      // Over the eyes area, centered horizontally, lower on the face
      return {
        position: 'absolute',
        top: '38%',
        left: '50%',
        transform: 'translateX(-50%)',
      };
    default:
      return {};
  }
}

interface AnimalAvatarProps {
  config: AvatarConfig;
  size?: number;
  animation?: AvatarAnimation;
  showBadge?: string;
  className?: string;
  onClick?: () => void;
}

export default function AnimalAvatar({
  config,
  size = 80,
  animation = 'idle',
  showBadge,
  className = '',
  onClick,
}: AnimalAvatarProps) {
  const animalEmoji = ANIMAL_EMOJIS[config.animal] || '🦊';
  const accessoryEmoji = config.accessory !== 'none' ? ACCESSORY_EMOJIS[config.accessory] : null;

  const colorBg: Record<AvatarColor, string> = {
    default: '#fef3c7',
    golden: '#fef08a',
    arctic: '#dbeafe',
    forest: '#bbf7d0',
  };

  const fontSize = size * 0.5;
  const accessoryFontSize = size * 0.24;
  const circleSize = size * 0.85;

  // Unique ID for scoped animations
  const animId = `avatar-anim-${size}`;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Inline keyframes for animations */}
      <style>{`
        @keyframes ${animId}-idle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes ${animId}-jump {
          0% { transform: translateY(0) scale(1); }
          15% { transform: translateY(4px) scale(0.95, 1.05); }
          30% { transform: translateY(-${Math.max(size * 0.2, 16)}px) scale(1.05, 0.95); }
          50% { transform: translateY(-${Math.max(size * 0.25, 20)}px) scale(1.08, 0.92); }
          70% { transform: translateY(-${Math.max(size * 0.15, 12)}px) scale(1.03, 0.97); }
          85% { transform: translateY(2px) scale(0.97, 1.03); }
          100% { transform: translateY(0) scale(1); }
        }
        @keyframes ${animId}-wave {
          0% { transform: rotate(0deg); }
          15% { transform: rotate(-18deg); }
          30% { transform: rotate(18deg); }
          45% { transform: rotate(-14deg); }
          60% { transform: rotate(14deg); }
          75% { transform: rotate(-8deg); }
          90% { transform: rotate(8deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes ${animId}-water {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-5px) rotate(-6deg); }
          50% { transform: translateY(0) rotate(0deg); }
          75% { transform: translateY(-5px) rotate(6deg); }
        }
      `}</style>

      {/* Animated wrapper */}
      <div
        style={{
          width: circleSize,
          height: circleSize,
          position: 'relative',
          animation:
            animation === 'jump'
              ? `${animId}-jump 0.8s ease-in-out infinite`
              : animation === 'wave'
                ? `${animId}-wave 0.9s ease-in-out infinite`
                : animation === 'water'
                  ? `${animId}-water 2s ease-in-out infinite`
                  : `${animId}-idle 3s ease-in-out infinite`,
        }}
      >
        {/* Background circle */}
        <div
          style={{
            width: circleSize,
            height: circleSize,
            borderRadius: '50%',
            backgroundColor: colorBg[config.color] || colorBg.default,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'visible',
          }}
        >
          {/* Animal emoji */}
          <span
            style={{ fontSize, lineHeight: 1, userSelect: 'none' }}
            role="img"
            aria-label={ANIMAL_INFO[config.animal]?.name || config.animal}
          >
            {animalEmoji}
          </span>
        </div>

        {/* Accessory emoji — positioned relative to the circle */}
        {accessoryEmoji && (
          <span
            style={{
              ...getAccessoryPosition(config.accessory),
              fontSize: accessoryFontSize,
              lineHeight: 1,
              pointerEvents: 'none',
              userSelect: 'none',
              zIndex: 10,
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))',
            }}
            role="img"
            aria-label={config.accessory}
          >
            {accessoryEmoji}
          </span>
        )}
      </div>

      {/* Badge */}
      {showBadge && (
        <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-yellow-400 text-yellow-900 border border-yellow-500 shadow-sm">
          {showBadge}
        </div>
      )}
    </div>
  );
}