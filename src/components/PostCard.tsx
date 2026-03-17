import { useState, useCallback } from 'react';
import { Heart, MessageCircle, Send, ChevronLeft, ChevronRight, MapPin, X } from 'lucide-react';
import { Post, client, UserProfile, getPostImages, CATEGORY_COLORS } from '@/lib/api';
import UserAvatar from './UserAvatar';
import CommentItem from './CommentItem';
import { useToast } from '@/hooks/use-toast';

interface PostCardProps {
  post: Post;
  userProfile: UserProfile | null;
  currentUserId: string;
  currentUserProfile?: UserProfile | null;
  isAdmin: boolean;
  onLike: (postId: number) => void;
  onComment: (postId: number, content: string) => void;
}

export default function PostCard({ post, userProfile, currentUserId, currentUserProfile, isAdmin, onLike, onComment }: PostCardProps) {
  const { toast } = useToast();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.like_count);

  // Image gallery state
  const images = getPostImages(post);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const loadComments = async () => {
    if (comments.length > 0) {
      setShowComments(!showComments);
      return;
    }

    setLoadingComments(true);
    try {
      const response = await client.entities.comments.queryAll({
        query: { post_id: post.id },
        sort: 'created_at',
        limit: 100,
      });

      const commentsWithProfiles = await Promise.all(
        response.data.items.map(async (comment: any) => {
          const profileResponse = await client.entities.user_profiles.query({
            query: { user_id: comment.user_id },
            limit: 1,
          });
          return {
            ...comment,
            userProfile: profileResponse.data.items[0] || null,
          };
        })
      );

      setComments(commentsWithProfiles);
      setShowComments(true);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast({ title: 'Error', description: 'Failed to load comments', variant: 'destructive' });
    } finally {
      setLoadingComments(false);
    }
  };

  const handleLike = async () => {
    try {
      if (isLiked) {
        const likesResponse = await client.entities.likes.query({
          query: { post_id: post.id },
          limit: 100,
        });
        const userLike = likesResponse.data.items.find((like: any) => like.user_id === currentUserId);
        if (userLike) {
          await client.entities.likes.delete({ id: userLike.id.toString() });
        }
        setIsLiked(false);
        setLikeCount((prev) => prev - 1);
      } else {
        await client.entities.likes.create({
          data: {
            user_id: currentUserId,
            post_id: post.id,
            created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
          },
        });
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
      }

      await client.entities.posts.update({
        id: post.id.toString(),
        data: {
          like_count: isLiked ? likeCount - 1 : likeCount + 1,
        },
      });

      onLike(post.id);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;

    try {
      const newComment = await client.entities.comments.create({
        data: {
          post_id: post.id,
          user_id: currentUserId,
          content: commentText,
          created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        },
      });

      setComments([...comments, { ...newComment.data, userProfile: currentUserProfile || userProfile }]);
      setCommentText('');
      onComment(post.id, commentText);

      toast({ title: 'Comment posted!' });
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({ title: 'Error', description: 'Failed to post comment', variant: 'destructive' });
    }
  };

  const handleCommentDeleted = useCallback((commentId: number) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }, []);

  const handleCommentEdited = useCallback((commentId: number, newContent: string) => {
    setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, content: newContent } : c)));
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);

  const categoryColor = post.category ? (CATEGORY_COLORS[post.category] || 'bg-gray-100 text-gray-700') : '';

  return (
    <>
      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
        {/* Post Header */}
        <div className="p-4 flex items-center gap-3">
          <UserAvatar
            src={userProfile?.profile_picture}
            alt={userProfile?.name || 'User'}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900">{userProfile?.name || 'Eco Warrior'}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs text-gray-500">{formatDate(post.created_at)}</p>
              {post.location && (
                <span className="flex items-center gap-0.5 text-xs text-gray-500">
                  <MapPin className="w-3 h-3" />
                  {post.location}
                </span>
              )}
            </div>
          </div>
          {post.category && (
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${categoryColor}`}>
              {post.category}
            </span>
          )}
        </div>

        {/* Post Content */}
        <div className="px-4 pb-3">
          <p className="text-gray-900 leading-relaxed">{post.content}</p>
        </div>

        {/* Image Gallery */}
        {images.length > 0 && (
          <div className="relative">
            <img
              src={images[currentImageIndex]}
              alt="Post"
              className="w-full object-cover max-h-96 cursor-pointer rounded-none"
              onClick={() => setLightboxOpen(true)}
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        idx === currentImageIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Post Actions */}
        <div className="px-4 py-3 border-t border-emerald-100">
          <div className="flex items-center gap-6">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 transition-colors ${
                isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">{likeCount}</span>
            </button>
            <button
              onClick={loadComments}
              className="flex items-center gap-2 text-gray-400 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{comments.length}</span>
            </button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="border-t border-emerald-100 bg-emerald-50">
            {loadingComments ? (
              <div className="p-4 text-center text-gray-500">Loading comments...</div>
            ) : (
              <>
                {comments.length > 0 && (
                  <div className="max-h-80 overflow-y-auto divide-y divide-emerald-100">
                    {comments.map((comment) => (
                      <CommentItem
                        key={comment.id}
                        comment={comment}
                        currentUserId={currentUserId}
                        isAdmin={isAdmin}
                        onCommentDeleted={handleCommentDeleted}
                        onCommentEdited={handleCommentEdited}
                      />
                    ))}
                  </div>
                )}
                {/* Comment Input */}
                <div className="p-4 flex items-center gap-3 border-t border-emerald-100">
                  <UserAvatar
                    src={currentUserProfile?.profile_picture || userProfile?.profile_picture}
                    alt="You"
                    size="sm"
                  />
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
                    placeholder="Write a comment..."
                    className="flex-1 px-4 py-2 bg-white border border-emerald-100 rounded-full text-sm text-gray-900 focus:outline-none"
                  />
                  <button
                    onClick={handleSubmitComment}
                    disabled={!commentText.trim()}
                    className="p-2 text-emerald-600 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && images.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={images[currentImageIndex]}
            alt="Post"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      idx === currentImageIndex ? 'bg-white' : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}