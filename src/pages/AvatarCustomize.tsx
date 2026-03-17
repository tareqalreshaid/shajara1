import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { client, getOrCreateUserProfile } from '@/lib/api';
import AnimalAvatar, {
  ANIMAL_INFO,
  ANIMAL_EMOJIS,
  ANIMAL_TYPES,
  COLOR_OPTIONS,
  ACCESSORY_OPTIONS,
  type AnimalType,
  type AvatarColor,
  type AvatarAccessory,
  type AvatarAnimation,
} from '@/components/AnimalAvatar';
import { ArrowLeft, Save, Palette, Crown, Sparkles, PawPrint } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AvatarCustomize() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [animal, setAnimal] = useState<AnimalType>('fox');
  const [color, setColor] = useState<AvatarColor>('default');
  const [accessory, setAccessory] = useState<AvatarAccessory>('none');
  const [previewAnim, setPreviewAnim] = useState<AvatarAnimation>('idle');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
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
          setAnimal(profile.avatar_animal as AnimalType);
        } else {
          navigate('/avatar-select');
          return;
        }
        if (profile.avatar_color) setColor(profile.avatar_color as AvatarColor);
        if (profile.avatar_accessory) setAccessory(profile.avatar_accessory as AvatarAccessory);
      } catch {
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate]);

  const handleSave = async () => {
    if (!profileId) return;
    setSaving(true);
    try {
      await client.entities.user_profiles.update({
        id: profileId,
        data: {
          avatar_animal: animal,
          avatar_color: color,
          avatar_accessory: accessory,
        },
      });
      toast({
        title: 'Avatar saved! ✨',
        description: 'Your guardian looks amazing!',
      });
      navigate('/map');
    } catch (error) {
      console.error('Error saving avatar:', error);
      toast({
        title: 'Error',
        description: 'Failed to save avatar',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const playAnimation = (anim: AvatarAnimation) => {
    setPreviewAnim(anim);
    setTimeout(() => setPreviewAnim('idle'), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen theme-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 theme-spinner" />
      </div>
    );
  }

  const info = ANIMAL_INFO[animal];

  return (
    <div className="min-h-screen theme-bg pb-24 transition-colors duration-300">
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
                <Sparkles className="w-5 h-5" /> Customize {info.name}
              </h1>
              <p className="text-white/70 text-xs">Make your guardian unique!</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Live Preview */}
        <div className="bg-white rounded-3xl border-2 shadow-xl p-6 mb-6 text-center" style={{ borderColor: 'var(--theme-card-border)' }}>
          <div className="relative inline-block mb-4">
            <div
              className="w-40 h-40 rounded-full flex items-center justify-center mx-auto"
              style={{
                background: `radial-gradient(circle, var(--theme-accent-50), var(--theme-accent-100))`,
              }}
            >
              <AnimalAvatar
                config={{ animal, color, accessory }}
                size={130}
                animation={previewAnim}
              />
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-900">{info.emoji} {info.name}</h2>
          <p className="text-sm font-medium" style={{ color: 'var(--theme-accent-700)' }}>{info.trait}</p>

          {/* Animation Buttons */}
          <div className="flex justify-center gap-2 mt-4">
            {(['wave', 'jump', 'water'] as AvatarAnimation[]).map((anim) => (
              <button
                key={anim}
                onClick={() => playAnimation(anim)}
                className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all hover:scale-105"
                style={{
                  borderColor: 'var(--theme-accent-200)',
                  color: 'var(--theme-accent-700)',
                  backgroundColor: 'var(--theme-accent-50)',
                }}
              >
                {anim === 'wave' ? '👋 Wave' : anim === 'jump' ? '🦘 Jump' : '💧 Water'}
              </button>
            ))}
          </div>
        </div>

        {/* Animal Quick Switch */}
        <div className="bg-white rounded-2xl border shadow-sm p-5 mb-4" style={{ borderColor: 'var(--theme-card-border)' }}>
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <PawPrint className="w-4 h-4" style={{ color: 'var(--theme-button-bg)' }} />
            Animal
          </h3>
          <div className="flex flex-wrap gap-2">
            {ANIMAL_TYPES.map((a) => (
              <button
                key={a}
                onClick={() => setAnimal(a)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 transition-all text-sm"
                style={{
                  borderColor: animal === a ? 'var(--theme-button-bg)' : '#e5e7eb',
                  backgroundColor: animal === a ? 'var(--theme-accent-50)' : '#ffffff',
                }}
              >
                <span className="text-lg">{ANIMAL_EMOJIS[a]}</span>
                <span className="font-medium text-gray-700">{ANIMAL_INFO[a].name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Color Options */}
        <div className="bg-white rounded-2xl border shadow-sm p-5 mb-4" style={{ borderColor: 'var(--theme-card-border)' }}>
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Palette className="w-4 h-4" style={{ color: 'var(--theme-button-bg)' }} />
            Color Pattern
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {COLOR_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setColor(opt.id)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all"
                style={{
                  borderColor: color === opt.id ? 'var(--theme-button-bg)' : '#e5e7eb',
                  backgroundColor: color === opt.id ? 'var(--theme-accent-50)' : '#ffffff',
                }}
              >
                <div className={`w-8 h-8 rounded-full ${opt.preview} border border-gray-200`} />
                <span className="text-[10px] font-medium text-gray-700">{opt.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Accessory Options */}
        <div className="bg-white rounded-2xl border shadow-sm p-5 mb-6" style={{ borderColor: 'var(--theme-card-border)' }}>
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Crown className="w-4 h-4" style={{ color: 'var(--theme-button-bg)' }} />
            Accessories
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {ACCESSORY_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setAccessory(opt.id)}
                className="flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left"
                style={{
                  borderColor: accessory === opt.id ? 'var(--theme-button-bg)' : '#e5e7eb',
                  backgroundColor: accessory === opt.id ? 'var(--theme-accent-50)' : '#ffffff',
                }}
              >
                <span className="text-2xl">{opt.emoji}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{opt.name}</p>
                  {opt.id !== 'none' && (
                    <p className="text-[10px] text-gray-500">Emoji accessory</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 rounded-2xl font-bold text-white text-lg transition-all duration-300 disabled:opacity-60 shadow-lg flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(to right, var(--theme-button-bg), var(--theme-highlight))' }}
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save & Go to Map'}
        </button>

        {/* Change Animal Link */}
        <button
          onClick={() => navigate('/avatar-select')}
          className="w-full mt-3 py-3 rounded-xl font-medium text-sm transition-colors border"
          style={{ borderColor: 'var(--theme-accent-200)', color: 'var(--theme-accent-700)' }}
        >
          Choose Different Animal
        </button>
      </div>
    </div>
  );
}