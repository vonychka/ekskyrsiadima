import React from 'react';
import heroBg from '../public/images/hero-bg.png';

const HeroBackground: React.FC = () => {
  return (
    <div 
      className="absolute inset-0"
      style={{
        backgroundImage: `url(${heroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 1,
      }}
    />
  );
};

export default HeroBackground;
