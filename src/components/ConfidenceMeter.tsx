'use client';

import React from 'react';

interface ConfidenceMeterProps {
  confidence: number; // 0 - 100
  label?: string;
  showExplanation?: boolean;
}

export default function ConfidenceMeter({
  confidence,
  label = 'Diagnostic Confidence',
  showExplanation = true,
}: ConfidenceMeterProps) {
  const clamped = Math.max(5, Math.min(99, confidence));

  let color = '#f59e0b';
  let statusText = 'Working Hypothesis';

  if (clamped >= 85) {
    color = '#10b981';
    statusText = 'High Probability';
  } else if (clamped <= 50) {
    color = '#64748b';
    statusText = 'Forming Hypotheses';
  }

  return (
    <div className="confidence-wrap">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {statusText}
          </span>
          <span style={{ fontSize: '14px', fontWeight: 800, color: color, fontFamily: 'var(--font-mono)' }}>
            {clamped}%
          </span>
        </div>
      </div>

      <div className="confidence-bar-bg">
        <div
          className="confidence-bar-fill"
          style={{
            width: `${clamped}%`,
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}66`,
          }}
        />
      </div>

      {showExplanation && (
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
          * Estimates hypothesis likelihood based on user-supplied symptoms and tests; does not guarantee laboratory certainty.
        </p>
      )}
    </div>
  );
}
