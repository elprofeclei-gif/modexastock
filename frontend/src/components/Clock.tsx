import { useState, useEffect } from 'react';

export default function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="hidden lg:block text-right">
      <p className="text-sm font-medium text-slate-900 dark:text-white capitalize">
        {formatDate(time)}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{formatTime(time)}</p>
    </div>
    
  );
}
