import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { client, getOrCreateUserProfile, getUserRank, Challenge, UserProfile } from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';
import PointsDisplay from '@/components/PointsDisplay';
import { Trophy, Target, Users, User as UserIcon, Map, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [rank, setRank] = useState<number>(0);
  const [nextChallenge, setNextChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userResponse = await client.auth.me();
      if (userResponse.data) {
        setUser(userResponse.data);
        await loadUserData(userResponse.data.id, userResponse.data.email);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async (userId: string, userEmail: string) => {
    try {
      const userProfile = await getOrCreateUserProfile(userId, userEmail.split('@')[0]);
      setProfile(userProfile);

      try {
        const userRank = await getUserRank(userId);
        setRank(userRank);
      } catch {
        setRank(0);
      }

      try {
        const challengesResponse = await client.entities.challenges.queryAll({
          query: { challenge_type: 'daily' },
          limit: 1,
        });

        if (challengesResponse.data.items.length > 0) {
          setNextChallenge(challengesResponse.data.items[0]);
        }
      } catch {
        // Challenges not available - not critical
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleLogin = async () => {
    try {
      await client.auth.toLogin();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center theme-bg transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 theme-spinner"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen theme-bg flex items-center justify-center p-4 transition-colors duration-300">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border theme-border transition-colors duration-300">
          <img
            src="https://mgx-backend-cdn.metadl.com/generate/images/965188/2026-02-11/a8b05128-dff0-4ed1-a6ed-349beadf87d5.png"
            alt="Shajara"
            className="w-full h-48 object-cover rounded-2xl mb-6"
          />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Shajara 🌱
          </h1>
          <p className="text-gray-500 mb-8">
            Join the environmental sustainability movement and make a difference!
          </p>
          <button
            onClick={handleLogin}
            className="w-full py-3 theme-btn rounded-xl font-semibold transition-colors"
          >
            Get Started
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-bg pb-20 transition-colors duration-300">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Shajara 🌱
          </h1>
          <p className="text-gray-500">Let's make the world greener together!</p>
        </div>

        {/* User Stats Card */}
        {profile && (
          <div className="bg-white rounded-2xl border theme-border p-6 shadow-sm mb-6 transition-colors duration-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Your Progress</h2>
                <StatusBadge points={profile.total_points} />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold" style={{ color: 'var(--theme-button-bg)' }}>#{rank}</div>
                <div className="text-sm text-gray-500">Rank</div>
              </div>
            </div>

            <div className="border-t pt-4 mt-4 theme-border">
              <PointsDisplay points={profile.total_points} size="lg" />
              <div className="mt-3 text-sm text-gray-500">
                <span className="font-semibold">{profile.challenges_completed}</span> challenges completed
              </div>
            </div>
          </div>
        )}

        {/* Next Challenge */}
        {nextChallenge && (
          <div
            className="rounded-2xl p-6 shadow-lg mb-6 text-white"
            style={{ background: `linear-gradient(to bottom right, var(--theme-button-bg), var(--theme-highlight))` }}
          >
            <h3 className="flex items-center gap-2 mb-3 text-lg font-semibold text-white">
              <Target className="w-5 h-5" />
              Coming Up Next Challenge
            </h3>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <h4 className="font-bold text-lg mb-2">{nextChallenge.title}</h4>
              <p className="text-white/80 text-sm mb-3">{nextChallenge.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-amber-300 font-bold">⭐ {nextChallenge.points} points</span>
                <button
                  onClick={() => navigate('/challenges')}
                  className="px-4 py-2 bg-white rounded-lg font-medium text-sm hover:bg-white/90 transition-colors flex items-center gap-2"
                  style={{ color: 'var(--theme-button-bg)' }}
                >
                  View Challenge
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/challenges')}
            className="bg-white rounded-2xl border theme-border p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 text-left"
          >
            <Target className="w-8 h-8 theme-icon mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">View Challenges</h3>
            <p className="text-sm text-gray-500">Complete eco tasks</p>
          </button>

          <button
            onClick={() => navigate('/social')}
            className="bg-white rounded-2xl border theme-border p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 text-left"
          >
            <Users className="w-8 h-8 theme-icon mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Social Feed</h3>
            <p className="text-sm text-gray-500">Share your journey</p>
          </button>

          <button
            onClick={() => navigate('/challenges')}
            className="bg-white rounded-2xl border theme-border p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 text-left"
          >
            <Trophy className="w-8 h-8 theme-icon mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Leaderboard</h3>
            <p className="text-sm text-gray-500">See top eco warriors</p>
          </button>

          <button
            onClick={() => navigate('/profile')}
            className="bg-white rounded-2xl border theme-border p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 text-left"
          >
            <UserIcon className="w-8 h-8 theme-icon mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Your Profile</h3>
            <p className="text-sm text-gray-500">View achievements</p>
          </button>

          {/* Progress Map - New Feature */}
          <button
            onClick={() => navigate('/map')}
            className="relative col-span-2 rounded-2xl border-2 p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 text-left theme-bg-light"
            style={{ borderColor: 'var(--theme-accent-200)' }}
          >
            <span
              className="absolute top-3 right-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-sm animate-pulse"
              style={{ backgroundColor: 'var(--theme-button-bg)' }}
            >
              ✨ New Feature
            </span>
            <div className="flex items-center gap-4">
              <div
                className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'var(--theme-accent-100)' }}
              >
                <Map className="w-8 h-8 theme-icon" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Progress Map</h3>
                <p className="text-sm text-gray-500">Your eco journey — explore milestones, zones & rewards on a pixel-art map!</p>
              </div>
              <ArrowRight className="w-5 h-5 flex-shrink-0 ml-auto" style={{ color: 'var(--theme-accent-200)' }} />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}