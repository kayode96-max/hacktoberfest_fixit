'use client';

import React, { useState } from 'react';
import { Gauge, ShieldAlert } from 'lucide-react';

interface MultimeterInputProps {
  unit?: string;
  hint?: string;
  onSubmit: (measurement: { voltage?: number; current?: number; unit?: string }) => void;
  onSkip: () => void;
}

export default function MultimeterInput({
  unit = 'V DC',
  hint = 'Measure voltage across open terminals with digital multimeter',
  onSubmit,
  onSkip,
}: MultimeterInputProps) {
  const [hasMultimeter, setHasMultimeter] = useState<boolean | null>(null);
  const [val, setVal] = useState('');

  if (hasMultimeter === null) {
    return (
      <div className="multimeter-box">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Gauge size={18} color="var(--emerald-primary)" />
          <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)' }}>
            Multimeter Measurement Support
          </span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
          Do you have a digital multimeter available to take a direct measurement?
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ flex: 1 }}
            onClick={() => setHasMultimeter(true)}
          >
            Yes, I have one
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ flex: 1 }}
            onClick={() => onSkip()}
          >
            No / Skip
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(val);
    if (!isNaN(num)) {
      onSubmit({ voltage: num, unit });
    }
  };

  return (
    <div className="multimeter-box">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Gauge size={18} color="var(--emerald-primary)" />
          <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
            Multimeter Input
          </span>
        </div>
        <span className="badge badge-solar">{unit}</span>
      </div>

      <div className="multimeter-lcd" style={{ marginBottom: '10px' }}>
        <span>{val ? val : '00.0'}</span>
        <span style={{ fontSize: '14px', color: 'var(--emerald-dark)' }}>{unit}</span>
      </div>

      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>
        {hint}
      </p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
        <input
          type="number"
          step="0.1"
          placeholder="e.g. 19.5"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="form-input"
          style={{ flex: 1 }}
          autoFocus
        />
        <button
          type="button"
          disabled={!val}
          onClick={handleSubmit}
          className="btn btn-primary"
          style={{ minWidth: '84px' }}
        >
          Submit
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--accent-amber)' }}>
          <ShieldAlert size={12} />
          <span>Keep meter in Voltage mode (never test resistance on live circuits)</span>
        </div>
        <button
          type="button"
          onClick={onSkip}
          style={{ background: 'none', border: 'none', color: '#ffffff', opacity: 0.8, fontSize: '11px', cursor: 'pointer', textDecoration: 'none' }}
        >
          Skip measurement
        </button>
      </div>
    </div>
  );
}
