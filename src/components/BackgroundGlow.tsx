import React from 'react';

export const BackgroundGlow: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {/* Deep pure pitch black base */}
      <div className="absolute inset-0 bg-black" />

      {/* Neon Gold glowing orb (top-center) */}
      <div 
        className="absolute -top-[10%] left-[15%] w-[420px] md:w-[680px] h-[420px] md:h-[680px] rounded-full bg-amber-400/[0.12] blur-[140px] md:blur-[200px] animate-drift-1" 
      />

      {/* Warm Golden glowing orb (top-right / mid) */}
      <div 
        className="absolute top-[22%] -right-[5%] w-[360px] md:w-[600px] h-[360px] md:h-[600px] rounded-full bg-yellow-400/[0.09] blur-[130px] md:blur-[190px] animate-drift-2" 
      />

      {/* Amber glowing orb (mid / bottom-left) */}
      <div 
        className="absolute top-[58%] left-[10%] w-[380px] md:w-[580px] h-[380px] md:h-[580px] rounded-full bg-amber-500/[0.08] blur-[140px] md:blur-[200px] animate-drift-3" 
      />

      {/* Secondary gold accent orb for deep scrolling */}
      <div 
        className="absolute top-[85%] right-[20%] w-[340px] md:w-[520px] h-[340px] md:h-[520px] rounded-full bg-yellow-500/[0.07] blur-[150px] md:blur-[210px] animate-drift-1" 
      />

      {/* Pitch black radial vignette to keep focus and high contrast */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]" />
    </div>
  );
};

