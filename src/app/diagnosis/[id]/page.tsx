'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Share2,
  Printer,
  CheckCircle2,
  ShieldCheck,
  Wrench,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { getSessionById } from '@/lib/storage';
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
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Diagnosis Not Found</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
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
          <ArrowLeft size={16} />
        </button>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button type="button" onClick={handleShare} className="icon-btn" title="Copy Summary">
            <Share2 size={15} />
          </button>
          <button type="button" onClick={handlePrint} className="icon-btn" title="Print Report">
            <Printer size={15} />
          </button>
        </div>
      </div>

      {copied && (
        <div style={{ background: 'var(--emerald-primary)', color: '#000000', fontWeight: 700, fontSize: '11px', padding: '6px 12px', borderRadius: 'var(--radius-sm)', textAlign: 'center', marginBottom: '12px' }}>
          Diagnostic brief copied to clipboard!
        </div>
      )}

      {/* Report Header Card */}
      <div className="fix-card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
          <span className="badge badge-solar">{session.category.toUpperCase()}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            ID: #{session.id.slice(0, 10)}
          </span>
        </div>

        <h1 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '4px' }}>{session.equipmentType}</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.45 }}>
          {session.problemDescription}
        </p>

        <ConfidenceMeter confidence={session.confidence} label="Diagnostic Confidence" />

        <div style={{ display: 'flex', gap: '14px', marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={11} />
            <span>{new Date(session.createdAt).toLocaleDateString()}</span>
          </div>
          <div>Checks Performed: {session.stepsHistory.length}</div>
        </div>
      </div>

      {/* Safety Layer Evaluation */}
      <SafetyBanner level={session.safetyLevel} warnings={session.safetyWarnings} />

      {/* Resolution Outcome */}
      <div
        className="fix-card"
        style={{
          borderLeft: `3px solid ${session.status === 'solved' ? 'var(--emerald-primary)' : session.status === 'technician_required' ? 'var(--accent-red)' : 'var(--accent-amber)'}`,
          background: 'var(--bg-secondary)',
        }}
      >
        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>
          Diagnostic Assessment
        </div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5 }}>
          {session.resolutionSummary || session.initialAssessment}
        </div>
      </div>

      {/* Action Breakdown: Safe User vs Technician */}
      {session.safeUserActions && session.safeUserActions.length > 0 && (
        <div className="fix-card" style={{ borderLeft: '3px solid var(--emerald-primary)' }}>
          <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', fontFamily: 'var(--font-mono)', color: 'var(--emerald-light)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} />
            <span>Safe User Actions</span>
          </h4>
          <ul style={{ paddingLeft: '18px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            {session.safeUserActions.map((act, i) => (
              <li key={i}>{act}</li>
            ))}
          </ul>
        </div>
      )}

      {session.technicianActions && session.technicianActions.length > 0 && (
        <div className="fix-card" style={{ borderLeft: '3px solid var(--accent-red)' }}>
          <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', fontFamily: 'var(--font-mono)', color: '#fca5a5', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Wrench size={14} />
            <span>Technician Handover Brief</span>
          </h4>
          <ul style={{ paddingLeft: '18px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            {session.technicianActions.map((act, i) => (
              <li key={i}>{act}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Step by Step Timeline History */}
      <div className="fix-card">
        <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '10px' }}>
          Diagnostic Step Audit Log
        </h4>

        {session.stepsHistory.length === 0 ? (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Diagnosis resolved during initial safety assessment.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {session.stepsHistory.map((rec, i) => (
              <div
                key={i}
                style={{
                  borderLeft: '2px solid var(--border-subtle)',
                  paddingLeft: '12px',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: '-5px',
                    top: '3px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '2px',
                    background: 'var(--emerald-primary)',
                  }}
                />
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Step {rec.step.stepNumber}: {rec.step.title}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 4px 0' }}>
                  {rec.step.instruction}
                </div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'var(--bg-input)',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11px',
                    color: 'var(--emerald-light)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  <CheckCircle2 size={11} />
                  <span>Observation: &ldquo;{rec.userResponse}&rdquo;</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Back to diagnosing / Home */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
        <Link href="/diagnose" className="btn btn-primary" style={{ flex: 1 }}>
          <RotateCcw size={15} />
          <span>New Diagnosis</span>
        </Link>
        <Link href="/history" className="btn btn-secondary" style={{ flex: 1 }}>
          <span>View All History</span>
        </Link>
      </div>
    </div>
  );
}
