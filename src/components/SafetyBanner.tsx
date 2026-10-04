'use client';

import React from 'react';
import { AlertTriangle, ShieldAlert, ShieldCheck } from 'lucide-react';
import { SafetyLevel } from '@/types/diagnosis';

interface SafetyBannerProps {
  level: SafetyLevel;
  warnings?: string[];
  customTitle?: string;
}

export default function SafetyBanner({ level, warnings = [], customTitle }: SafetyBannerProps) {
  if (level === 'safe' && warnings.length === 0) {
    return (
      <div
        className="safety-banner"
        style={{
          background: 'var(--emerald-subtle)',
          border: '1px solid var(--emerald-border)',
          color: 'var(--emerald-light)',
        }}
      >
        <div className="safety-header" style={{ color: 'var(--emerald-primary)' }}>
          <ShieldCheck size={16} />
          <span>{customTitle || 'Low Voltage / Safe Diagnostic Check'}</span>
        </div>
        <p style={{ fontSize: '12px' }}>
          Standard checks are considered low risk. Always maintain standard electrical awareness.
        </p>
      </div>
    );
  }

  if (level === 'danger_technician_required') {
    return (
      <div className="safety-banner safety-danger" role="alert">
        <div className="safety-header" style={{ color: '#f87171' }}>
          <ShieldAlert size={18} />
          <span>{customTitle || 'CRITICAL SAFETY HAZARD — STOP DIAGNOSIS'}</span>
        </div>
        <p style={{ fontSize: '12px', fontWeight: 600 }}>
          This operation involves high voltage, severe thermal risk, or physical degradation. Do NOT attempt DIY repairs.
        </p>
        {warnings.length > 0 && (
          <ul className="safety-list">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="safety-banner safety-caution" role="alert">
      <div className="safety-header" style={{ color: 'var(--accent-amber)' }}>
        <AlertTriangle size={16} />
        <span>{customTitle || 'SAFETY CAUTION — READ BEFORE PROCEEDING'}</span>
      </div>
      <p style={{ fontSize: '12px' }}>
        This equipment involves electrical energy or active PV circuits. Proceed only if comfortable and observant of safety guidelines.
      </p>
      {warnings.length > 0 && (
        <ul className="safety-list">
          {warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
