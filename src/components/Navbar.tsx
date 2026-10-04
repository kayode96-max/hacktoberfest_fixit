'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Wrench, Sun, Moon, PlusCircle, ShieldCheck } from 'lucide-react';
import { getAppSettings, saveAppSettings } from '@/lib/storage';

export default function Navbar() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const settings = getAppSettings();
    setTheme(settings.theme === 'light' ? 'light' : 'dark');
    document.documentElement.setAttribute('data-theme', settings.theme || 'dark');
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    saveAppSettings({ theme: nextTheme });
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  return (
    <header className="top-header">
      <Link href="/" className="brand-wrap">
        <div className="brand-badge">
          <Wrench size={18} strokeWidth={2.5} />
        </div>
        <div>
          <div className="brand-title">FixIt AI</div>
          <div className="brand-subtitle">Step-by-Step Diagnostic Assistant</div>
        </div>
      </Link>

      <div className="header-actions">
        <Link href="/diagnose" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px', minHeight: '34px' }}>
          <PlusCircle size={14} />
          <span>New Fix</span>
        </Link>
        <button
          onClick={toggleTheme}
          className="icon-btn"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>
    </header>
  );
}
