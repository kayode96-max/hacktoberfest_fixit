'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ShieldCheck,
  PlayCircle,
  Clock,
  Sparkles,
  ChevronRight,
  Activity,
  Sun,
  Zap,
  Cpu,
  Home as HomeIcon,
} from 'lucide-react';
import { CATEGORIES } from '@/lib/diagnosticEngine';
import { getStoredSessions } from '@/lib/storage';
import { DiagnosticSession, EquipmentCategory } from '@/types/diagnosis';

export default function HomePage() {
  const router = useRouter();
  const [recentSessions, setRecentSessions] = useState<DiagnosticSession[]>([]);

  useEffect(() => {
    setRecentSessions(getStoredSessions());
  }, []);

  const handleQuickDemo = () => {
    router.push('/diagnose?demo=solar_generator');
  };

  const getCategoryIcon = (cat: EquipmentCategory) => {
    switch (cat) {
      case 'solar':
        return <Sun size={18} />;
      case 'electrical':
        return <Zap size={18} />;
      case 'electronics':
        return <Cpu size={18} />;
      case 'appliances':
        return <HomeIcon size={18} />;
    }
  };

  const getCategoryBadge = (cat: EquipmentCategory) => {
    switch (cat) {
      case 'solar':
        return (
          <span className="badge badge-solar">
            <Sun size={12} />
            <span>Solar</span>
          </span>
        );
      case 'electrical':
        return (
          <span className="badge badge-electrical">
            <Zap size={12} />
            <span>Electrical</span>
          </span>
        );
      case 'electronics':
        return (
          <span className="badge badge-electronics">
            <Cpu size={12} />
            <span>Electronics</span>
          </span>
        );
      case 'appliances':
        return (
          <span className="badge badge-appliances">
            <HomeIcon size={12} />
            <span>Appliances</span>
          </span>
        );
    }
  };

  const getStatusBadge = (status: DiagnosticSession['status']) => {
    switch (status) {
      case 'solved':
        return <span className="badge badge-solved">Solved</span>;
      case 'technician_required':
        return <span className="badge badge-tech">Tech Required</span>;
      default:
        return <span className="badge badge-continue">In Progress</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', padding: '16px 8px 6px 8px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--emerald-subtle)',
            border: '1px solid var(--emerald-border)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '11px',
            color: 'var(--emerald-light)',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: '12px',
          }}
        >
          <Sparkles size={12} />
          <span>Open-Weight Technical Troubleshooting</span>
        </div>

        <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.25, marginBottom: '8px', color: '#ffffff' }}>
          See it. Describe it.<br />
          <span style={{ color: 'var(--emerald-primary)' }}>Diagnose it. Fix it.</span>
        </h1>

        <p style={{ fontSize: '14px', color: '#ffffff', maxWidth: '440px', margin: '0 auto 18px auto', lineHeight: 1.5, opacity: 0.9 }}>
          A mobile-first technical assistant that guides you through electrical, solar, and electronics troubleshooting <strong>one step at a time</strong>.
        </p>

        {/* Primary CTA */}
        <div>
          <Link
            href="/diagnose"
            className="btn btn-primary btn-full"
            id="start-diagnosis-cta"
            style={{ fontSize: '15px', padding: '12px 18px', textDecoration: 'none' }}
          >
            <span>Start New Diagnosis</span>
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      {/* Flagship Hackathon Demo Banner */}
      <section>
        <div className="demo-banner">
          <div className="demo-banner-content">
            <h4>
              <PlayCircle size={16} color="var(--emerald-primary)" />
              <span>Hackathon Solar Charging Demo</span>
            </h4>
            <p style={{ color: '#ffffff', opacity: 0.85 }}>
              Test the 2-minute scenario: Solar generator not charging &rarr; Safety checks &rarr; DC breaker resolution.
            </p>
          </div>
          <button
            type="button"
            onClick={handleQuickDemo}
            className="btn btn-secondary"
            style={{ whiteSpace: 'nowrap', padding: '8px 12px', fontSize: '12px', borderColor: 'var(--emerald-border)', color: 'var(--emerald-light)', textDecoration: 'none' }}
          >
            Run Demo
          </button>
        </div>
      </section>

      {/* Equipment Categories Section */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
            Equipment Domains
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>4 Categories</span>
        </div>

        <div className="category-grid">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/diagnose?category=${cat.id}`}
              className="category-card"
              id={`cat-card-${cat.id}`}
              style={{ textDecoration: 'none' }}
            >
              <div className="category-icon-wrap">
                {getCategoryIcon(cat.id)}
              </div>
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
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            padding: '14px 16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--emerald-subtle)',
                border: '1px solid var(--emerald-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--emerald-primary)',
              }}
            >
              <ShieldCheck size={15} />
            </div>
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Built-in Safety Layer</h3>
            </div>
          </div>
          <p style={{ fontSize: '12px', color: '#ffffff', lineHeight: 1.45, opacity: 0.85 }}>
            FixIt AI prioritizes personal safety above diagnosis. When hazards like thermal venting, high voltage, or swollen batteries are detected, testing stops and a structured technician handover brief is produced.
          </p>
        </div>
      </section>

      {/* Recent Diagnoses Section */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
            Recent Sessions
          </h2>
          <Link href="/history" style={{ fontSize: '12px', color: 'var(--emerald-primary)', textDecoration: 'none', fontWeight: 600 }}>
            View All ({recentSessions.length})
          </Link>
        </div>

        {recentSessions.length === 0 ? (
          <div className="fix-card" style={{ textAlign: 'center', padding: '24px 16px' }}>
            <Activity size={24} color="var(--text-muted)" style={{ margin: '0 auto 6px auto' }} />
            <p style={{ fontSize: '13px', color: '#ffffff' }}>No previous diagnoses yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentSessions.slice(0, 3).map((s) => (
              <Link
                key={s.id}
                href={`/diagnosis/${s.id}`}
                className="fix-card interactive"
                style={{ padding: '12px 14px', margin: 0, textDecoration: 'none' }}
                id={`session-card-${s.id}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {getCategoryBadge(s.category)}
                    {getStatusBadge(s.status)}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {new Date(s.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px', color: '#ffffff' }}>
                  {s.equipmentType}
                </div>

                <div
                  style={{
                    fontSize: '12px',
                    color: '#ffffff',
                    opacity: 0.85,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginBottom: '6px',
                  }}
                >
                  {s.problemDescription}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>{s.stepsHistory.length} check(s) performed</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--emerald-primary)' }}>
                    <span>Inspect</span>
                    <ChevronRight size={13} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Tagline */}
      <footer style={{ textAlign: 'center', padding: '14px 0 6px 0', borderTop: '1px solid var(--border-subtle)' }}>
        <p style={{ fontSize: '12px', color: '#ffffff', fontFamily: 'var(--font-mono)', opacity: 0.75 }}>
          &ldquo;Don&rsquo;t just ask AI what&rsquo;s wrong. Let AI help you find out.&rdquo;
        </p>
      </footer>
    </div>
  );
}
