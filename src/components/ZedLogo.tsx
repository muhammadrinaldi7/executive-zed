import React from 'react';

interface ZedLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  withGlow?: boolean;
  className?: string;
  animate?: boolean;
}

export const ZedLogo: React.FC<ZedLogoProps> = ({
  size = 'md',
  withGlow = false,
  className = '',
  animate = false,
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 rounded-md',
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-9 h-9 rounded-xl',
    lg: 'w-14 h-14 sm:w-16 sm:h-16 rounded-2xl',
    xl: 'w-20 h-20 sm:w-24 sm:h-24 rounded-3xl',
  };

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      {withGlow && (
        <div
          className={`absolute -inset-1.5 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-400 opacity-40 blur-md pointer-events-none ${
            animate ? 'animate-pulse' : ''
          }`}
        />
      )}
      <img
        src="/favicon.svg"
        alt="ZED Executive Logo"
        className={`relative ${sizeClasses[size]} object-contain shadow-md shadow-indigo-950/50 border border-slate-800/80 bg-slate-950/90 transition-transform duration-300 hover:scale-105`}
      />
    </div>
  );
};
