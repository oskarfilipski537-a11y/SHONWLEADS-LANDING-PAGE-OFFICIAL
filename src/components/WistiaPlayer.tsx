import React, { useEffect, useRef } from 'react';

interface WistiaPlayerProps {
  mediaId: string;
  aspect?: string;
}

export const WistiaPlayer: React.FC<WistiaPlayerProps> = ({
  mediaId,
  aspect = '1.7777777777777777',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Ensure wistia base player script is present
    const playerScriptId = 'wistia-player-base-script';
    if (!document.getElementById(playerScriptId)) {
      const script = document.createElement('script');
      script.id = playerScriptId;
      script.src = 'https://fast.wistia.com/player.js';
      script.async = true;
      document.head.appendChild(script);
    }

    // 2. Ensure media-specific embed script is present
    const embedScriptId = `wistia-embed-script-${mediaId}`;
    if (!document.getElementById(embedScriptId)) {
      const script = document.createElement('script');
      script.id = embedScriptId;
      script.src = `https://fast.wistia.com/embed/${mediaId}.js`;
      script.async = true;
      script.type = 'module';
      document.head.appendChild(script);
    }

    // 3. Ensure swatch fallback styling is present
    const styleId = `wistia-swatch-style-${mediaId}`;
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `wistia-player[media-id='${mediaId}']:not(:defined) { background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/${mediaId}/swatch'); display: block; filter: blur(5px); padding-top:56.25%; }`;
      document.head.appendChild(style);
    }

    // 4. Inject wistia-player custom element
    if (containerRef.current) {
      containerRef.current.innerHTML = `
        <wistia-player 
          media-id="${mediaId}" 
          aspect="${aspect}" 
          style="width: 100%; height: 100%; display: block;"
        ></wistia-player>
      `;
    }
  }, [mediaId, aspect]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden rounded-xl bg-neutral-950 flex items-center justify-center"
      style={{ minHeight: '100%' }}
    />
  );
};
