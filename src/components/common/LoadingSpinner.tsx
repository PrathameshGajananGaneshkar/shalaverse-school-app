import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({ label = 'Loading...', size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 gap-3">
      <Loader2 className={`${sizeClasses[size]} text-blue-700 animate-spin`} />
      {label && <p className="text-sm font-medium text-slate-600">{label}</p>}
    </div>
  );
}
