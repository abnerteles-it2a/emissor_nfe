'use client';

import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export const CalendarWidget: React.FC<{ isSidebar?: boolean }> = ({ isSidebar = true }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthLabel = currentDate.toLocaleDateString('pt-BR', {
    month: 'short',
    year: 'numeric',
  }).toUpperCase().replace('.', '');

  const dayOfWeek = currentDate.toLocaleDateString('pt-BR', { weekday: 'long' });
  const dayNumber = currentDate.getDate();

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 shadow-md backdrop-blur-sm space-y-2">
      {/* Top month switcher */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={prevMonth}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Mês anterior"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-slate-200 uppercase">
          <span>{monthLabel}</span>
          <CalendarIcon className="w-3.5 h-3.5 text-brand-400" />
        </div>

        <button
          onClick={nextMonth}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Próximo mês"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Day Card */}
      <button
        onClick={() => {}}
        className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 flex flex-col items-center gap-1 hover:bg-slate-800/90 transition-all group cursor-pointer shadow-inner"
      >
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-indigo-400">
          HOJE
        </span>
        <div className="flex flex-col items-center my-0.5">
          <span className="text-3xl font-black text-white leading-none tracking-tight">
            {dayNumber}
          </span>
          <span className="text-[11px] font-medium text-slate-400 capitalize mt-1">
            {dayOfWeek}
          </span>
        </div>
      </button>

      <p className="text-center text-[9px] text-slate-500 italic">
        Toque para ver detalhes
      </p>
    </div>
  );
};
