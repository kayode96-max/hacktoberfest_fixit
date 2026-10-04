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
      <div className="safety-banner" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#a7f3d0' }}>
        <div className="safety-header" style={{ color: '#34d399' }}>
          <ShieldCheck size={18} />
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
          <ShieldAlert size={20} />
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

  // Caution level
  return (
    <div className="safety-banner safety-caution" role="alert">
      <div className="safety-header" style={{ color: '#fbbf24' }}>
        <AlertTriangle size={18} />
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
