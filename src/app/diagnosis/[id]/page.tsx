'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Share2,
  Printer,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Wrench,
  Clock,
  Gauge,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { getSessionById, saveSession } from '@/lib/storage';
import { DiagnosticSession } from '@/types/diagnosis';
import ConfidenceMeter from '@/components/ConfidenceMeter';
import SafetyBanner from '@/components/SafetyBanner';

export default function DiagnosisReportPage() {
  const params = useParams();
  const router = useRouter();
  const [session, setSession] = useState<DiagnosticSession | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (params?.id) {
      const found = getSessionById(params.id as string);
      if (found) {
        setSession(found);
      }
    }
  }, [params]);

  if (!session) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Diagnosis Not Found</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          This session may have been cleared from local storage.
        </p>
        <Link href="/" className="btn btn-primary">
          Return to Home
        </Link>
      </div>
    );
  }

  const handleShare = () => {
    const text = `FixIt AI Report: ${session.equipmentType} - ${session.problemDescription}\nStatus: ${session.status.toUpperCase()}\nResolution: ${session.resolutionSummary || 'Diagnostic in progress'}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      {/* Top navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <button type="button" onClick={() => router.back()} className="icon-btn" title="Back">
          <ArrowLeft size={18} />
        </button>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" onClick={handleShare} className="icon-btn" title="Copy Summary">
            <Share2 size={16} />
          </button>
          <button type="button" onClick={handlePrint} className="icon-btn" title="Print Report">
            <Printer size={16} />
          </button>
        </div>
      </div>

      {copied && (
        <div style={{ background: '#10b981', color: '#fff', fontSize: '12px', padding: '6px 12px', borderRadius: '4px', textAlign: 'center', marginBottom: '12px' }}>
          Diagnostic brief copied to clipboard!
        </div>
      )}

      {/* Report Header Card */}
      <div className="fix-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <span className="badge badge-solar">{session.category.toUpperCase()}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            ID: #{session.id.slice(0, 10)}
          </span>
        </div>

        <h1 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '6px' }}>{session.equipmentType}</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.45 }}>
          {session.problemDescription}
        </p>

        <ConfidenceMeter confidence={session.confidence} label="Final Diagnostic Confidence" />

        <div style={{ display: 'flex', gap: '14px', marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} />
            <span>{new Date(session.createdAt).toLocaleDateString()}</span>
          </div>
          <div>Checks Run: {session.stepsHistory.length}</div>
        </div>
      </div>

      {/* Safety Layer Evaluation */}
      <SafetyBanner level={session.safetyLevel} warnings={session.safetyWarnings} />

      {/* Resolution Outcome */}
      <div
        className="fix-card"
        style={{
          borderLeft: `4px solid ${session.status === 'solved' ? '#10b981' : session.status === 'technician_required' ? '#ef4444' : '#f59e0b'}`,
          background: 'var(--bg-secondary)',
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
          Diagnostic Assessment
        </div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5 }}>
          {session.resolutionSummary || session.initialAssessment}
        </div>
      </div>

      {/* Action Breakdown: Safe User vs Technician */}
      {session.safeUserActions && session.safeUserActions.length > 0 && (
        <div className="fix-card" style={{ borderLeft: '4px solid #10b981' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#6ee7b7', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={16} />
            <span>Safe User Actions</span>
          </h4>
          <ul style={{ paddingLeft: '20px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {session.safeUserActions.map((act, i) => (
              <li key={i}>{act}</li>
            ))}
          </ul>
        </div>
      )}

      {session.technicianActions && session.technicianActions.length > 0 && (
        <div className="fix-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#fca5a5', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Wrench size={16} />
            <span>Technician Handover Brief</span>
          </h4>
          <ul style={{ paddingLeft: '20px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {session.technicianActions.map((act, i) => (
              <li key={i}>{act}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Step by Step Timeline History */}
      <div className="fix-card">
        <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>Diagnostic Step Audit Log</h4>

        {session.stepsHistory.length === 0 ? (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Diagnosis resolved during initial safety triage.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {session.stepsHistory.map((rec, i) => (
              <div
                key={i}
                style={{
                  borderLeft: '2px solid var(--border-highlight)',
                  paddingLeft: '12px',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: '-5px',
                    top: '2px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--accent-cyan)',
                  }}
                />
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Step {rec.step.stepNumber}: {rec.step.title}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 6px 0' }}>
                  {rec.step.instruction}
                </div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'var(--bg-input)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    color: 'var(--accent-cyan)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  <CheckCircle2 size={12} />
                  <span>Observation: &ldquo;{rec.userResponse}&rdquo;</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Back to diagnosing / Home */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
        <Link href="/diagnose" className="btn btn-primary" style={{ flex: 1 }}>
          <RotateCcw size={16} />
          <span>New Diagnosis</span>
        </Link>
        <Link href="/history" className="btn btn-secondary" style={{ flex: 1 }}>
          <span>View All History</span>
        </Link>
      </div>
    </div>
  );
}
