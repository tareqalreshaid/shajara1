import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { client, getOrCreateUserProfile, checkAdminRole, UserProfile } from '@/lib/api';
import UserAvatar from '@/components/UserAvatar';
import StatusBadge from '@/components/StatusBadge';
import AnimalAvatar, { ANIMAL_INFO, type AnimalType, type AvatarColor, type AvatarAccessory } from '@/components/AnimalAvatar';
import { Trophy, Target, LogOut, Edit, CheckCircle, XCircle, Clock, Shield, Camera, Loader2, Palette, PawPrint } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<(UserProfile & { avatar_animal?: string; avatar_color?: string; avatar_accessory?: string }) | null>(null);
  const [rank, setRank] = useState<number>(0);
  const [posts, setPosts] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [badges, setBadges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userResponse = await client.auth.me();
      if (userResponse.data) {
        setUser(userResponse.data);
        await loadUserData(userResponse.data.id, userResponse.data.email);

        const roleCheck = await checkAdminRole();
        setIsAdmin(roleCheck.is_admin);
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
      setProfile(userProfile as UserProfile & { avatar_animal?: string; avatar_color?: string; avatar_accessory?: string });
      setEditName(userProfile.name);

      const allProfiles = await client.entities.user_profiles.queryAll({
        sort: '-total_points',
        limit: 1000,
      });
      const userRank = allProfiles.data.items.findIndex((p: UserProfile) => p.user_id === userId) + 1;
      setRank(userRank);

      const postsResponse = await client.entities.posts.query({
        sort: '-created_at',
        limit: 20,
      });
      setPosts(postsResponse.data.items);

      const submissionsResponse = await client.entities.submissions.query({
        sort: '-submitted_at',
        limit: 50,
      });
      setSubmissions(submissionsResponse.data.items);

      try {
        const badgesResponse = await client.apiCall.invoke({
          url: '/api/v1/user/badges',
          method: 'GET',
        });
        setBadges(badgesResponse.data.badges || []);
      } catch (error) {
        console.error('Error loading badges:', error);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user data',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateProfile = async () => {
    if (!profile || !editName.trim()) return;

    try {
      await client.entities.user_profiles.update({
        id: profile.id.toString(),
        data: { name: editName.trim() },
      });

      setProfile({ ...profile, name: editName.trim() });
      setIsEditing(false);
      toast({
        title: 'Profile updated',
        description: 'Your name has been updated successfully',
      });
    } catch (error: any) {
      console.error('Update error:', error);
      toast({
        title: 'Update failed',
        description: error?.data?.detail || error?.message || 'Failed to update profile',
        variant: 'destructive',
      });
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image under 10MB',
        variant: 'destructive',
      });
      return;
    }

    setUploadingPhoto(true);

    try {
      const bucketName = 'profile-photos';

      try {
        await client.storage.createBucket({ bucket_name: bucketName, visibility: 'public' });
      } catch (error) {
        // Bucket might already exist
      }

      const objectKey = `${user.id}/${Date.now()}_${file.name}`;
      await client.storage.upload({
        bucket_name: bucketName,
        object_key: objectKey,
        file: file,
      });

      const downloadUrlResponse = await client.storage.getDownloadUrl({
        bucket_name: bucketName,
        object_key: objectKey,
      });

      const imageUrl = downloadUrlResponse.data.download_url;

      await client.apiCall.invoke({
        url: '/api/v1/user/profile-photo',
        method: 'PUT',
        data: { image_url: imageUrl },
      });

      if (profile) {
        setProfile({ ...profile, profile_picture: imageUrl });
      }

      toast({
        title: 'Profile photo updated! ✅',
        description: 'Your new photo will appear across the app',
      });

      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error: any) {
      console.error('Photo upload error:', error);
      toast({
        title: 'Upload failed',
        description: error?.data?.detail || error?.message || 'Failed to update profile photo',
        variant: 'destructive',
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleLogout = async () => {
    try {
      await client.auth.logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleLogin = async () => {
    try {
      await client.auth.toLogin();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const getSubmissionStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return null;
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
          <UserAvatar size="xl" className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Profile</h1>
          <p className="text-gray-500 mb-6">Sign in to view your profile and achievements</p>
          <button
            onClick={handleLogin}
            className="w-full py-3 theme-btn rounded-xl font-semibold transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-bg pb-20 transition-colors duration-300">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Profile Header */}
        {profile && (
          <div className="bg-white rounded-2xl border theme-border p-6 shadow-sm mb-6 transition-colors duration-300">
            <div className="flex items-start gap-4 mb-4">
              <div className="relative">
                <UserAvatar src={profile.profile_picture} size="xl" />
                <label
                  className="absolute bottom-0 right-0 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors shadow-lg"
                  style={{ backgroundColor: 'var(--theme-button-bg)' }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploadingPhoto}
                  />
                  {uploadingPhoto ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5 text-white" />
                  )}
                </label>
              </div>
              <div className="flex-1">
                {isEditing ? (
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                      style={{ borderColor: 'var(--theme-accent-200)' }}
                    />
                    <button
                      onClick={handleUpdateProfile}
                      className="px-4 py-2 theme-btn rounded-lg transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditName(profile.name);
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1 theme-icon rounded-lg transition-colors hover:opacity-80"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <StatusBadge points={profile.total_points} />
              </div>
            </div>

            {/* Animal Avatar Preview */}
            {profile.avatar_animal && (
              <div
                className="mb-4 p-4 rounded-xl flex items-center gap-4 cursor-pointer hover:opacity-90 transition-opacity"
                style={{ backgroundColor: 'var(--theme-accent-50)' }}
                onClick={() => navigate('/avatar-customize')}
              >
                <AnimalAvatar
                  config={{
                    animal: profile.avatar_animal as AnimalType,
                    color: (profile.avatar_color as AvatarColor) || 'default',
                    accessory: (profile.avatar_accessory as AvatarAccessory) || 'none',
                  }}
                  size={56}
                  animation="idle"
                />
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-sm">
                    {ANIMAL_INFO[profile.avatar_animal as AnimalType]?.emoji}{' '}
                    {ANIMAL_INFO[profile.avatar_animal as AnimalType]?.name} Guardian
                  </p>
                  <p className="text-xs" style={{ color: 'var(--theme-accent-700)' }}>
                    {ANIMAL_INFO[profile.avatar_animal as AnimalType]?.trait}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Tap to customize</p>
                </div>
              </div>
            )}

            {!profile.avatar_animal && (
              <button
                onClick={() => navigate('/avatar-select')}
                className="w-full mb-4 p-4 rounded-xl border-2 border-dashed text-center transition-all hover:scale-[1.01]"
                style={{ borderColor: 'var(--theme-button-bg)', backgroundColor: 'var(--theme-accent-50)' }}
              >
                <PawPrint className="w-6 h-6 mx-auto mb-1" style={{ color: 'var(--theme-button-bg)' }} />
                <p className="font-bold text-gray-900 text-sm">Choose Your Guardian Animal</p>
                <p className="text-[10px] text-gray-500">Pick an avatar for the Shajara map</p>
              </button>
            )}

            {/* Badges */}
            {badges.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Badges</h3>
                <div className="flex flex-wrap gap-2">
                  {badges.map((badge, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium"
                    >
                      🏆 {badge}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 rounded-xl" style={{ backgroundColor: 'var(--theme-accent-50)' }}>
                <div className="text-2xl font-bold" style={{ color: 'var(--theme-button-bg)' }}>#{rank}</div>
                <div className="text-xs text-gray-500">Rank</div>
              </div>
              <div className="text-center p-3 rounded-xl" style={{ backgroundColor: 'var(--theme-accent-50)' }}>
                <div className="text-2xl font-bold" style={{ color: 'var(--theme-button-bg)' }}>{profile.total_points}</div>
                <div className="text-xs text-gray-500">Points</div>
              </div>
              <div className="text-center p-3 rounded-xl" style={{ backgroundColor: 'var(--theme-accent-50)' }}>
                <div className="text-2xl font-bold" style={{ color: 'var(--theme-button-bg)' }}>{profile.challenges_completed}</div>
                <div className="text-xs text-gray-500">Completed</div>
              </div>
            </div>

            {/* Admin Access */}
            {isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="w-full py-3 mb-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
              >
                <Shield className="w-5 h-5" />
                Admin Dashboard
              </button>
            )}

            {/* Avatar Customize Button */}
            <button
              onClick={() => navigate(profile.avatar_animal ? '/avatar-customize' : '/avatar-select')}
              className="w-full py-3 mb-3 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444, #8b5cf6)' }}
            >
              <PawPrint className="w-5 h-5" />
              🐾 My Guardian Avatar
            </button>

            {/* Eco Themes Button */}
            <button
              onClick={() => navigate('/eco-themes')}
              className="w-full py-3 mb-3 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              style={{ background: `linear-gradient(to right, var(--theme-button-bg), var(--theme-highlight))` }}
            >
              <Palette className="w-5 h-5" />
              🎨 Eco Themes
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        )}

        {/* Recent Submissions */}
        {submissions.length > 0 && (
          <div className="bg-white rounded-2xl border theme-border p-6 shadow-sm mb-6 transition-colors duration-300">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 theme-icon" />
              Recent Submissions
            </h2>
            <div className="space-y-3">
              {submissions.slice(0, 5).map((submission: any) => (
                <div
                  key={submission.id}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ backgroundColor: 'var(--theme-accent-50)' }}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Challenge #{submission.challenge_id}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(submission.submitted_at).toLocaleDateString()}
                    </p>
                    {submission.status === 'rejected' && submission.admin_note && (
                      <p className="text-xs text-red-600 mt-1">
                        <strong>Reason:</strong> {submission.admin_note}
                      </p>
                    )}
                  </div>
                  {getSubmissionStatusBadge(submission.status)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Achievements */}
        <div className="bg-white rounded-2xl border theme-border p-6 shadow-sm mb-6 transition-colors duration-300">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 theme-icon" />
            Recent Achievements
          </h2>
          <div className="space-y-3">
            {profile && profile.challenges_completed > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--theme-accent-50)' }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--theme-button-bg)' }}>
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Challenge Master</p>
                  <p className="text-sm text-gray-500">Completed {profile.challenges_completed} challenges</p>
                </div>
              </div>
            )}
            {profile && profile.total_points >= 100 && (
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Point Collector</p>
                  <p className="text-sm text-gray-500">Earned {profile.total_points} points</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Posts */}
        {posts.length > 0 && (
          <div className="bg-white rounded-2xl border theme-border p-6 shadow-sm transition-colors duration-300">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Posts</h2>
            <div className="grid grid-cols-3 gap-2">
              {posts.map((post) => (
                <div key={post.id} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  {post.image_url ? (
                    <img
                      src={post.image_url}
                      alt="Post"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <p className="text-xs text-center p-2 line-clamp-3">{post.content}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}