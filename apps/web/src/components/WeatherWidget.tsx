'use client';

import React, { useEffect, useState } from 'react';

export const WeatherWidget: React.FC<{ isHome?: boolean }> = () => {
  const [temp, setTemp] = useState<number | null>(22);
  const [city, setCity] = useState<string>('SÃO JOSÉ DO RIO PRETO');

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number, name?: string) => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
        const r = await fetch(url);
        const j = await r.json();
        const cw = j?.current_weather || {};
        if (typeof cw.temperature === 'number') {
          setTemp(Math.round(cw.temperature));
        }
        if (name) setCity(name.toUpperCase());
      } catch {
        // Fallback default
        setTemp(22);
        setCity('SÃO JOSÉ DO RIO PRETO');
      }
    };

    // Default to São José do Rio Preto coordinates
    fetchWeather(-20.811, -49.376, 'SÃO JOSÉ DO RIO PRETO');
  }, []);

  return (
    <div className="flex items-center gap-2 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-700/60 px-3.5 py-1 rounded-lg text-xs transition-colors shadow-sm cursor-default">
      <span className="font-bold text-slate-200 tracking-wider text-[11px]">
        {city}
      </span>
      <span className="bg-slate-800 text-teal-400 font-extrabold px-1.5 py-0.5 rounded text-[11px] border border-slate-700/50">
        {temp !== null ? `${temp}°C` : '22°C'}
      </span>
    </div>
  );
};
