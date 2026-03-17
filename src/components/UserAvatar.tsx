interface UserAvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function UserAvatar({ src, alt = 'User', size = 'md', className = '' }: UserAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-20 h-20',
    xl: 'w-24 h-24',
  };

  const defaultAvatar = 'https://mgx-backend-cdn.metadl.com/generate/images/965188/2026-02-11/9d031ff3-807b-4fc8-8099-db475ca99f2a.png';

  return (
    <img
      src={src || defaultAvatar}
      alt={alt}
      className={`${sizeClasses[size]} rounded-full object-cover border-2 border-emerald-200 ${className}`}
    />
  );
}