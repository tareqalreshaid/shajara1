import { getStatusLevel } from '@/lib/api';

interface StatusBadgeProps {
  points: number;
}

export default function StatusBadge({ points }: StatusBadgeProps) {
  const { level, emoji } = getStatusLevel(points);

  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50">
      <span className="text-2xl">{emoji}</span>
      <span className="font-semibold text-emerald-600">{level}</span>
    </div>
  );
}