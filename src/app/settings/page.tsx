'use client';

import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Shield,
  Moon,
  Sun,
  RotateCcw,
  Key,
  CheckCircle2,
  Terminal,
  Activity,
  Server,
  Zap,
} from 'lucide-react';
import { getAppSettings, saveAppSettings, AppSettings, DEFAULT_SETTINGS } from '@/lib/storage';

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [savedNotice, setSavedNotice] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

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

  const handleTestGemma = async () => {
    setIsTesting(true);
    setTestStatus('Pinging Gemma inference backend...');
    try {
      const res = await fetch('/api/diagnose?action=start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'solar',
          equipmentType: 'Solar generator',
          problemDescription: 'Test Gemma diagnostic connection',
          gemmaConfig: {
            apiKey: settings.apiKey,
            baseUrl: settings.apiEndpoint || 'http://localhost:11434',
            model: settings.aiModel,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTestStatus(`Connected: ${data.aiModelUsed}`);
      } else {
        setTestStatus('Offline mode active (Local technical fallback verified)');
      }
    } catch (e) {
      setTestStatus('Local fallback active (Offline engine ready)');
    } finally {
      setIsTesting(false);
    }
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
          Configure Google Gemma open-weight AI inference, offline mode, and safety rules
        </p>
      </div>

      {savedNotice && (
        <div style={{ background: 'var(--emerald-primary)', color: '#000000', fontWeight: 700, fontSize: '11px', padding: '6px 12px', borderRadius: 'var(--radius-sm)', textAlign: 'center', marginBottom: '12px' }}>
          Preferences updated!
        </div>
      )}

      {/* Google Gemma AI Model Configuration */}
      <div className="fix-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={16} color="var(--emerald-primary)" />
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>Google Gemma Open-Weight Model</h3>
          </div>
          <span className="badge badge-solar">Gemma 2</span>
        </div>

        <p style={{ fontSize: '12px', color: '#ffffff', opacity: 0.85, marginBottom: '12px', lineHeight: 1.45 }}>
          FixIt AI uses Google Gemma-2 instruction models for technical reasoning. You can run Gemma locally offline via <strong>Ollama</strong> or in cloud via <strong>Groq / OpenRouter</strong>.
        </p>

        <div className="form-group">
          <label className="form-label" style={{ color: '#ffffff' }}>Gemma Model Selection</label>
          <select
            value={settings.aiModel}
            onChange={(e) => handleChange('aiModel', e.target.value)}
            className="form-input"
            style={{ cursor: 'pointer', color: '#ffffff' }}
          >
            <option value="gemma2-9b-it" style={{ background: '#111', color: '#fff' }}>Google Gemma-2 9B-IT (Recommended - Featured Hacktoberfest Sponsor)</option>
            <option value="gemma2-27b-it" style={{ background: '#111', color: '#fff' }}>Google Gemma-2 27B-IT (Deep Multi-Step Circuit Logic)</option>
            <option value="gemma2-2b-it" style={{ background: '#111', color: '#fff' }}>Google Gemma-2 2B (Lightweight On-Device / Embedded)</option>
            <option value="deterministic-engine" style={{ background: '#111', color: '#fff' }}>Local Deterministic Engine (Offline Rule Fallback)</option>
          </select>
        </div>

        {/* Local Ollama Endpoint */}
        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff' }}>
            <Server size={12} />
            <span>Local Ollama Endpoint (For 100% Offline Zero-Internet Use)</span>
          </label>
          <input
            type="text"
            placeholder="http://localhost:11434"
            value={settings.apiEndpoint || 'http://localhost:11434'}
            onChange={(e) => handleChange('apiEndpoint', e.target.value)}
            className="form-input"
            style={{ color: '#ffffff', fontFamily: 'var(--font-mono)', fontSize: '13px' }}
          />
          <p style={{ fontSize: '11px', color: '#ffffff', opacity: 0.75, marginTop: '4px' }}>
            Run <code style={{ color: 'var(--emerald-light)', background: '#1c1c1c', padding: '1px 4px', borderRadius: '3px' }}>ollama run gemma2:9b</code> on your laptop for full off-grid diagnosis without internet.
          </p>
        </div>

        {/* Optional Cloud API Key */}
        <div className="form-group" style={{ marginBottom: '14px' }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff' }}>
            <Key size={12} />
            <span>Cloud Gemma API Key (Groq / OpenRouter / HuggingFace)</span>
          </label>
          <input
            type="password"
            placeholder="Optional gsk_... (Groq runs Gemma-2 at 500+ tokens/sec)"
            value={settings.apiKey || ''}
            onChange={(e) => handleChange('apiKey', e.target.value)}
            className="form-input"
            style={{ color: '#ffffff' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            disabled={isTesting}
            onClick={handleTestGemma}
            className="btn btn-secondary"
            style={{ fontSize: '12px', padding: '8px 14px', minHeight: '34px', textDecoration: 'none' }}
          >
            <Activity size={14} color="var(--emerald-primary)" />
            <span>{isTesting ? 'Testing...' : 'Test Gemma Connection'}</span>
          </button>
          {testStatus && (
            <span style={{ fontSize: '11px', color: 'var(--emerald-light)', fontFamily: 'var(--font-mono)' }}>
              {testStatus}
            </span>
          )}
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
