import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { client, Challenge, getOrCreateUserProfile, UserProfile } from '@/lib/api';
import ChallengeCard from '@/components/ChallengeCard';
import { Trophy, Target, Zap, Crown, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Challenges() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userSubmissions, setUserSubmissions] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'challenges' | 'leaderboard'>('challenges');
  const [challengeFilter, setChallengeFilter] = useState<'all' | 'daily' | 'normal' | 'special' | 'community'>('all');

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadChallenges();
      loadUserSubmissions();
      if (activeTab === 'leaderboard') {
        loadLeaderboard();
      }
    }
  }, [user, activeTab]);

  const checkAuth = async () => {
    try {
      const userResponse = await client.auth.me();
      if (userResponse.data) {
        setUser(userResponse.data);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChallenges = async () => {
    try {
      const response = await client.entities.challenges.queryAll({ sort: '-points', limit: 100 });
      setChallenges(response.data.items);
    } catch (error) {
      console.error('Error loading challenges:', error);
      toast({ title: 'Error', description: 'Failed to load challenges', variant: 'destructive' });
    }
  };

  const loadUserSubmissions = async () => {
    try {
      const response = await client.entities.submissions.query({ limit: 100 });
      setUserSubmissions(response.data.items);
    } catch (error) {
      console.error('Error loading submissions:', error);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const response = await client.entities.user_profiles.queryAll({ sort: '-total_points', limit: 50 });
      setLeaderboard(response.data.items);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      toast({ title: 'Error', description: 'Failed to load leaderboard', variant: 'destructive' });
    }
  };

  const handleLogin = async () => {
    try {
      await client.auth.toLogin();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const getFilteredChallenges = () => {
    if (challengeFilter === 'all') return challenges;
    return challenges.filter((c) => c.challenge_type === challengeFilter);
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="w-6 h-6 text-amber-500" />;
    if (index === 1) return <Trophy className="w-6 h-6 text-gray-400" />;
    if (index === 2) return <Trophy className="w-6 h-6 text-amber-700" />;
    return <span className="theme-text-muted font-bold">#{index + 1}</span>;
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
        <div className="max-w-md w-full rounded-3xl shadow-xl p-8 text-center theme-card border transition-colors duration-300">
          <Target className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--theme-button-bg)' }} />
          <h1 className="text-2xl font-bold theme-text mb-2">Join the Challenge!</h1>
          <p className="theme-text-muted mb-6">Sign in to complete challenges and earn points</p>
          <button onClick={handleLogin} className="w-full py-3 theme-btn rounded-xl font-semibold transition-colors">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-bg pb-20 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold theme-text mb-2">Challenges</h1>
          <p className="theme-text-muted">Complete challenges to earn points and climb the leaderboard</p>
        </div>

        <button
          onClick={() => navigate('/create-activity')}
          className="w-full mb-6 py-4 text-white rounded-2xl font-semibold transition-all shadow-lg flex items-center justify-center gap-2 theme-btn"
        >
          <Plus className="w-5 h-5" />
          Create Your Own Activity
        </button>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('challenges')}
            className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
              activeTab === 'challenges' ? 'text-white' : 'border theme-card theme-text'
            }`}
            style={activeTab === 'challenges' ? { backgroundColor: 'var(--theme-button-bg)' } : {}}
          >
            <Target className="w-5 h-5 inline mr-2" />
            Challenges
          </button>
          <button
            onClick={() => { setActiveTab('leaderboard'); loadLeaderboard(); }}
            className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
              activeTab === 'leaderboard' ? 'text-white' : 'border theme-card theme-text'
            }`}
            style={activeTab === 'leaderboard' ? { backgroundColor: 'var(--theme-button-bg)' } : {}}
          >
            <Trophy className="w-5 h-5 inline mr-2" />
            Leaderboard
          </button>
        </div>

        {activeTab === 'challenges' ? (
          <>
            <div className="flex gap-2 mb-6 overflow-x-auto">
              {([['all', 'All'], ['daily', 'Daily'], ['normal', 'Normal'], ['special', 'Special'], ['community', 'Community']] as const).map(([filter, label]) => (
                <button
                  key={filter}
                  onClick={() => setChallengeFilter(filter)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    challengeFilter === filter ? 'text-white' : 'border theme-card theme-text'
                  }`}
                  style={challengeFilter === filter ? { backgroundColor: 'var(--theme-button-bg)' } : {}}
                >
                  {filter === 'all' && <Zap className="w-4 h-4 inline mr-1" />}
                  {filter === 'daily' && <Target className="w-4 h-4 inline mr-1" />}
                  {filter === 'special' && <Trophy className="w-4 h-4 inline mr-1" />}
                  {filter === 'community' && <Plus className="w-4 h-4 inline mr-1" />}
                  {label}
                </button>
              ))}
            </div>

            <div className="grid gap-4">
              {getFilteredChallenges().map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} userSubmissions={userSubmissions} onComplete={loadUserSubmissions} />
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((profile, index) => (
              <div
                key={profile.id}
                className={`rounded-2xl border p-5 shadow-sm flex items-center gap-4 theme-card transition-colors duration-300 ${
                  index < 3 ? '' : ''
                }`}
                style={{ borderColor: index < 3 ? 'var(--theme-accent-200)' : 'var(--theme-card-border)' }}
              >
                <div className="flex items-center justify-center w-12">
                  {getRankIcon(index)}
                </div>
                <img
                  src={profile.profile_picture}
                  alt={profile.name}
                  className="w-12 h-12 rounded-full border-2"
                  style={{ borderColor: 'var(--theme-accent-200)' }}
                />
                <div className="flex-1">
                  <h3 className="font-bold theme-text">{profile.name}</h3>
                  <p className="text-sm theme-text-muted">{profile.challenges_completed} challenges completed</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold" style={{ color: 'var(--theme-button-bg)' }}>{profile.total_points}</div>
                  <div className="text-xs theme-text-muted">points</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}