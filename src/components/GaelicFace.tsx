import React from 'react';

const faceSvgs: Record<string, string> = {
  I: new URL('../assets/gaelic-faces/I.svg', import.meta.url).href,
  O: new URL('../assets/gaelic-faces/O.svg', import.meta.url).href,
  T: new URL('../assets/gaelic-faces/T.svg', import.meta.url).href,
  S: new URL('../assets/gaelic-faces/S.svg', import.meta.url).href,
  Z: new URL('../assets/gaelic-faces/Z.svg', import.meta.url).href,
  J: new URL('../assets/gaelic-faces/J.svg', import.meta.url).href,
  L: new URL('../assets/gaelic-faces/L.svg', import.meta.url).href,
};

export function GaelicFace({ type, className = '' }: { type: string; className?: string }) {
  const src = faceSvgs[type];
  if (!src) return null;
  return <img src={src} alt={`Gaelic face ${type}`} className={className} draggable={false} />;
}
