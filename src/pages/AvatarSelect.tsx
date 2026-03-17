import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { client, getOrCreateUserProfile } from '@/lib/api';
import AnimalAvatar, {
  ANIMAL_TYPES,
  ANIMAL_INFO,
  type AnimalType,
} from '@/components/AnimalAvatar';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AvatarSelect() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selected, setSelected] = useState<AnimalType | null>(null);
  const [saving, setSaving] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const user = await client.auth.me();
        if (!user?.data) {
          navigate('/');
          return;
        }
        const profile = await getOrCreateUserProfile(user.data.id, user.data.email?.split('@')[0] || 'Eco Warrior');
        setProfileId(profile.id?.toString() || null);
        if (profile.avatar_animal) {
          setSelected(profile.avatar_animal as AnimalType);
        }
      } catch {
        navigate('/');
      }
    };
    init();
  }, [navigate]);

  const handleSelect = async () => {
    if (!selected || !profileId) return;
    setSaving(true);
    try {
      await client.entities.user_profiles.update({
        id: profileId,
        data: {
          avatar_animal: selected,
          avatar_color: 'default',
          avatar_accessory: 'none',
        },
      });
      toast({
        title: `${ANIMAL_INFO[selected].emoji} ${ANIMAL_INFO[selected].name} chosen!`,
        description: 'Now customize your avatar!',
      });
      navigate('/avatar-customize');
    } catch (error) {
      console.error('Error saving avatar:', error);
      toast({
        title: 'Error',
        description: 'Failed to save avatar selection',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen theme-bg pb-24 transition-colors duration-300">
      <style>{`
        @keyframes float-in {
          0% { opacity: 0; transform: translateY(20px) scale(0.9); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .float-in { animation: float-in 0.5s ease-out forwards; }
      `}</style>

      {/* Header */}
      <div
        className="sticky top-0 z-40 text-white shadow-lg"
        style={{ background: 'linear-gradient(to right, var(--theme-button-bg), var(--theme-highlight))' }}
      >
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1 rounded-lg hover:bg-white/20 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> Choose Your Guardian
              </h1>
              <p className="text-white/70 text-xs">Pick an animal to represent you in the Shajara ecosystem</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Animal Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {ANIMAL_TYPES.map((animal, idx) => {
            const info = ANIMAL_INFO[animal];
            const isSelected = selected === animal;

            return (
              <button
                key={animal}
                onClick={() => setSelected(animal)}
                className="float-in relative rounded-2xl p-4 border-2 transition-all duration-300 text-left"
                style={{
                  animationDelay: `${idx * 0.08}s`,
                  opacity: 0,
                  backgroundColor: isSelected ? 'var(--theme-accent-50)' : '#ffffff',
                  borderColor: isSelected ? 'var(--theme-button-bg)' : '#e5e7eb',
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: isSelected ? '0 8px 25px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.05)',
                }}
              >
                {isSelected && (
                  <div
                    className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: 'var(--theme-button-bg)' }}
                  >
                    ✓
                  </div>
                )}

                <div className="flex justify-center mb-3">
                  <AnimalAvatar
                    config={{ animal, color: 'default', accessory: 'none' }}
                    size={90}
                    animation={isSelected ? 'jump' : 'idle'}
                  />
                </div>

                <h3 className="font-bold text-gray-900 text-center">{info.emoji} {info.name}</h3>
                <p className="text-xs text-center font-medium mt-0.5" style={{ color: 'var(--theme-accent-700)' }}>
                  {info.trait}
                </p>
                <p className="text-[11px] text-gray-500 text-center mt-1 line-clamp-2">
                  {info.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Continue Button */}
        <button
          onClick={handleSelect}
          disabled={!selected || saving}
          className="w-full py-4 rounded-2xl font-bold text-white text-lg transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
          style={{
            background: selected
              ? 'linear-gradient(to right, var(--theme-button-bg), var(--theme-highlight))'
              : '#d1d5db',
          }}
        >
          {saving ? 'Saving...' : selected ? `Choose ${ANIMAL_INFO[selected].name} →` : 'Select an Animal'}
        </button>
      </div>
    </div>
  );
}