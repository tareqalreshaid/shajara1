import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/contexts/ThemeContext';
import Home from '@/pages/Home';
import Social from '@/pages/Social';
import Challenges from '@/pages/Challenges';
import Profile from '@/pages/Profile';
import AuthCallback from '@/pages/AuthCallback';
import ChallengeSubmission from '@/pages/ChallengeSubmission';
import CreateActivity from '@/pages/CreateActivity';
import AdminDashboard from '@/pages/AdminDashboard';
import ProgressMap from '@/pages/ProgressMap';
import EcoThemes from '@/pages/EcoThemes';
import AvatarSelect from '@/pages/AvatarSelect';
import AvatarCustomize from '@/pages/AvatarCustomize';
import BottomNav from '@/components/BottomNav';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/social" element={<Social />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/challenge/:challengeId/submit" element={<ChallengeSubmission />} />
            <Route path="/create-activity" element={<CreateActivity />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/map" element={<ProgressMap />} />
            <Route path="/eco-themes" element={<EcoThemes />} />
            <Route path="/avatar-select" element={<AvatarSelect />} />
            <Route path="/avatar-customize" element={<AvatarCustomize />} />
          </Routes>
          <BottomNav />
          <Toaster />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;