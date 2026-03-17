import { useNavigate } from 'react-router-dom';
import { Challenge } from '@/lib/api';
import { Trophy, Clock, Zap } from 'lucide-react';

interface ChallengeCardProps {
  challenge: Challenge;
  onComplete?: () => void;
  userSubmissions?: any[];
}

export default function ChallengeCard({ challenge, onComplete, userSubmissions = [] }: ChallengeCardProps) {
  const navigate = useNavigate();

  const submission = userSubmissions.find((sub: any) => sub.challenge_id === challenge.id);
  const isCompleted = submission?.status === 'approved';
  const isPending = submission?.status === 'pending';
  const isRejected = submission?.status === 'rejected';

  const getTypeIcon = () => {
    switch (challenge.challenge_type) {
      case 'daily': return <Clock className="w-4 h-4" />;
      case 'special': return <Trophy className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  const getTypeBadgeColor = () => {
    switch (challenge.challenge_type) {
      case 'daily': return 'bg-blue-100 text-blue-700';
      case 'special': return 'bg-amber-100 text-amber-700';
      default: return 'bg-emerald-100 text-emerald-700';
    }
  };

  const getStatusBadge = () => {
    if (isCompleted) {
      return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">✓ Approved</span>;
    }
    if (isPending) {
      return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium flex items-center gap-1">🟡 Pending Review</span>;
    }
    if (isRejected) {
      return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium flex items-center gap-1">🔴 Rejected</span>;
    }
    return null;
  };

  const handleButtonClick = () => {
    if (isCompleted || isPending) return;
    navigate(`/challenge/${challenge.id}/submit`);
  };

  const getButtonText = () => {
    if (isCompleted) return 'Completed ✓';
    if (isPending) return 'Under Review';
    if (isRejected) return 'Resubmit';
    return 'Complete Challenge';
  };

  const getButtonClasses = () => {
    if (isCompleted) return 'bg-gray-300 text-gray-500 cursor-not-allowed';
    if (isPending) return 'bg-yellow-500 text-white cursor-not-allowed';
    if (isRejected) return 'bg-red-600 text-white hover:bg-red-700';
    return 'bg-emerald-600 text-white hover:bg-emerald-700';
  };

  return (
    <div className="bg-white rounded-2xl border border-emerald-100 p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getTypeBadgeColor()}`}>
          {getTypeIcon()}
          {challenge.challenge_type}
        </span>
        {getStatusBadge()}
      </div>

      <h3 className="text-lg font-bold text-gray-900 mb-2">{challenge.title}</h3>
      <p className="text-sm text-gray-500 mb-4 line-clamp-2">{challenge.description}</p>

      {isRejected && submission?.admin_note && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-700">
            <strong>Reason:</strong> {submission.admin_note}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-amber-600 font-bold flex items-center gap-1">
          ⭐ {challenge.points} points
        </span>
        <button
          onClick={handleButtonClick}
          disabled={isCompleted || isPending}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${getButtonClasses()}`}
        >
          {getButtonText()}
        </button>
      </div>
    </div>
  );
}