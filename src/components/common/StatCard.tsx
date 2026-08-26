import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: string;
  color?: 'blue' | 'emerald' | 'indigo' | 'amber' | 'purple' | 'rose';
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'blue',
  onClick
}: StatCardProps) {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50/80 text-blue-700 border-blue-100',
      iconBg: 'bg-blue-600 text-white',
      accent: 'text-blue-700'
    },
    emerald: {
      bg: 'bg-emerald-50/80 text-emerald-700 border-emerald-100',
      iconBg: 'bg-emerald-600 text-white',
      accent: 'text-emerald-700'
    },
    indigo: {
      bg: 'bg-indigo-50/80 text-indigo-700 border-indigo-100',
      iconBg: 'bg-indigo-600 text-white',
      accent: 'text-indigo-700'
    },
    amber: {
      bg: 'bg-amber-50/80 text-amber-800 border-amber-100',
      iconBg: 'bg-amber-600 text-white',
      accent: 'text-amber-700'
    },
    purple: {
      bg: 'bg-purple-50/80 text-purple-700 border-purple-100',
      iconBg: 'bg-purple-600 text-white',
      accent: 'text-purple-700'
    },
    rose: {
      bg: 'bg-rose-50/80 text-rose-700 border-rose-100',
      iconBg: 'bg-rose-600 text-white',
      accent: 'text-rose-700'
    },
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div
      onClick={onClick}
      className={`bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all ${
        onClick ? 'cursor-pointer hover:border-blue-300' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <h4 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
            {value}
          </h4>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          {trend && (
            <p className="text-xs font-medium text-emerald-600 mt-2 flex items-center gap-1">
              <span>↑</span> {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${scheme.iconBg} shadow-sm shrink-0`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
