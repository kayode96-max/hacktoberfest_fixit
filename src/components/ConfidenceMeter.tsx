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

  let color = 'var(--emerald-light)';
  let statusText = 'Working Hypothesis';

  if (clamped >= 85) {
    color = 'var(--emerald-primary)';
    statusText = 'High Probability';
  } else if (clamped <= 50) {
    color = 'var(--text-muted)';
    statusText = 'Forming Hypotheses';
  }

  return (
    <div className="confidence-wrap">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'var(--font-mono)' }}>
          {label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {statusText}
          </span>
          <span style={{ fontSize: '13px', fontWeight: 800, color: color, fontFamily: 'var(--font-mono)' }}>
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
          }}
        />
      </div>

      {showExplanation && (
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
          * Calculated hypothesis likelihood based on symptoms and test outcomes.
        </p>
      )}
    </div>
  );
}
