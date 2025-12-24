import React, { useState, useEffect } from 'react';

interface DiscountTimerProps {
  endDate: string;
  onTimerEnd?: () => void;
  className?: string;
}

const formatDate = (date: Date): string => {
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const DiscountTimer: React.FC<DiscountTimerProps> = ({ endDate, onTimerEnd, className = '' }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [hasEnded, setHasEnded] = useState(false);
  const [endDateTime, setEndDateTime] = useState('');

  useEffect(() => {
    const end = new Date(endDate);
    setEndDateTime(formatDate(end));
    
    const updateTimer = () => {
      const now = new Date();
      const difference = end.getTime() - now.getTime();

      if (difference <= 0) {
        setHasEnded(true);
        if (onTimerEnd) onTimerEnd();
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      
      if (days > 0) {
        setTimeLeft(`Скидка заканчивается через ${days} д. ${hours} ч.`);
      } else if (hours > 0) {
        setTimeLeft(`Скидка заканчивается через ${hours} ч. ${minutes} мин.`);
      } else if (minutes > 0) {
        setTimeLeft(`Скидка заканчивается через ${minutes} мин.`);
      } else {
        setTimeLeft('Скидка заканчивается!');
      }
    };

    // Update immediately
    updateTimer();
    
    // Then update every minute
    const timer = setInterval(updateTimer, 60000);
    
    return () => clearInterval(timer);
  }, [endDate, onTimerEnd]);

  if (hasEnded) return null;

  return (
    <div className={`text-center text-sm text-red-600 ${className}`}>
      <span className={`font-medium`}>
        {hasEnded ? 'Завершено' : timeLeft}
      </span>
      <div className="text-xs text-gray-600 mt-1">Действует до: {endDateTime}</div>
    </div>
  );
};

export default DiscountTimer;
