import React from 'react';

export interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  subtext?: string;
  subtextColor?: string;
  isPrivacyMode?: boolean;
  color?: 'teal' | 'blue' | 'emerald' | 'rose' | 'amber' | 'indigo' | 'slate' | string;
}

const colorBadgeMap: Record<string, { bg: string; text: string; border: string }> = {
  teal: {
    bg: 'bg-teal-50 dark:bg-teal-950/40',
    text: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-200 dark:border-teal-800/60',
  },
  blue: {
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    text: 'text-sky-600 dark:text-sky-400',
    border: 'border-sky-200 dark:border-sky-800/60',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800/60',
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-800/60',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800/60',
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-200 dark:border-indigo-800/60',
  },
  slate: {
    bg: 'bg-slate-50 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-700',
  },
};

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  icon,
  subtext,
  subtextColor,
  isPrivacyMode = false,
  color = 'teal',
}) => {
  const badgeStyle = colorBadgeMap[color] || colorBadgeMap.teal;

  return (
    <div
      role="group"
      aria-label={title}
      className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 flex flex-col justify-between min-h-[6.5rem] group"
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
          {title}
        </span>
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 transition-transform duration-200 group-hover:scale-105 ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
        >
          {React.isValidElement(icon)
            ? React.cloneElement(icon as React.ReactElement<any>, { className: 'w-4 h-4' })
            : icon}
        </div>
      </div>

      <div className="space-y-0.5">
        <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight tabular-nums truncate">
          {isPrivacyMode ? '••••••' : value}
        </p>

        {subtext && (
          <p
            className={`text-xs font-medium truncate ${
              subtextColor || 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
};
