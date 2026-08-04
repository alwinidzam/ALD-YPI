import React, { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';

export const LiveClock: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const shortDays = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const fullMonths = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const formattedDate = `${shortDays[currentTime.getDay()]}, ${currentTime.getDate()} ${fullMonths[currentTime.getMonth()]} ${currentTime.getFullYear()}`;
  const formattedTime = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/:/g, '.');

  return (
    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-[11px] font-semibold">
      <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-white border border-white/20 shadow-inner">
        <Clock className="w-3.5 h-3.5 text-[#ffc107]" />
        <span className="tracking-wide">
          {formattedTime} WIB
        </span>
      </div>
      <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-white border border-white/20 shadow-inner">
        <Calendar className="w-3.5 h-3.5 text-[#ffc107]" />
        <span className="tracking-wide">
          {formattedDate}
        </span>
      </div>
    </div>
  );
};
