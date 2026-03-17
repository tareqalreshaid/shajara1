import { useState } from 'react';
import { Heart, MessageCircle, MoreHorizontal, Send, Pencil, Trash2, X, Check } from 'lucide-react';
import { client, adminEditComment, adminDeleteComment, adminEditReply, adminDeleteReply } from '@/lib/api';
import UserAvatar from './UserAvatar';
import { useToast } from '@/hooks/use-toast';

interface ReplyData {
  id: number;
  comment_id: number;
  post_id: number;
  user_id: string;
  content: string;
  created_at: string;
  userProfile?: any;
}

interface CommentItemProps {
  comment: any;
  currentUserId: string;
  isAdmin: boolean;
  onCommentDeleted?: (commentId: number) => void;
  onCommentEdited?: (commentId: number, newContent: string) => void;
}

export default function CommentItem({ comment, currentUserId, isAdmin, onCommentDeleted, onCommentEdited }: CommentItemProps) {
  const { toast } = useToast();
  const [replies, setReplies] = useState<ReplyData[]>([]);
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  // Reply menu states
  const [replyMenuId, setReplyMenuId] = useState<number | null>(null);
  const [editingReplyId, setEditingReplyId] = useState<number | null>(null);
  const [editReplyContent, setEditReplyContent] = useState('');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const loadReplies = async () => {
    if (showReplies && replies.length > 0) {
      setShowReplies(false);
      return;
    }

    setLoadingReplies(true);
    try {
      const response = await client.entities.comment_replies.queryAll({
        query: { comment_id: comment.id },
        sort: 'created_at',
        limit: 100,
      });

      const repliesWithProfiles = await Promise.all(
        response.data.items.map(async (reply: any) => {
          const profileResponse = await client.entities.user_profiles.query({
            query: { user_id: reply.user_id },
            limit: 1,
          });
          return {
            ...reply,
            userProfile: profileResponse.data.items[0] || null,
          };
        })
      );

      setReplies(repliesWithProfiles);
      setShowReplies(true);
    } catch (error) {
      console.error('Error loading replies:', error);
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim()) return;

    try {
      const newReply = await client.entities.comment_replies.create({
        data: {
          comment_id: comment.id,
          post_id: comment.post_id,
          user_id: currentUserId,
          content: replyText,
          created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        },
      });

      // Get current user profile for display
      const profileResponse = await client.entities.user_profiles.query({
        query: { user_id: currentUserId },
        limit: 1,
      });

      setReplies([...replies, { ...newReply.data, userProfile: profileResponse.data.items[0] || null }]);
      setReplyText('');
      setShowReplyInput(false);
      setShowReplies(true);

      toast({ title: 'Reply posted!' });
    } catch (error) {
      console.error('Error posting reply:', error);
      toast({ title: 'Error', description: 'Failed to post reply', variant: 'destructive' });
    }
  };

  const handleToggleLike = async () => {
    try {
      if (isLiked) {
        const likesResponse = await client.entities.comment_likes.query({
          query: { comment_id: comment.id },
          limit: 100,
        });
        const userLike = likesResponse.data.items.find((l: any) => l.user_id === currentUserId);
        if (userLike) {
          await client.entities.comment_likes.delete({ id: userLike.id.toString() });
        }
        setIsLiked(false);
        setLikeCount((prev) => prev - 1);
      } else {
        await client.entities.comment_likes.create({
          data: {
            comment_id: comment.id,
            user_id: currentUserId,
            created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
          },
        });
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling comment like:', error);
    }
  };

  const handleEditComment = async () => {
    if (!editContent.trim()) return;
    try {
      await adminEditComment(comment.id, editContent);
      setIsEditing(false);
      onCommentEdited?.(comment.id, editContent);
      toast({ title: 'Comment updated' });
    } catch (error) {
      console.error('Error editing comment:', error);
      toast({ title: 'Error', description: 'Failed to edit comment', variant: 'destructive' });
    }
  };

  const handleDeleteComment = async () => {
    try {
      await adminDeleteComment(comment.id);
      onCommentDeleted?.(comment.id);
      toast({ title: 'Comment deleted' });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({ title: 'Error', description: 'Failed to delete comment', variant: 'destructive' });
    }
  };

  const handleEditReply = async (replyId: number) => {
    if (!editReplyContent.trim()) return;
    try {
      await adminEditReply(replyId, editReplyContent);
      setReplies(replies.map((r) => (r.id === replyId ? { ...r, content: editReplyContent } : r)));
      setEditingReplyId(null);
      toast({ title: 'Reply updated' });
    } catch (error) {
      console.error('Error editing reply:', error);
      toast({ title: 'Error', description: 'Failed to edit reply', variant: 'destructive' });
    }
  };

  const handleDeleteReply = async (replyId: number) => {
    try {
      await adminDeleteReply(replyId);
      setReplies(replies.filter((r) => r.id !== replyId));
      toast({ title: 'Reply deleted' });
    } catch (error) {
      console.error('Error deleting reply:', error);
      toast({ title: 'Error', description: 'Failed to delete reply', variant: 'destructive' });
    }
  };

  return (
    <div className="px-4 py-3">
      {/* Main Comment */}
      <div className="flex items-start gap-3 group">
        <UserAvatar
          src={comment.userProfile?.profile_picture}
          alt={comment.userProfile?.name || 'User'}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm text-gray-900">
              {comment.userProfile?.name || 'Eco Warrior'}
            </span>
            <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>

            {/* Admin three-dot menu */}
            {isAdmin && (
              <div className="relative ml-auto">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-6 z-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px]">
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setEditContent(comment.content);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit comment
                    </button>
                    <button
                      onClick={() => {
                        handleDeleteComment();
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete comment
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Comment content or edit mode */}
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                autoFocus
              />
              <button onClick={handleEditComment} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-full">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => setIsEditing(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-700">{comment.content}</p>
          )}

          {/* Comment actions */}
          <div className="flex items-center gap-4 mt-1.5">
            <button
              onClick={handleToggleLike}
              className={`flex items-center gap-1 text-xs transition-colors ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
            >
              <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
              {likeCount > 0 && <span>{likeCount}</span>}
            </button>
            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-emerald-600 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Reply
            </button>
            <button
              onClick={loadReplies}
              className="text-xs text-gray-500 hover:text-emerald-600 transition-colors"
            >
              {loadingReplies ? 'Loading...' : showReplies ? 'Hide replies' : 'View replies'}
            </button>
          </div>
        </div>
      </div>

      {/* Reply Input */}
      {showReplyInput && (
        <div className="ml-11 mt-2 flex items-center gap-2">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmitReply()}
            placeholder="Write a reply..."
            className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:border-emerald-500"
            autoFocus
          />
          <button
            onClick={handleSubmitReply}
            disabled={!replyText.trim()}
            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Replies */}
      {showReplies && replies.length > 0 && (
        <div className="ml-11 mt-2 space-y-2 border-l-2 border-emerald-100 pl-3">
          {replies.map((reply) => (
            <div key={reply.id} className="flex items-start gap-2 group/reply">
              <UserAvatar
                src={reply.userProfile?.profile_picture}
                alt={reply.userProfile?.name || 'User'}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-xs text-gray-900">
                    {reply.userProfile?.name || 'Eco Warrior'}
                  </span>
                  <span className="text-xs text-gray-400">{formatDate(reply.created_at)}</span>

                  {/* Admin menu for replies */}
                  {isAdmin && (
                    <div className="relative ml-auto">
                      <button
                        onClick={() => setReplyMenuId(replyMenuId === reply.id ? null : reply.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 opacity-0 group-hover/reply:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                      {replyMenuId === reply.id && (
                        <div className="absolute right-0 top-5 z-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[130px]">
                          <button
                            onClick={() => {
                              setEditingReplyId(reply.id);
                              setEditReplyContent(reply.content);
                              setReplyMenuId(null);
                            }}
                            className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Pencil className="w-3 h-3" />
                            Edit reply
                          </button>
                          <button
                            onClick={() => {
                              handleDeleteReply(reply.id);
                              setReplyMenuId(null);
                            }}
                            className="w-full px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete reply
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {editingReplyId === reply.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editReplyContent}
                      onChange={(e) => setEditReplyContent(e.target.value)}
                      className="flex-1 px-2 py-1 bg-white border border-emerald-300 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                      autoFocus
                    />
                    <button onClick={() => handleEditReply(reply.id)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-full">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setEditingReplyId(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-full">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-gray-700">{reply.content}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}