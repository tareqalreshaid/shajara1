import { Sparkles } from 'lucide-react';

interface PointsDisplayProps {
  points: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function PointsDisplay({ points, size = 'md' }: PointsDisplayProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <div className="inline-flex items-center gap-2">
      <Sparkles className="w-5 h-5 text-amber-500" />
      <span className={`font-bold text-emerald-600 ${sizeClasses[size]}`}>
        {points.toLocaleString()}
      </span>
      <span className="text-sm text-gray-500">points</span>
    </div>
  );
}