import React from 'react';

import I from '../assets/gaelic-faces/I.svg';
import O from '../assets/gaelic-faces/O.svg';
import T from '../assets/gaelic-faces/T.svg';
import S from '../assets/gaelic-faces/S.svg';
import Z from '../assets/gaelic-faces/Z.svg';
import J from '../assets/gaelic-faces/J.svg';
import L from '../assets/gaelic-faces/L.svg';

const faceSvgs: Record<string, string> = { I, O, T, S, Z, J, L };

export function GaelicFace({ type, className = '' }: { type: string; className?: string }) {
  const src = faceSvgs[type];
  if (!src) return null;
  return <img src={src} alt={`Gaelic face ${type}`} className={className} draggable={false} />;
}
