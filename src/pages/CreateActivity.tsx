import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { client, getBackendToken } from '@/lib/api';
import { ArrowLeft, Upload, Loader2, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CreateActivity() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    suggested_points: 10,
    category: 'recycling',
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userResponse = await client.auth.me();
      if (userResponse.data) setUser(userResponse.data);
      else setUser(null);
    } catch {
      setUser(null);
    } finally {
      setAuthChecked(true);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast({ title: 'Authentication required', description: 'Please sign in', variant: 'destructive' }); return; }
    if (!formData.title.trim() || !formData.description.trim()) { toast({ title: 'Missing information', description: 'Please fill in all required fields', variant: 'destructive' }); return; }

    const backendToken = getBackendToken();
    if (!backendToken) { toast({ title: 'Session expired', description: 'Please log out and log in again.', variant: 'destructive' }); return; }

    setSubmitting(true);
    try {
      let imageRef = '';
      if (imageFile) {
        const bucketName = 'activity-images';
        const objectKey = `${user.id}/${Date.now()}_${imageFile.name}`;
        try {
          await client.storage.upload({ bucket_name: bucketName, object_key: objectKey, file: imageFile });
          imageRef = `storage://${bucketName}/${objectKey}`;
        } catch {
          toast({ title: 'Image upload failed', description: 'Activity will be submitted without an image.', variant: 'destructive' });
        }
      }

      const submissionTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
      await client.entities.community_activities.create({
        data: { title: formData.title, description: formData.description, suggested_points: formData.suggested_points, category: formData.category, image_url: imageRef, status: 'pending', created_at: submissionTime },
      });

      toast({ title: 'Activity submitted! ✅', description: "Your activity has been submitted for admin review." });
      setTimeout(() => navigate('/challenges'), 2000);
    } catch (error: any) {
      const detail = error?.data?.detail || error?.response?.data?.detail || error?.message || 'Failed to submit activity.';
      toast({ title: 'Submission failed', description: detail, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center theme-bg transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 theme-spinner"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen theme-bg flex items-center justify-center px-4 transition-colors duration-300">
        <div className="rounded-2xl border p-8 shadow-sm max-w-md w-full text-center theme-card transition-colors duration-300">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--theme-accent-100)' }}>
            <LogIn className="w-8 h-8" style={{ color: 'var(--theme-button-bg)' }} />
          </div>
          <h2 className="text-2xl font-bold theme-text mb-2">Login Required</h2>
          <p className="theme-text-muted mb-6">You need to be logged in to create an activity.</p>
          <button onClick={() => client.auth.toLogin()} className="w-full py-3 theme-btn rounded-xl font-semibold transition-colors flex items-center justify-center gap-2">
            <LogIn className="w-5 h-5" /> Log In
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
          <h1 className="text-2xl font-bold theme-text mb-2">Create a Sustainable Activity</h1>
          <p className="theme-text-muted mb-4">
            Share your eco-friendly activity idea! If approved, it will become a public challenge and you'll earn 30 bonus points plus the "Eco Creator" badge! 🌱
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700 mb-4">
            Submitting as: <strong>{user.email}</strong>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium theme-text mb-2">Activity Title *</label>
              <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Plant a Tree in Your Community" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent" style={{ borderColor: 'var(--theme-card-border)', color: 'var(--theme-text)' }} required />
            </div>

            <div>
              <label className="block text-sm font-medium theme-text mb-2">Description *</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe the activity..." rows={4} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent" style={{ borderColor: 'var(--theme-card-border)', color: 'var(--theme-text)' }} required />
            </div>

            <div>
              <label className="block text-sm font-medium theme-text mb-2">Category *</label>
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent" style={{ borderColor: 'var(--theme-card-border)', color: 'var(--theme-text)' }}>
                <option value="recycling">Recycling</option>
                <option value="energy">Energy Conservation</option>
                <option value="water">Water Conservation</option>
                <option value="transportation">Sustainable Transportation</option>
                <option value="food">Sustainable Food</option>
                <option value="nature">Nature & Wildlife</option>
                <option value="community">Community Action</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium theme-text mb-2">Suggested Points *</label>
              <input type="number" value={formData.suggested_points} onChange={(e) => setFormData({ ...formData, suggested_points: parseInt(e.target.value) || 10 })} min="5" max="100" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent" style={{ borderColor: 'var(--theme-card-border)', color: 'var(--theme-text)' }} required />
              <p className="text-xs theme-text-muted mt-1">Admin may adjust this value</p>
            </div>

            <div>
              <label className="block text-sm font-medium theme-text mb-2">Activity Image (Optional)</label>
              {!imagePreview ? (
                <label className="block cursor-pointer">
                  <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                  <div className="border-2 border-dashed rounded-lg p-8 text-center transition-colors" style={{ borderColor: 'var(--theme-card-border)' }}>
                    <Upload className="w-12 h-12 mx-auto mb-2 theme-text-muted" />
                    <p className="text-sm theme-text-muted">Click to upload an image</p>
                    <p className="text-xs theme-text-muted">Max file size: 10MB</p>
                  </div>
                </label>
              ) : (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg border-2" style={{ borderColor: 'var(--theme-accent-200)' }} />
                  <button type="button" onClick={() => { setImageFile(null); setImagePreview(''); }} className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600 transition-colors">
                    Remove
                  </button>
                </div>
              )}
            </div>

            <button type="submit" disabled={submitting} className="w-full py-3 theme-btn rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {submitting ? (<><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>) : 'Submit Activity for Review'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}