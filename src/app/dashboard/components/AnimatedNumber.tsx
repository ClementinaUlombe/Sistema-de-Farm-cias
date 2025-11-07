'use client';

import React, { useEffect, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  formatter: (value: number) => string;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, formatter }) => {
  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;

    const duration = 1500; // 1.5 segundos
    const increment = end / (duration / 10);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        start = end;
        clearInterval(timer);
      }
      setCurrentValue(start);
    }, 10);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{formatter(currentValue)}</span>;
};

export default AnimatedNumber;
