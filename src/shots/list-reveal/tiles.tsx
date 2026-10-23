// The four step icons for StepsListReveal: a 96px brand-red tile with the product icon in white.
// Paths are the product's own (see PORT-SPEC "Product icons").
import React from 'react';
import { SPARK } from '../../kit/parts';

const stroke = (w: number) => ({
  fill: 'none',
  stroke: '#fff',
  strokeWidth: w,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export const StepTile: React.FC<{ children: React.ReactNode; size?: number }> = ({ children, size = 96 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '28%',
      background: '#E8293B',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.22), 0 14px 30px -14px rgba(0,0,0,0.8)',
    }}
  >
    {children}
  </div>
);

const S = 46;

export const SparkIcon: React.FC = () => (
  <svg width={S} height={S} viewBox="0 0 24 24">
    <path d={SPARK} fill="#fff" />
  </svg>
);

export const BriefcaseIcon: React.FC = () => (
  <svg width={S} height={S} viewBox="0 0 24 24">
    <path d="M12 12h.01" {...stroke(2.1)} />
    <path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" {...stroke(2.1)} />
    <path d="M22 13a18.15 18.15 0 0 1-20 0" {...stroke(2.1)} />
    <rect x={2} y={6} width={20} height={14} rx={2} {...stroke(2.1)} />
  </svg>
);

export const DocIcon: React.FC = () => (
  <svg width={S} height={S} viewBox="0 0 16 16">
    <rect x={3} y={2} width={10} height={12} rx={1.5} {...stroke(1.5)} />
    <path d="M6 5h4M6 8h4M6 11h2" {...stroke(1.5)} />
  </svg>
);

export const ArrowIcon: React.FC = () => (
  <svg width={S} height={S} viewBox="0 0 16 16">
    <path d="M4 12l8-8M6 4h6v6" {...stroke(2)} />
  </svg>
);
