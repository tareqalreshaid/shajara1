import { useEffect, useState, useRef } from 'react';
import { client, getOrCreateUserProfile, checkAdminRole, Post, UserProfile, SUSTAINABILITY_CATEGORIES } from '@/lib/api';
import PostCard from '@/components/PostCard';
import { Image as ImageIcon, Send, MapPin, Tag, X, Plus, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Social() {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [postContent, setPostContent] = useState('');
  const [postImages, setPostImages] = useState<string[]>([]);
  const [postLocation, setPostLocation] = useState('');
  const [postCategory, setPostCategory] = useState('');
  const [posting, setPosting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await loadPosts();
      try {
        const userResponse = await client.auth.me();
        if (userResponse.data) {
          setUser(userResponse.data);
          const userProfile = await getOrCreateUserProfile(userResponse.data.id, userResponse.data.email.split('@')[0]);
          setProfile(userProfile);
          try {
            const adminCheck = await checkAdminRole();
            setIsAdmin(adminCheck.is_admin);
          } catch {
            // Admin check failed - not critical
          }
        }
      } catch {
        // Not logged in - that's fine
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      const postsResponse = await client.entities.posts.queryAll({
        sort: '-created_at',
        limit: 50,
      });

      const postsWithProfiles = await Promise.all(
        postsResponse.data.items.map(async (post: Post) => {
          try {
            const profileResponse = await client.entities.user_profiles.queryAll({
              query: { user_id: post.user_id },
              limit: 1,
              fields: ['id', 'name', 'profile_picture', 'total_points', 'role'],
            });
            return { ...post, userProfile: profileResponse.data.items[0] || null };
          } catch {
            return { ...post, userProfile: null };
          }
        })
      );

      setPosts(postsWithProfiles);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const newImages: string[] = [];
      for (let i = 0; i < Math.min(files.length, 5 - postImages.length); i++) {
        const file = files[i];
        const objectKey = `posts/${Date.now()}-${file.name}`;
        await client.storage.upload({ bucket_name: 'post-images', object_key: objectKey, file });
        const downloadResult = await client.storage.getDownloadUrl({ bucket_name: 'post-images', object_key: objectKey });
        if (downloadResult?.data?.download_url) {
          newImages.push(downloadResult.data.download_url);
        }
      }
      setPostImages([...postImages, ...newImages]);
      if (newImages.length > 0) {
        toast({ title: `${newImages.length} image(s) uploaded!` });
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({ title: 'Error', description: 'Failed to upload images.', variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddImageUrl = () => {
    const url = prompt('Enter image URL:');
    if (url && url.trim()) {
      setPostImages([...postImages, url.trim()]);
    }
  };

  const removeImage = (index: number) => {
    setPostImages(postImages.filter((_, i) => i !== index));
  };

  const handleCreatePost = async () => {
    if (!postContent.trim() || !user) return;

    setPosting(true);
    try {
      await client.entities.posts.create({
        data: {
          user_id: user.id,
          content: postContent,
          image_url: postImages.length > 0 ? postImages[0] : '',
          image_urls: postImages.length > 0 ? JSON.stringify(postImages) : '',
          location: postLocation || '',
          category: postCategory || '',
          like_count: 0,
          created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        },
      });

      setPostContent('');
      setPostImages([]);
      setPostLocation('');
      setPostCategory('');
      setShowOptions(false);
      await loadPosts();

      toast({ title: 'Post created!', description: 'Your post has been shared with the community' });
    } catch (error) {
      console.error('Error creating post:', error);
      toast({ title: 'Error', description: 'Failed to create post', variant: 'destructive' });
    } finally {
      setPosting(false);
    }
  };

  const handleLogin = async () => {
    await client.auth.toLogin();
  };

  const handleLike = async () => {
    await loadPosts();
  };

  const handleComment = async () => {};

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center theme-bg transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 theme-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-bg pb-20 transition-colors duration-300">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">🌿 Community Feed</h1>

        {user ? (
          <div className="bg-white rounded-2xl border theme-border shadow-sm p-4 mb-6 transition-colors duration-300">
            <div className="flex items-start gap-3 mb-3">
              <img
                src={profile?.profile_picture || 'https://mgx-backend-cdn.metadl.com/generate/images/965188/2026-02-11/9d031ff3-807b-4fc8-8099-db475ca99f2a.png'}
                alt="Your avatar"
                className="w-10 h-10 rounded-full object-cover border-2"
                style={{ borderColor: 'var(--theme-accent-200)' }}
              />
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="Share your eco journey... 🌱"
                className="flex-1 px-4 py-3 border rounded-xl text-sm text-gray-900 focus:outline-none resize-none"
                style={{ backgroundColor: 'var(--theme-accent-50)', borderColor: 'var(--theme-card-border)' }}
                rows={3}
              />
            </div>

            {postImages.length > 0 && (
              <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                {postImages.map((img, idx) => (
                  <div key={idx} className="relative flex-shrink-0 w-20 h-20">
                    <img src={img} alt={`Upload ${idx + 1}`} className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                    <button onClick={() => removeImage(idx)} className="absolute -top-1.5 -right-1.5 p-0.5 bg-red-500 text-white rounded-full">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {postImages.length < 5 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-shrink-0 w-20 h-20 border-2 border-dashed text-gray-400 rounded-lg flex items-center justify-center transition-colors"
                    style={{ borderColor: 'var(--theme-accent-200)' }}
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                )}
              </div>
            )}

            {showOptions && (
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 theme-icon" />
                  <select
                    value={postCategory}
                    onChange={(e) => setPostCategory(e.target.value)}
                    className="flex-1 px-3 py-2 border text-gray-900 rounded-lg text-sm focus:outline-none"
                    style={{ backgroundColor: 'var(--theme-accent-50)', borderColor: 'var(--theme-card-border)' }}
                  >
                    <option value="">Select category (optional)</option>
                    {SUSTAINABILITY_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 theme-icon" />
                  <input
                    type="text"
                    value={postLocation}
                    onChange={(e) => setPostLocation(e.target.value)}
                    placeholder="Add location (optional)"
                    className="flex-1 px-3 py-2 border text-gray-900 rounded-lg text-sm focus:outline-none"
                    style={{ backgroundColor: 'var(--theme-accent-50)', borderColor: 'var(--theme-card-border)' }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || postImages.length >= 5}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm theme-icon rounded-lg transition-colors disabled:opacity-50"
                >
                  <ImageIcon className="w-4 h-4" />
                  {uploading ? 'Uploading...' : 'Photo'}
                </button>
                <button
                  onClick={handleAddImageUrl}
                  disabled={postImages.length >= 5}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm theme-icon rounded-lg transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  URL
                </button>
                <button
                  onClick={() => setShowOptions(!showOptions)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm theme-icon rounded-lg transition-colors"
                  style={showOptions ? { backgroundColor: 'var(--theme-accent-100)' } : undefined}
                >
                  <Tag className="w-4 h-4" />
                  Options
                </button>
              </div>
              <button
                onClick={handleCreatePost}
                disabled={!postContent.trim() || posting}
                className="px-6 py-2 theme-btn rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {posting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border theme-border shadow-sm p-6 mb-6 text-center transition-colors duration-300">
            <p className="text-gray-500 mb-3">Sign in to share your eco journey with the community!</p>
            <button
              onClick={handleLogin}
              className="inline-flex items-center gap-2 px-6 py-2.5 theme-btn rounded-lg font-medium text-sm transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Sign In to Post
            </button>
          </div>
        )}

        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              userProfile={post.userProfile}
              currentUserId={user?.id || ''}
              currentUserProfile={profile}
              isAdmin={isAdmin}
              onLike={handleLike}
              onComment={handleComment}
            />
          ))}

          {posts.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border theme-border shadow-sm transition-colors duration-300">
              <div className="text-5xl mb-4">🌱</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
              <p className="text-gray-500">Be the first to share your eco journey!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}