import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { client, Challenge, getOrCreateUserProfile, getBackendToken } from '@/lib/api';
import { Camera, Upload, ArrowLeft, Loader2, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ChallengeSubmission() {
  const { challengeId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkAuth();
    loadChallenge();
  }, [challengeId]);

  const checkAuth = async () => {
    try {
      const userResponse = await client.auth.me();
      if (userResponse.data) {
        setUser(userResponse.data);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('[ChallengeSubmission] Auth check failed:', error);
      setUser(null);
    } finally {
      setAuthChecked(true);
    }
  };

  const loadChallenge = async () => {
    try {
      const response = await client.entities.challenges.get({ id: challengeId! });
      setChallenge(response.data);
    } catch (error) {
      console.error('Error loading challenge:', error);
      toast({ title: 'Error', description: 'Failed to load challenge details', variant: 'destructive' });
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: 'File too large', description: 'Please select an image under 10MB', variant: 'destructive' });
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => { setImagePreview(reader.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!user || !challenge || !imageFile) {
      toast({ title: 'Missing information', description: !imageFile ? 'Please upload a proof image' : 'Please wait for the page to load', variant: 'destructive' });
      return;
    }

    setSubmitting(true);

    try {
      const backendToken = getBackendToken();
      if (!backendToken) throw new Error('Unable to authenticate. Please log out and log in again.');

      // Check existing submissions
      try {
        const existingResponse = await client.entities.submissions.query({ query: { challenge_id: parseInt(challengeId!) }, limit: 10 });
        const hasPendingOrApproved = existingResponse.data?.items?.some((sub: any) => sub.status === 'pending' || sub.status === 'approved');
        if (hasPendingOrApproved) {
          toast({ title: 'Already submitted', description: 'You have already submitted this challenge', variant: 'destructive' });
          setSubmitting(false);
          return;
        }
      } catch { /* non-fatal */ }

      // Upload image
      let imageRef = '';
      setUploading(true);
      const bucketName = 'challenge-proofs';
      const objectKey = `${user.id}/${Date.now()}_${imageFile.name}`;
      try {
        await client.storage.upload({ bucket_name: bucketName, object_key: objectKey, file: imageFile });
        imageRef = `storage://${bucketName}/${objectKey}`;
      } catch {
        imageRef = '';
        toast({ title: 'Image upload failed', description: 'Submission will be recorded without an image.', variant: 'destructive' });
      }
      setUploading(false);

      const submissionTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
      await client.entities.submissions.create({
        data: { challenge_id: parseInt(challengeId!), image_url: imageRef, status: 'pending', submitted_at: submissionTime },
      });

      try {
        const userProfile = await getOrCreateUserProfile(user.id, user.email?.split('@')[0] || 'User');
        await client.apiCall.invoke({
          url: '/api/v1/email/send_submission_notification',
          method: 'POST',
          data: { user_name: userProfile?.name || user.email, user_email: user.email, challenge_title: challenge.title, submission_time: submissionTime, image_url: imageRef },
        });
      } catch { /* non-fatal */ }

      toast({ title: 'Submission sent! ✅', description: 'Your submission has been sent for verification.' });
      setTimeout(() => navigate('/challenges'), 2000);
    } catch (error: any) {
      const detail = error?.data?.detail || error?.response?.data?.detail || error?.message || 'Failed to submit challenge.';
      toast({ title: 'Submission failed', description: detail, variant: 'destructive' });
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  if (!challenge) {
    return (
      <div className="min-h-screen flex items-center justify-center theme-bg transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 theme-spinner"></div>
      </div>
    );
  }

  if (authChecked && !user) {
    return (
      <div className="min-h-screen theme-bg flex items-center justify-center px-4 transition-colors duration-300">
        <div className="rounded-2xl border p-8 shadow-sm max-w-md w-full text-center theme-card transition-colors duration-300">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--theme-accent-100)' }}>
            <LogIn className="w-8 h-8" style={{ color: 'var(--theme-button-bg)' }} />
          </div>
          <h2 className="text-2xl font-bold theme-text mb-2">Login Required</h2>
          <p className="theme-text-muted mb-2">You need to be logged in to submit a challenge.</p>
          <p className="theme-text-muted text-sm mb-6">Challenge: <strong>{challenge.title}</strong></p>
          <button onClick={() => client.auth.toLogin()} className="w-full py-3 theme-btn rounded-xl font-semibold transition-colors flex items-center justify-center gap-2">
            <LogIn className="w-5 h-5" /> Log In to Submit
          </button>
          <button onClick={() => navigate('/challenges')} className="w-full mt-3 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
            Back to Challenges
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-bg pb-20 transition-colors duration-300">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <button onClick={() => navigate('/challenges')} className="flex items-center gap-2 mb-6 transition-colors" style={{ color: 'var(--theme-button-bg)' }}>
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Challenges</span>
        </button>

        <div className="rounded-2xl border p-6 shadow-sm mb-6 theme-card transition-colors duration-300">
          <h1 className="text-2xl font-bold theme-text mb-2">{challenge.title}</h1>
          <p className="theme-text-muted mb-4">{challenge.description}</p>

          <div className="rounded-xl p-4 mb-6 border" style={{ backgroundColor: 'var(--theme-accent-50)', borderColor: 'var(--theme-accent-200)' }}>
            <h3 className="font-semibold mb-2" style={{ color: 'var(--theme-primary)' }}>📸 Proof Required</h3>
            <p className="text-sm" style={{ color: 'var(--theme-accent-700)' }}>
              Please upload a clear photo showing that you've completed this challenge.
            </p>
          </div>

          <div className="flex items-center justify-between mb-6">
            <span className="text-amber-600 font-bold text-lg">⭐ {challenge.points} points</span>
            <span className="px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: 'var(--theme-accent-100)', color: 'var(--theme-accent-700)' }}>
              {challenge.challenge_type}
            </span>
          </div>

          {user && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
              Submitting as: <strong>{user.email}</strong>
            </div>
          )}
        </div>

        <div className="rounded-2xl border p-6 shadow-sm theme-card transition-colors duration-300">
          <h2 className="text-xl font-bold theme-text mb-4">Upload Proof Image</h2>

          {!imagePreview ? (
            <label className="block cursor-pointer">
              <input type="file" accept="image/*" capture="environment" onChange={handleImageSelect} className="hidden" />
              <div className="border-2 border-dashed rounded-xl p-12 text-center transition-colors" style={{ borderColor: 'var(--theme-accent-200)' }}>
                <Camera className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--theme-button-bg)' }} />
                <p className="theme-text font-medium mb-2">Take a photo or upload from gallery</p>
                <p className="text-sm theme-text-muted">Max file size: 10MB</p>
              </div>
            </label>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="w-full h-64 object-cover rounded-xl border-2" style={{ borderColor: 'var(--theme-accent-200)' }} />
                <button onClick={() => { setImageFile(null); setImagePreview(''); }} className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600 transition-colors">
                  Remove
                </button>
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting || uploading}
                className="w-full py-4 theme-btn rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (<><Loader2 className="w-5 h-5 animate-spin" /> Uploading image...</>) :
                 submitting ? (<><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>) :
                 (<><Upload className="w-5 h-5" /> Submit for Verification</>)}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}