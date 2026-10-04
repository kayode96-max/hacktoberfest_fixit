'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Cpu,
  Shield,
  Gauge,
  Moon,
  Sun,
  RotateCcw,
  CheckCircle2,
  Info,
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
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 800 }}>Application Settings</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Configure open-weight AI inference, safety protocols, and technical features
        </p>
      </div>

      {savedNotice && (
        <div style={{ background: '#10b981', color: '#fff', fontSize: '12px', padding: '6px 12px', borderRadius: '4px', textAlign: 'center', marginBottom: '14px' }}>
          Preferences updated!
        </div>
      )}

      {/* AI Model Configuration */}
      <div className="fix-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Cpu size={18} color="var(--accent-cyan)" />
          <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Open-Weight AI Model</h3>
        </div>

        <div className="form-group">
          <label className="form-label">Inference Engine</label>
          <select
            value={settings.aiModel}
            onChange={(e) => handleChange('aiModel', e.target.value)}
            className="form-input"
            style={{ cursor: 'pointer' }}
          >
            <option value="gemma-2-9b-it">Google Gemma-2 9B-IT (Recommended - Open Weight)</option>
            <option value="gemma-2-27b-it">Google Gemma-2 27B-IT (Deep Diagnostic Reasoning)</option>
            <option value="llama-3.1-8b-instruct">Meta Llama 3.1 8B Instruct</option>
            <option value="deterministic-engine">Deterministic Offline Diagnostic Engine (Fastest)</option>
          </select>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Uses open-weight instruction-tuned weights with structured JSON schema output for reproducible troubleshooting.
          </p>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Key size={13} />
            <span>External Inference API Key (Optional)</span>
          </label>
          <input
            type="password"
            placeholder="Groq / OpenRouter / HuggingFace key (optional)"
            value={settings.apiKey || ''}
            onChange={(e) => handleChange('apiKey', e.target.value)}
            className="form-input"
          />
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            If omitted, the built-in diagnostic rule and reasoning engine executes locally in real time.
          </p>
        </div>
      </div>

      {/* Safety & Protocol Preferences */}
      <div className="fix-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Shield size={18} color="#f59e0b" />
          <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Safety Guardrails</h3>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>Strict Electrical Safety</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Automatically halts DIY troubleshooting whenever mains voltage or chemical hazard is detected
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.strictSafety}
            onChange={(e) => handleChange('strictSafety', e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>Multimeter Support</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Enable direct voltage, current, and resistance measurement prompts
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.multimeterMode}
            onChange={(e) => handleChange('multimeterMode', e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
        </div>
      </div>

      {/* Theme Preference */}
      <div className="fix-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Moon size={18} color="var(--accent-cyan)" />
          <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Appearance</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          <button
            type="button"
            onClick={() => handleChange('theme', 'dark')}
            className={`btn btn-secondary ${settings.theme === 'dark' ? 'btn-primary' : ''}`}
            style={{ minHeight: '40px' }}
          >
            <Moon size={16} />
            <span>Dark Slate</span>
          </button>
          <button
            type="button"
            onClick={() => handleChange('theme', 'light')}
            className={`btn btn-secondary ${settings.theme === 'light' ? 'btn-primary' : ''}`}
            style={{ minHeight: '40px' }}
          >
            <Sun size={16} />
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
          style={{ width: '100%', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5' }}
        >
          <RotateCcw size={15} />
          <span>Reset Default Hackathon Demo Diagnoses</span>
        </button>
      </div>
    </div>
  );
}
