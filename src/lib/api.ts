import { createClient } from '@metagptx/web-sdk';

export const client = createClient();

/**
 * Get the backend JWT token.
 */
export function getBackendToken(): string | null {
  if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
    return globalThis.localStorage?.getItem('token') ?? null;
  }
  return null;
}

/**
 * Clear the stored backend token (on logout).
 */
export function clearBackendToken(): void {
  if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
    globalThis.localStorage?.removeItem('token');
  }
}

/**
 * @deprecated No longer needed.
 */
export async function exchangeForBackendToken(): Promise<string | null> {
  console.warn('[exchangeForBackendToken] Deprecated: backend token is already in localStorage.token');
  return getBackendToken();
}

export interface UserProfile {
  id: number;
  user_id: string;
  name: string;
  profile_picture: string;
  total_points: number;
  challenges_completed: number;
  badges?: string;
  role: string;
  avatar_animal?: string;
  avatar_color?: string;
  avatar_accessory?: string;
  created_at: string;
  updated_at?: string;
}

export interface Challenge {
  id: number;
  title: string;
  description: string;
  points: number;
  challenge_type: 'daily' | 'normal' | 'special';
  created_at: string;
}

export interface Post {
  id: number;
  user_id: string;
  content: string;
  image_url?: string;
  image_urls?: string;
  location?: string;
  category?: string;
  like_count: number;
  created_at: string;
}

export interface Comment {
  id: number;
  post_id: number;
  user_id: string;
  content: string;
  created_at: string;
}

export interface CommentReply {
  id: number;
  comment_id: number;
  post_id: number;
  user_id: string;
  content: string;
  created_at: string;
}

export interface CommentLike {
  id: number;
  comment_id: number;
  user_id: string;
  created_at: string;
}

export interface ChallengeCompletion {
  id: number;
  user_id: string;
  challenge_id: number;
  completed_at: string;
}

export interface Like {
  id: number;
  user_id: string;
  post_id: number;
  created_at: string;
}

export const SUSTAINABILITY_CATEGORIES = [
  'Recycling',
  'Planting Trees',
  'Eco Tips',
  'Sustainable Living',
  'Wildlife Protection',
  'Clean Energy',
  'Water Conservation',
  'Other',
] as const;

export type SustainabilityCategory = typeof SUSTAINABILITY_CATEGORIES[number];

export const CATEGORY_COLORS: Record<string, string> = {
  'Recycling': 'bg-blue-100 text-blue-700',
  'Planting Trees': 'bg-green-100 text-green-700',
  'Eco Tips': 'bg-amber-100 text-amber-700',
  'Sustainable Living': 'bg-emerald-100 text-emerald-700',
  'Wildlife Protection': 'bg-orange-100 text-orange-700',
  'Clean Energy': 'bg-yellow-100 text-yellow-700',
  'Water Conservation': 'bg-cyan-100 text-cyan-700',
  'Other': 'bg-gray-100 text-gray-700',
};

/** Parse image_urls JSON string or fall back to single image_url */
export function getPostImages(post: Post): string[] {
  if (post.image_urls) {
    try {
      const parsed = JSON.parse(post.image_urls);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // ignore parse error
    }
  }
  if (post.image_url) {
    return [post.image_url];
  }
  return [];
}

// Helper function to get or create user profile - RESILIENT version
export async function getOrCreateUserProfile(userId: string, userName: string): Promise<UserProfile> {
  const fallbackProfile: UserProfile = {
    id: 0,
    user_id: userId,
    name: userName || 'Eco Warrior',
    profile_picture: 'https://mgx-backend-cdn.metadl.com/generate/images/965188/2026-02-11/9d031ff3-807b-4fc8-8099-db475ca99f2a.png',
    total_points: 0,
    challenges_completed: 0,
    role: 'user',
    created_at: new Date().toISOString(),
  };

  try {
    const response = await client.entities.user_profiles.query({
      query: { user_id: userId },
      limit: 1,
    });

    if (response.data.items.length > 0) {
      return response.data.items[0];
    }

    // Profile doesn't exist, create one
    try {
      const defaultAvatars = [
        'https://mgx-backend-cdn.metadl.com/generate/images/965188/2026-02-11/9d031ff3-807b-4fc8-8099-db475ca99f2a.png',
        'https://mgx-backend-cdn.metadl.com/generate/images/965188/2026-02-11/f060b974-bb6b-43e2-8100-60f58eb18980.png',
        'https://mgx-backend-cdn.metadl.com/generate/images/965188/2026-02-11/65302519-975c-4baa-8c86-759d5036dd22.png',
      ];

      const randomAvatar = defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];

      const createResponse = await client.entities.user_profiles.create({
        data: {
          user_id: userId,
          name: userName || 'Eco Warrior',
          profile_picture: randomAvatar,
          total_points: 0,
          challenges_completed: 0,
          role: 'user',
          created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
          updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        },
      });

      return createResponse.data;
    } catch (createError) {
      console.error('Error creating user profile, using fallback:', createError);
      return fallbackProfile;
    }
  } catch (error) {
    console.error('Error querying user profile, using fallback:', error);
    return fallbackProfile;
  }
}

/**
 * Check if the current user has admin role (server-side verification).
 */
export async function checkAdminRole(): Promise<{ is_admin: boolean; role: string; user_id: string }> {
  try {
    const response = await client.apiCall.invoke({
      url: '/api/v1/admin/check-role',
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    console.error('Error checking admin role:', error);
    return { is_admin: false, role: 'user', user_id: '' };
  }
}

// Admin moderation helpers
export async function adminEditComment(commentId: number, content: string) {
  return client.apiCall.invoke({
    url: `/api/v1/admin/moderation/comments/${commentId}`,
    method: 'PUT',
    data: { content },
  });
}

export async function adminDeleteComment(commentId: number) {
  return client.apiCall.invoke({
    url: `/api/v1/admin/moderation/comments/${commentId}`,
    method: 'DELETE',
  });
}

export async function adminEditReply(replyId: number, content: string) {
  return client.apiCall.invoke({
    url: `/api/v1/admin/moderation/replies/${replyId}`,
    method: 'PUT',
    data: { content },
  });
}

export async function adminDeleteReply(replyId: number) {
  return client.apiCall.invoke({
    url: `/api/v1/admin/moderation/replies/${replyId}`,
    method: 'DELETE',
  });
}

// Get status level based on points
export function getStatusLevel(points: number): { level: string; emoji: string; color: string } {
  if (points >= 300) {
    return { level: 'Climate Champion', emoji: '🌎', color: 'text-blue-600' };
  } else if (points >= 150) {
    return { level: 'Sustainability Pro', emoji: '🌍', color: 'text-green-600' };
  } else if (points >= 50) {
    return { level: 'Green Advocate', emoji: '🌿', color: 'text-emerald-600' };
  } else {
    return { level: 'Eco Starter', emoji: '🌱', color: 'text-lime-600' };
  }
}

// Calculate user rank from leaderboard
export async function getUserRank(userId: string): Promise<number> {
  try {
    const response = await client.entities.user_profiles.queryAll({
      sort: '-total_points',
      limit: 1000,
    });

    const users = response.data.items;
    const userIndex = users.findIndex((u: any) => u.user_id === userId);
    return userIndex + 1;
  } catch (error) {
    console.error('Error calculating rank:', error);
    return 0;
  }
}