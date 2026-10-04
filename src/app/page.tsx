'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Zap,
  Sun,
  Cpu,
  Home as HomeIcon,
  ArrowRight,
  ShieldCheck,
  PlayCircle,
  Clock,
  Sparkles,
  ChevronRight,
  AlertCircle,
  Activity,
} from 'lucide-react';
import { CATEGORIES } from '@/lib/diagnosticEngine';
import { getStoredSessions, saveSession } from '@/lib/storage';
import { DiagnosticSession, EquipmentCategory } from '@/types/diagnosis';

export default function HomePage() {
  const router = useRouter();
  const [recentSessions, setRecentSessions] = useState<DiagnosticSession[]>([]);

  useEffect(() => {
    setRecentSessions(getStoredSessions());
  }, []);

  const handleQuickDemo = () => {
    // 1-Click Launch Hackathon Solar Demo
    router.push('/diagnose?demo=solar_generator');
  };

  const getCategoryBadge = (cat: EquipmentCategory) => {
    switch (cat) {
      case 'solar':
        return <span className="badge badge-solar">☀️ Solar</span>;
      case 'electrical':
        return <span className="badge badge-electrical">⚡ Electrical</span>;
      case 'electronics':
        return <span className="badge badge-electronics">🔌 Electronics</span>;
      case 'appliances':
        return <span className="badge badge-appliances">🏠 Appliances</span>;
    }
  };

  const getStatusBadge = (status: DiagnosticSession['status']) => {
    switch (status) {
      case 'solved':
        return <span className="badge badge-solved">🟢 Solved</span>;
      case 'technician_required':
        return <span className="badge badge-tech">🔴 Tech Required</span>;
      default:
        return <span className="badge badge-continue">🟡 In Progress</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', padding: '16px 8px 8px 8px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(0, 210, 255, 0.1)',
            border: '1px solid rgba(0, 210, 255, 0.25)',
            padding: '4px 12px',
            borderRadius: '9999px',
            fontSize: '11px',
            color: 'var(--accent-cyan)',
            fontWeight: 600,
            marginBottom: '12px',
          }}
        >
          <Sparkles size={13} />
          <span>Interactive Troubleshooting Engine</span>
        </div>

        <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: '8px' }}>
          See it. Describe it.<br />
          <span style={{ color: 'var(--accent-cyan)' }}>Diagnose it. Fix it.</span>
        </h1>

        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 18px auto', lineHeight: 1.45 }}>
          Your technical AI friend who troubleshoots electrical, solar, and electronic problems <strong>one test at a time</strong>.
        </p>

        {/* Primary CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Link
            href="/diagnose"
            className="btn btn-primary btn-full"
            id="start-diagnosis-cta"
            style={{ fontSize: '16px', padding: '14px 20px', borderRadius: 'var(--radius-lg)' }}
          >
            <span>Start New Diagnosis</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Flagship Hackathon Demo Banner */}
      <section>
        <div className="demo-banner">
          <div className="demo-banner-content">
            <h4>
              <PlayCircle size={17} color="#fbbf24" />
              <span>Hackathon Solar Charging Demo</span>
            </h4>
            <p>
              Test the 2-minute flagship flow: Solar generator not charging &rarr; Safety checks &rarr; DC breaker resolution.
            </p>
          </div>
          <button
            type="button"
            onClick={handleQuickDemo}
            className="btn btn-secondary"
            style={{ whiteSpace: 'nowrap', padding: '8px 14px', fontSize: '13px', borderColor: 'rgba(245, 158, 11, 0.4)' }}
          >
            Run Demo
          </button>
        </div>
      </section>

      {/* Equipment Categories Section */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.01em' }}>Equipment Categories</h2>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>4 Supported Domains</span>
        </div>

        <div className="category-grid">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/diagnose?category=${cat.id}`}
              className="category-card"
              id={`cat-card-${cat.id}`}
            >
              <div className="category-icon">{cat.icon}</div>
              <div className="category-name">{cat.name}</div>
              <div className="category-desc">{cat.description}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Safety Priority Card */}
      <section>
        <div
          className="fix-card"
          style={{
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.9) 0%, rgba(11, 19, 36, 0.9) 100%)',
            border: '1px solid rgba(0, 210, 255, 0.2)',
            padding: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(0, 210, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-cyan)',
              }}
            >
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700 }}>Priority Safety Engine</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Zero guesswork on hazardous voltages or swollen lithium cells
              </p>
            </div>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            FixIt AI distinguishes between safe home checks and hazardous internal faults. If a task exceeds safe DIY limits, the AI halts step-by-step probing and provides a detailed technician handover brief.
          </p>
        </div>
      </section>

      {/* Recent Diagnoses Section */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.01em' }}>Recent Diagnoses</h2>
          <Link href="/history" style={{ fontSize: '12px', color: 'var(--accent-cyan)', textDecoration: 'none', fontWeight: 600 }}>
            View All ({recentSessions.length})
          </Link>
        </div>

        {recentSessions.length === 0 ? (
          <div className="fix-card" style={{ textAlign: 'center', padding: '24px 16px' }}>
            <Activity size={28} color="var(--text-muted)" style={{ margin: '0 auto 8px auto' }} />
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No previous diagnoses yet.</p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Select a category above to start your first session.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentSessions.slice(0, 3).map((s) => (
              <Link
                key={s.id}
                href={`/diagnosis/${s.id}`}
                className="fix-card interactive"
                style={{ padding: '14px 16px', margin: 0 }}
                id={`session-card-${s.id}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {getCategoryBadge(s.category)}
                    {getStatusBadge(s.status)}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {new Date(s.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '3px' }}>
                  {s.equipmentType}
                </div>

                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginBottom: '8px',
                  }}
                >
                  {s.problemDescription}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>{s.stepsHistory.length} check(s) performed</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--accent-cyan)' }}>
                    <span>Inspect</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Footer Tagline */}
      <footer style={{ textAlign: 'center', padding: '16px 0 8px 0', borderTop: '1px solid var(--border-subtle)' }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
          &ldquo;Don&rsquo;t just ask AI what&rsquo;s wrong. Let AI help you find out.&rdquo;
        </p>
      </footer>
    </div>
  );
}
