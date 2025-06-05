"use client";

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { EffectAnimationItem } from './GameScreen'; // Assuming type is exported or moved

interface StatDeltaAnimationProps {
  animationItem: EffectAnimationItem;
  onComplete: (id: string) => void;
  customPositionStyle?: React.CSSProperties; // New optional prop
}

const StatDeltaAnimation: React.FC<StatDeltaAnimationProps> = ({ animationItem, onComplete, customPositionStyle }) => {
  const { id, metric, value, isPercent, displayPercentValue } = animationItem;

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete(id);
    }, 1000); // Animation duration + a little buffer, adjust as needed
    return () => clearTimeout(timer);
  }, [id, onComplete]);

  let text = '';
  let color = 'text-green-400'; // Default to green for positive

  if (value < 0) {
    color = 'text-red-400';
  } else if (value === 0 && metric !== 'customerRating') { // For financial, 0 change might not need specific color unless it was a forced 0
     color = 'text-gray-400';
  }


  const sign = value > 0 ? '+' : (value < 0 ? '' : ''); // No sign for 0 unless it's rating

  if (metric === 'customerRating') {
    text = `${sign}${value}pts`;
     if (value === 0) text = `${value}pts`; // Show "0pts" explicitly
  } else if (isPercent) {
    text = `${sign}${displayPercentValue}% (${value.toLocaleString()})`;
  } else {
    text = `${sign}${value.toLocaleString()}`;
  }
  
  // For cash, revenue, expenses, might want to prefix with $ if not percentage
  if (['cash', 'revenue', 'expenses'].includes(metric) && !isPercent) {
     text = `${sign}$${Math.abs(value).toLocaleString()}`;
     if (value < 0) text = `-${sign}$${Math.abs(value).toLocaleString()}`;
  }


  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`absolute text-sm font-semibold whitespace-nowrap px-1.5 py-0.5 rounded bg-slate-800 bg-opacity-80 shadow-lg ${color}`}
      style={customPositionStyle ? customPositionStyle : { top: '0.25rem', right: '0.25rem', zIndex: 10 } }
    >
      {text}
    </motion.div>
  );
};

export default StatDeltaAnimation; 