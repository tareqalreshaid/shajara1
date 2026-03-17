# Shajara App - Challenge System Overhaul

## Implementation Plan

### Phase 1: Backend - Database & Models
1. ✅ Review existing models (submissions, challenges, user_profiles)
2. Create new table: community_activities
3. Add badges field to user_profiles model
4. Update user_profiles to support profile_picture updates

### Phase 2: Backend - Admin Approval System
1. Create admin approval endpoint for submissions (POST /api/v1/admin/submissions/{id}/review)
2. Create admin approval endpoint for community activities (POST /api/v1/admin/activities/{id}/review)
3. Implement server-side point calculation logic
4. Add point award logic when admin approves submissions
5. Add bonus point (30) + badge award when admin approves activities

### Phase 3: Backend - User Endpoints
1. Create endpoint for users to submit community activities (POST /api/v1/entities/community_activities)
2. Create endpoint for profile photo upload (PUT /api/v1/user/profile-photo)
3. Update leaderboard endpoint to calculate points server-side only
4. Add endpoint to get user's badges

### Phase 4: Frontend - Remove Client-Side Point Logic
1. Update ChallengeCard.tsx - Remove all direct point manipulation
2. Ensure "Complete Challenge" ALWAYS redirects to submission page
3. Remove any instant point award logic
4. Remove any instant leaderboard update logic

### Phase 5: Frontend - Admin Dashboard
1. Create AdminDashboard page with submission review UI
2. Add approve/reject buttons for submissions
3. Add community activities review section
4. Add approve/reject/edit points for activities

### Phase 6: Frontend - New Features
1. Add "Create Activity" page/modal
2. Add form: title, description, suggested_points, category, image upload
3. Update Profile page with "Change Profile Photo" feature
4. Add image upload with preview
5. Update all profile picture references across app

### Phase 7: Frontend - Leaderboard Update
1. Update leaderboard to fetch server-calculated points only
2. Remove any client-side point calculation
3. Ensure real-time ranking display

### Phase 8: Testing & Validation
1. Test multi-user behavior
2. Verify no client-side point manipulation possible
3. Test admin approval workflow
4. Test activity creation and approval
5. Test profile photo update across all pages
6. Verify leaderboard accuracy

## Critical Rules
- NO user can gain points without admin approval
- ALL point calculations MUST be server-side
- NO client-side point manipulation
- Each user sees only their own submissions
- Admin dashboard is separate from user dashboard