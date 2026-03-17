import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { client, checkAdminRole } from '@/lib/api';
import { Shield, CheckCircle, XCircle, Clock, Loader2, ImageOff, RefreshCw, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'submissions' | 'activities'>('submissions');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => { checkAuth(); }, []);
  useEffect(() => { if (user) loadData(); }, [user, activeTab, showAll]);

  const checkAuth = async () => {
    try {
      const userResponse = await client.auth.me();
      if (!userResponse.data) { navigate('/'); return; }
      const roleCheck = await checkAdminRole();
      if (!roleCheck.is_admin) {
        toast({ title: 'Access Denied', description: 'You do not have admin privileges.', variant: 'destructive' });
        navigate('/');
        return;
      }
      setUser(userResponse.data);
    } catch {
      toast({ title: 'Access Denied', description: 'Unable to verify admin privileges.', variant: 'destructive' });
      navigate('/');
    } finally { setLoading(false); }
  };

  const loadData = async () => {
    setDataLoading(true);
    try {
      if (activeTab === 'submissions') {
        const endpoint = showAll ? '/api/v1/admin/submissions/all' : '/api/v1/admin/submissions/pending';
        const response = await client.apiCall.invoke({ url: endpoint, method: 'GET' });
        setSubmissions(response.data?.items || []);
        try {
          const challengesResponse = await client.entities.challenges.query({ limit: 1000 });
          setChallenges(challengesResponse.data?.items || []);
        } catch { /* non-fatal */ }
      } else {
        const response = await client.apiCall.invoke({ url: '/api/v1/admin/activities/pending', method: 'GET' });
        setActivities(response.data?.items || []);
      }
    } catch (error: any) {
      if (error?.status === 403) {
        toast({ title: 'Access Denied', variant: 'destructive' });
        navigate('/');
        return;
      }
      toast({ title: 'Error loading data', description: error?.data?.detail || error?.message || 'Failed to load data', variant: 'destructive' });
    } finally { setDataLoading(false); }
  };

  const reviewSubmission = async (submissionId: number, status: 'approved' | 'rejected', adminNote?: string) => {
    setReviewingId(submissionId);
    try {
      await client.apiCall.invoke({
        url: `/api/v1/admin/submissions/${submissionId}/review`,
        method: 'POST',
        data: { status, admin_note: adminNote },
      });
      toast({ title: `Submission ${status}`, description: status === 'approved' ? 'Points awarded to user ✅' : 'Submission rejected' });
      loadData();
    } catch (error: any) {
      toast({ title: 'Review failed', description: error?.data?.detail || 'Failed to review submission', variant: 'destructive' });
    } finally { setReviewingId(null); }
  };

  const reviewActivity = async (activityId: number, status: 'approved' | 'rejected', approvedPoints?: number, adminNote?: string) => {
    setReviewingId(activityId);
    try {
      await client.apiCall.invoke({
        url: `/api/v1/admin/activities/${activityId}/review`,
        method: 'POST',
        data: { status, approved_points: approvedPoints, admin_note: adminNote },
      });
      toast({ title: `Activity ${status}`, description: status === 'approved' ? 'Activity published as challenge' : 'Activity rejected' });
      loadData();
    } catch (error: any) {
      toast({ title: 'Review failed', description: error?.data?.detail || 'Failed to review activity', variant: 'destructive' });
    } finally { setReviewingId(null); }
  };

  const getChallengeById = (id: number) => challenges.find(c => c.id === id);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">⏳ Pending</span>;
      case 'approved': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">✅ Approved</span>;
      case 'rejected': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">❌ Rejected</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">{status}</span>;
    }
  };

  const renderProofImage = (imageUrl: string | null | undefined) => {
    if (!imageUrl) {
      return (
        <div className="w-48 h-48 flex flex-col items-center justify-center rounded-lg border-2 border-gray-200 bg-gray-50 text-gray-400 flex-shrink-0">
          <ImageOff className="w-8 h-8 mb-2" />
          <span className="text-sm">No image</span>
        </div>
      );
    }
    if (imageUrl.startsWith('storage://')) {
      return (
        <div className="w-48 h-48 flex flex-col items-center justify-center rounded-lg border-2 border-blue-200 bg-blue-50 text-blue-500 text-xs text-center p-2 flex-shrink-0">
          <span className="text-2xl mb-1">🖼️</span>
          <span className="font-medium">Stored image</span>
          <span className="text-blue-400 mt-1 break-all text-xs">{imageUrl.replace('storage://', '')}</span>
        </div>
      );
    }
    return (
      <div className="w-48 h-48 flex-shrink-0 relative">
        <img
          src={imageUrl}
          alt="Proof"
          className="w-48 h-48 object-cover rounded-lg border-2"
          style={{ borderColor: 'var(--theme-accent-200)' }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent && !parent.querySelector('.img-fallback')) {
              const fallback = document.createElement('div');
              fallback.className = 'img-fallback w-48 h-48 flex flex-col items-center justify-center rounded-lg border-2 border-orange-200 bg-orange-50 text-orange-400 text-xs text-center p-2';
              fallback.innerHTML = '🕐<br/>URL expired';
              parent.appendChild(fallback);
            }
          }}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center theme-bg transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 theme-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-bg pb-20 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8" style={{ color: 'var(--theme-button-bg)' }} />
            <div>
              <h1 className="text-3xl font-bold theme-text">Admin Dashboard</h1>
              <p className="theme-text-muted">Review submissions and community activities</p>
            </div>
          </div>
          <button
            onClick={loadData}
            disabled={dataLoading}
            className="flex items-center gap-2 px-4 py-2 border rounded-xl transition-colors disabled:opacity-50 theme-card"
            style={{ color: 'var(--theme-accent-700)' }}
          >
            <RefreshCw className={`w-4 h-4 ${dataLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('submissions')}
            className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
              activeTab === 'submissions' ? 'text-white' : 'border theme-card theme-text'
            }`}
            style={activeTab === 'submissions' ? { backgroundColor: 'var(--theme-button-bg)' } : {}}
          >
            <Clock className="w-5 h-5 inline mr-2" />
            Submissions ({submissions.length})
          </button>
          <button
            onClick={() => setActiveTab('activities')}
            className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
              activeTab === 'activities' ? 'text-white' : 'border theme-card theme-text'
            }`}
            style={activeTab === 'activities' ? { backgroundColor: 'var(--theme-button-bg)' } : {}}
          >
            <Clock className="w-5 h-5 inline mr-2" />
            Activities ({activities.length})
          </button>
        </div>

        {/* Submissions filter toggle */}
        {activeTab === 'submissions' && (
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setShowAll(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !showAll ? 'bg-yellow-500 text-white' : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              ⏳ Pending Only
            </button>
            <button
              onClick={() => setShowAll(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showAll ? 'text-white' : 'bg-white text-gray-600 border border-gray-200'
              }`}
              style={showAll ? { backgroundColor: 'var(--theme-button-bg)' } : {}}
            >
              📋 All Submissions
            </button>
          </div>
        )}

        {dataLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--theme-button-bg)' }} />
            <span className="ml-2 theme-text-muted">Loading...</span>
          </div>
        )}

        {/* Submissions Tab */}
        {!dataLoading && activeTab === 'submissions' && (
          <div className="space-y-4">
            {submissions.length === 0 ? (
              <div className="rounded-2xl border p-8 text-center theme-card transition-colors duration-300">
                <p className="theme-text-muted text-lg">
                  {showAll ? 'No submissions found in the database yet' : 'No pending submissions'}
                </p>
                <p className="theme-text-muted text-sm mt-2">
                  {!showAll && 'Switch to "All Submissions" to see approved/rejected ones'}
                </p>
              </div>
            ) : (
              submissions.map((submission) => {
                const challenge = getChallengeById(submission.challenge_id);
                return (
                  <div key={submission.id} className="rounded-2xl border p-6 shadow-sm theme-card transition-colors duration-300">
                    <div className="flex gap-6">
                      {renderProofImage(submission.image_url)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-xl font-bold theme-text">
                            {challenge?.title || `Challenge #${submission.challenge_id}`}
                          </h3>
                          {getStatusBadge(submission.status)}
                        </div>
                        <p className="theme-text-muted mb-3 text-sm">{challenge?.description}</p>
                        <div className="grid grid-cols-2 gap-2 text-sm theme-text-muted mb-4">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <strong>User:</strong>&nbsp;{submission.user_display_name || submission.user_id}
                          </span>
                          <span><strong>Submission ID:</strong> #{submission.id}</span>
                          <span><strong>Submitted:</strong> {submission.submitted_at}</span>
                          <span className="text-amber-600 font-bold">⭐ {challenge?.points || '?'} points</span>
                          {submission.reviewed_at && <span><strong>Reviewed:</strong> {submission.reviewed_at}</span>}
                          {submission.admin_note && <span className="col-span-2 text-red-600"><strong>Note:</strong> {submission.admin_note}</span>}
                        </div>

                        {submission.status === 'pending' && (
                          <div className="flex gap-3">
                            <button
                              onClick={() => reviewSubmission(submission.id, 'approved')}
                              disabled={reviewingId === submission.id}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              {reviewingId === submission.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                const note = prompt('Reason for rejection (optional):');
                                reviewSubmission(submission.id, 'rejected', note || undefined);
                              }}
                              disabled={reviewingId === submission.id}
                              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                              <XCircle className="w-5 h-5" />
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Activities Tab */}
        {!dataLoading && activeTab === 'activities' && (
          <div className="space-y-4">
            {activities.length === 0 ? (
              <div className="rounded-2xl border p-8 text-center theme-card transition-colors duration-300">
                <p className="theme-text-muted">No pending activities</p>
              </div>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="rounded-2xl border p-6 shadow-sm theme-card transition-colors duration-300">
                  <div className="flex gap-6">
                    {activity.image_url && !activity.image_url.startsWith('storage://') ? (
                      <img
                        src={activity.image_url}
                        alt="Activity"
                        className="w-48 h-48 object-cover rounded-lg border-2 flex-shrink-0"
                        style={{ borderColor: 'var(--theme-accent-200)' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : null}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold theme-text mb-1">{activity.title}</h3>
                      <p className="text-sm mb-2 flex items-center gap-1" style={{ color: 'var(--theme-button-bg)' }}>
                        <User className="w-3 h-3" />
                        {activity.user_display_name || activity.user_id}
                      </p>
                      <p className="theme-text-muted mb-2">{activity.description}</p>
                      <div className="flex items-center gap-4 text-sm theme-text-muted mb-4">
                        <span>Category: {activity.category}</span>
                        <span>•</span>
                        <span>Suggested Points: {activity.suggested_points}</span>
                        <span>•</span>
                        <span>Created: {activity.created_at}</span>
                      </div>

                      <div className="flex gap-3 items-center">
                        <input
                          type="number"
                          id={`points-${activity.id}`}
                          defaultValue={activity.suggested_points}
                          min="5"
                          max="100"
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <button
                          onClick={() => {
                            const pointsInput = document.getElementById(`points-${activity.id}`) as HTMLInputElement;
                            const points = parseInt(pointsInput.value) || activity.suggested_points;
                            reviewActivity(activity.id, 'approved', points);
                          }}
                          disabled={reviewingId === activity.id}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {reviewingId === activity.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                          Approve & Publish
                        </button>
                        <button
                          onClick={() => {
                            const note = prompt('Reason for rejection (optional):');
                            reviewActivity(activity.id, 'rejected', undefined, note || undefined);
                          }}
                          disabled={reviewingId === activity.id}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-5 h-5" />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}