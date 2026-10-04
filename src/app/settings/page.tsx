'use client';

import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Shield,
  Moon,
  Sun,
  RotateCcw,
  Key,
} from 'lucide-react';
import { getAppSettings, saveAppSettings, AppSettings, DEFAULT_SETTINGS } from '@/lib/storage';

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setSettings(getAppSettings());
  }, []);

  const handleChange = (key: keyof AppSettings, val: any) => {
    const updated = saveAppSettings({ [key]: val });
    setSettings(updated);

    if (key === 'theme') {
      document.documentElement.setAttribute('data-theme', val);
    }

    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleResetData = () => {
    if (confirm('Reset FixIt AI data to default sample diagnoses?')) {
      localStorage.removeItem('fixit_ai_sessions_v1');
      alert('Data reset successfully! Refresh or visit History to view sample sessions.');
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ marginBottom: '14px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>Application Settings</h1>
        <p style={{ fontSize: '13px', color: '#ffffff', opacity: 0.85 }}>
          Configure open-weight AI inference, safety protocols, and technical features
        </p>
      </div>

      {savedNotice && (
        <div style={{ background: 'var(--emerald-primary)', color: '#000000', fontWeight: 700, fontSize: '11px', padding: '6px 12px', borderRadius: 'var(--radius-sm)', textAlign: 'center', marginBottom: '12px' }}>
          Preferences updated!
        </div>
      )}

      {/* AI Model Configuration */}
      <div className="fix-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <Cpu size={16} color="var(--emerald-primary)" />
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>Open-Weight AI Model</h3>
        </div>

        <div className="form-group">
          <label className="form-label" style={{ color: '#ffffff' }}>Inference Engine</label>
          <select
            value={settings.aiModel}
            onChange={(e) => handleChange('aiModel', e.target.value)}
            className="form-input"
            style={{ cursor: 'pointer', color: '#ffffff' }}
          >
            <option value="gemma-2-9b-it" style={{ background: '#111', color: '#fff' }}>Google Gemma-2 9B-IT (Recommended - Open Weight)</option>
            <option value="gemma-2-27b-it" style={{ background: '#111', color: '#fff' }}>Google Gemma-2 27B-IT (Deep Diagnostic Reasoning)</option>
            <option value="llama-3.1-8b-instruct" style={{ background: '#111', color: '#fff' }}>Meta Llama 3.1 8B Instruct</option>
            <option value="deterministic-engine" style={{ background: '#111', color: '#fff' }}>Deterministic Offline Diagnostic Engine (Fastest)</option>
          </select>
          <p style={{ fontSize: '11px', color: '#ffffff', opacity: 0.75, marginTop: '4px' }}>
            Structured JSON schema output ensuring deterministic state progression.
          </p>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff' }}>
            <Key size={12} />
            <span>Inference API Key (Optional)</span>
          </label>
          <input
            type="password"
            placeholder="Groq / OpenRouter / HuggingFace key (optional)"
            value={settings.apiKey || ''}
            onChange={(e) => handleChange('apiKey', e.target.value)}
            className="form-input"
            style={{ color: '#ffffff' }}
          />
          <p style={{ fontSize: '11px', color: '#ffffff', opacity: 0.75, marginTop: '4px' }}>
            If omitted, the local rule and reasoning engine executes in real-time.
          </p>
        </div>
      </div>

      {/* Safety & Protocol Preferences */}
      <div className="fix-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <Shield size={16} color="var(--emerald-primary)" />
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>Safety Guardrails</h3>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>Strict Electrical Safety</div>
            <div style={{ fontSize: '11px', color: '#ffffff', opacity: 0.75 }}>
              Automatically halts DIY troubleshooting whenever mains voltage or chemical hazard is detected
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.strictSafety}
            onChange={(e) => handleChange('strictSafety', e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: 'var(--emerald-primary)', cursor: 'pointer' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>Multimeter Support</div>
            <div style={{ fontSize: '11px', color: '#ffffff', opacity: 0.75 }}>
              Enable direct voltage, current, and resistance measurement prompts
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.multimeterMode}
            onChange={(e) => handleChange('multimeterMode', e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: 'var(--emerald-primary)', cursor: 'pointer' }}
          />
        </div>
      </div>

      {/* Theme Preference */}
      <div className="fix-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <Moon size={16} color="var(--emerald-primary)" />
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>Appearance</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          <button
            type="button"
            onClick={() => handleChange('theme', 'dark')}
            className={`btn btn-secondary ${settings.theme === 'dark' ? 'btn-primary' : ''}`}
            style={{ minHeight: '38px', fontSize: '13px', textDecoration: 'none' }}
          >
            <Moon size={15} />
            <span>Black Slate</span>
          </button>
          <button
            type="button"
            onClick={() => handleChange('theme', 'light')}
            className={`btn btn-secondary ${settings.theme === 'light' ? 'btn-primary' : ''}`}
            style={{ minHeight: '38px', fontSize: '13px', textDecoration: 'none' }}
          >
            <Sun size={15} />
            <span>Clean Light</span>
          </button>
        </div>
      </div>

      {/* Reset Seed Demo Data */}
      <div className="fix-card" style={{ textAlign: 'center' }}>
        <button
          type="button"
          onClick={handleResetData}
          className="btn btn-secondary"
          style={{ width: '100%', borderColor: 'var(--border-subtle)', color: '#ffffff', opacity: 0.8, fontSize: '12px', textDecoration: 'none' }}
        >
          <RotateCcw size={14} />
          <span>Reset Sample Hackathon Diagnoses</span>
        </button>
      </div>
    </div>
  );
}
