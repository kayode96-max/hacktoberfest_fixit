'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Camera,
  Upload,
  X,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  Clock,
  Sparkles,
  Info,
  Wrench,
  BookmarkCheck,
  Sun,
  Zap,
  Cpu,
  Home as HomeIcon,
} from 'lucide-react';
import { CATEGORIES } from '@/lib/diagnosticEngine';
import { saveSession } from '@/lib/storage';
import {
  EquipmentCategory,
  DiagnosticSession,
} from '@/types/diagnosis';
import ConfidenceMeter from '@/components/ConfidenceMeter';
import SafetyBanner from '@/components/SafetyBanner';
import MultimeterInput from '@/components/MultimeterInput';

function DiagnoseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [phase, setPhase] = useState<
    'category' | 'equipment' | 'description' | 'photos' | 'analyzing' | 'troubleshooting' | 'result'
  >('category');

  const [selectedCategory, setSelectedCategory] = useState<EquipmentCategory>('solar');
  const [equipmentType, setEquipmentType] = useState<string>('');
  const [problemDescription, setProblemDescription] = useState<string>('');
  const [structuredAnswers, setStructuredAnswers] = useState<Record<string, string>>({
    isPowered: 'Yes',
    indicatorLights: 'No indicator',
    workedPreviously: 'Yes',
    whenStarted: 'Today',
  });
  const [photos, setPhotos] = useState<string[]>([]);

  const [session, setSession] = useState<DiagnosticSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(false);

  useEffect(() => {
    const demo = searchParams.get('demo');
    const cat = searchParams.get('category') as EquipmentCategory;

    if (demo === 'solar_generator') {
      setSelectedCategory('solar');
      setEquipmentType('Solar generator / portable power station');
      setProblemDescription(
        'My solar generator isn’t charging even though the 200W solar panel is connected in full daylight.'
      );
      setStructuredAnswers({
        isPowered: 'Yes',
        indicatorLights: 'No / Zero watts',
        workedPreviously: 'Yes',
        whenStarted: 'Today',
      });
      setPhotos([
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%23050505"/><rect x="40" y="40" width="220" height="120" rx="4" fill="%23111111" stroke="%2310b981" stroke-width="1"/><text x="150" y="85" fill="%23a1a1aa" font-family="sans-serif" font-size="12" text-anchor="middle">Solar Input Port</text><text x="150" y="115" fill="%2310b981" font-family="monospace" font-weight="bold" font-size="20" text-anchor="middle">INPUT: 0W</text></svg>',
      ]);
      setPhase('photos');
    } else if (cat && ['solar', 'electrical', 'electronics', 'appliances'].includes(cat)) {
      setSelectedCategory(cat);
      setPhase('equipment');
    }
  }, [searchParams]);

  useEffect(() => {
    let interval: any;
    if (timerActive) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  const currentCategoryInfo = CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0];

  const getCategoryIcon = (catId: EquipmentCategory) => {
    switch (catId) {
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

  const handleSelectCategory = (catId: EquipmentCategory) => {
    setSelectedCategory(catId);
    setPhase('equipment');
  };

  const handleSelectEquipment = (item: string) => {
    setEquipmentType(item);
    setPhase('description');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setPhotos((prev) => [...prev, result]);
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const addSamplePhoto = () => {
    const sample =
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%230a0a0a"/><rect x="40" y="40" width="220" height="120" rx="4" fill="%23141414" stroke="%2310b981" stroke-width="1"/><text x="150" y="85" fill="%2371717a" font-family="sans-serif" font-size="12" text-anchor="middle">Equipment Reference</text><text x="150" y="115" fill="%2310b981" font-family="monospace" font-size="18" text-anchor="middle">DISPLAY: 0W</text></svg>';
    setPhotos((prev) => [...prev, sample]);
  };

  const handleStartAnalysis = async () => {
    setIsLoading(true);
    setPhase('analyzing');
    setTimerSeconds(0);
    setTimerActive(true);

    try {
      const res = await fetch('/api/diagnose?action=start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCategory,
          equipmentType: equipmentType || 'Unknown Equipment',
          problemDescription,
          structuredAnswers,
          photos,
        }),
      });

      const data = await res.json();
      if (data.success && data.session) {
        setSession(data.session);
        saveSession(data.session);

        setTimeout(() => {
          setIsLoading(false);
          setPhase('troubleshooting');
        }, 700);
      } else {
        throw new Error(data.error || 'Failed to start diagnosis');
      }
    } catch (e) {
      console.error(e);
      setIsLoading(false);
      setPhase('troubleshooting');
    }
  };

  const handleStepResponse = async (
    response: string,
    measurement?: { voltage?: number; current?: number; unit?: string }
  ) => {
    if (!session || !session.currentStep) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/diagnose?action=step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session,
          userResponse: response,
          measurement,
        }),
      });

      const data = await res.json();
      if (data.success && data.session) {
        const updated = data.session;
        setSession(updated);
        saveSession(updated);

        if (updated.status === 'solved' || updated.status === 'technician_required') {
          setTimerActive(false);
          setPhase('result');
        }
      }
    } catch (e) {
      console.error('Step execution error', e);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}m ${s < 10 ? '0' : ''}${s}s`;
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      {/* Top Wizard Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <button
          type="button"
          onClick={() => {
            if (phase === 'equipment') setPhase('category');
            else if (phase === 'description') setPhase('equipment');
            else if (phase === 'photos') setPhase('description');
            else router.push('/');
          }}
          className="icon-btn"
          title="Back"
          style={{ textDecoration: 'none' }}
        >
          <ArrowLeft size={16} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#ffffff', opacity: 0.8, fontFamily: 'var(--font-mono)' }}>
            Diagnosis Flow
          </span>
          {timerActive && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--emerald-light)',
                background: 'var(--emerald-subtle)',
                border: '1px solid var(--emerald-border)',
                padding: '2px 6px',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <Clock size={11} />
              <span>{formatTimer(timerSeconds)}</span>
            </span>
          )}
        </div>
      </div>

      {/* PHASE 1: SELECT CATEGORY */}
      {phase === 'category' && (
        <section>
          <div style={{ marginBottom: '14px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>Select Equipment Domain</h2>
            <p style={{ fontSize: '13px', color: '#ffffff', opacity: 0.85 }}>
              Choose the category of device having trouble.
            </p>
          </div>

          <div className="category-grid">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                onClick={() => handleSelectCategory(cat.id)}
                className={`category-card ${selectedCategory === cat.id ? 'selected' : ''}`}
                id={`wizard-cat-${cat.id}`}
              >
                <div className="category-icon-wrap">
                  {getCategoryIcon(cat.id)}
                </div>
                <div className="category-name">{cat.name}</div>
                <div className="category-desc">{cat.description}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PHASE 2: SELECT SPECIFIC EQUIPMENT */}
      {phase === 'equipment' && (
        <section>
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div className="category-icon-wrap" style={{ width: '28px', height: '28px', margin: 0 }}>
                {getCategoryIcon(selectedCategory)}
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>What are you troubleshooting?</h2>
            </div>
            <p style={{ fontSize: '13px', color: '#ffffff', opacity: 0.85 }}>
              Select component, or choose &ldquo;I don&rsquo;t know&rdquo; for AI identification.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {currentCategoryInfo.items.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectEquipment(item)}
                className="step-option-btn"
                style={{
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  textDecoration: 'none',
                  color: '#ffffff',
                }}
                id={`equip-item-${idx}`}
              >
                <span>{item}</span>
                <ChevronRight size={14} color="var(--emerald-light)" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* PHASE 3: PROBLEM DESCRIPTION & STRUCTURED QUESTIONS */}
      {phase === 'description' && (
        <section>
          <div style={{ marginBottom: '14px' }}>
            <span className="badge badge-solar" style={{ marginBottom: '6px' }}>
              {equipmentType || currentCategoryInfo.name}
            </span>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>Describe what is happening</h2>
            <p style={{ fontSize: '13px', color: '#ffffff', opacity: 0.85 }}>
              Be specific about noises, lights, and timing.
            </p>
          </div>

          <div className="form-group">
            <textarea
              className="form-textarea"
              placeholder='e.g., "My solar generator isn&apos;t charging even though the panel is connected in full sun..."'
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              rows={4}
              id="problem-description-input"
            />
          </div>

          {/* Structured Questions Box */}
          <div className="fix-card" style={{ background: 'var(--bg-secondary)', marginBottom: '14px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', color: 'var(--emerald-light)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={13} />
              <span>Quick Technical Assessment</span>
            </h4>

            {/* Q1: Power Status */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '11px', color: '#ffffff', display: 'block', marginBottom: '4px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                Is the device powered on?
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {['Yes', 'No', "Don't know"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setStructuredAnswers({ ...structuredAnswers, isPowered: opt })}
                    className={`btn btn-secondary ${structuredAnswers.isPowered === opt ? 'btn-primary' : ''}`}
                    style={{ fontSize: '11px', padding: '6px', minHeight: '34px', textDecoration: 'none' }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Q2: Indicator Lights */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '11px', color: '#ffffff', display: 'block', marginBottom: '4px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                Are there indicator lights / active display?
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {['Yes', 'No', 'Blinking'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setStructuredAnswers({ ...structuredAnswers, indicatorLights: opt })}
                    className={`btn btn-secondary ${structuredAnswers.indicatorLights === opt ? 'btn-primary' : ''}`}
                    style={{ fontSize: '11px', padding: '6px', minHeight: '34px', textDecoration: 'none' }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Q3: When problem started */}
            <div>
              <label style={{ fontSize: '11px', color: '#ffffff', display: 'block', marginBottom: '4px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                When did the issue start?
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {['Today', 'Recently', 'Long time ago'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setStructuredAnswers({ ...structuredAnswers, whenStarted: opt })}
                    className={`btn btn-secondary ${structuredAnswers.whenStarted === opt ? 'btn-primary' : ''}`}
                    style={{ fontSize: '11px', padding: '6px', minHeight: '34px', textDecoration: 'none' }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={!problemDescription.trim()}
            onClick={() => setPhase('photos')}
            className="btn btn-primary btn-full"
            id="continue-to-photos-btn"
            style={{ textDecoration: 'none' }}
          >
            <span>Next: Add Photos</span>
            <ChevronRight size={16} />
          </button>
        </section>
      )}

      {/* PHASE 4: PHOTO UPLOAD */}
      {phase === 'photos' && (
        <section>
          <div style={{ marginBottom: '14px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>Add Reference Photos</h2>
            <p style={{ fontSize: '13px', color: '#ffffff', opacity: 0.85 }}>
              Connectors, displays, status LEDs, and labels assist diagnosis.
            </p>
          </div>

          {/* Upload Box */}
          <div
            className="fix-card"
            style={{
              border: '1px dashed var(--emerald-border)',
              background: 'var(--bg-input)',
              textAlign: 'center',
              padding: '20px 14px',
              marginBottom: '12px',
            }}
          >
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoUpload}
              id="file-upload-input"
              style={{ display: 'none' }}
            />
            <label htmlFor="file-upload-input" style={{ cursor: 'pointer', display: 'block' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--emerald-subtle)',
                  border: '1px solid var(--emerald-border)',
                  color: 'var(--emerald-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px auto',
                }}
              >
                <Camera size={22} />
              </div>
              <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px', color: '#ffffff' }}>
                Take photo or upload
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                PNG, JPG, or WEBP
              </div>
            </label>
          </div>

          {/* Demo Reference Photo Button */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
            <button
              type="button"
              onClick={addSamplePhoto}
              className="btn btn-secondary"
              style={{ fontSize: '11px', padding: '6px 12px', minHeight: '32px', textDecoration: 'none' }}
            >
              <Upload size={13} />
              <span>Use Reference Test Image</span>
            </button>
          </div>

          {/* Image Previews */}
          {photos.length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#ffffff', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>
                Attached ({photos.length})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {photos.map((src, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'relative',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      height: '80px',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`Upload ${i + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: 'rgba(0, 0, 0, 0.8)',
                        border: '1px solid #333',
                        color: '#fff',
                        borderRadius: '4px',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleStartAnalysis}
            className="btn btn-primary btn-full"
            id="start-ai-analysis-btn"
            style={{ textDecoration: 'none' }}
          >
            <Sparkles size={16} />
            <span>Begin Step-by-Step Diagnosis</span>
          </button>
        </section>
      )}

      {/* PHASE 5: AI ANALYZING SPINNER */}
      {phase === 'analyzing' && (
        <section style={{ textAlign: 'center', padding: '50px 16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: '2px solid #222222',
              borderTopColor: 'var(--emerald-primary)',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 16px auto',
            }}
          />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '4px', color: '#ffffff' }}>
            Evaluating Circuit & Safety Constraints
          </h3>
          <p style={{ fontSize: '12px', color: '#ffffff', opacity: 0.85, maxWidth: '360px', margin: '0 auto' }}>
            Running open-weight diagnostic engine and formulating initial test step...
          </p>
        </section>
      )}

      {/* PHASE 6: INTERACTIVE TROUBLESHOOTING MODE */}
      {phase === 'troubleshooting' && session && (
        <section>
          {/* Header Summary */}
          <div className="fix-card" style={{ padding: '12px 14px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span className="badge badge-solar">{session.equipmentType}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Step {session.stepsHistory.length + 1}
              </span>
            </div>

            <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '2px', color: '#ffffff' }}>
              {session.initialAssessment || 'Troubleshooting Active'}
            </div>

            <ConfidenceMeter confidence={session.confidence} showExplanation={false} />
          </div>

          {/* Safety Layer */}
          <SafetyBanner level={session.safetyLevel} warnings={session.safetyWarnings} />

          {/* Ranked Hypotheses */}
          {session.likelyCauses && session.likelyCauses.length > 0 && (
            <div className="fix-card" style={{ padding: '12px 14px', marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', fontFamily: 'var(--font-mono)', color: '#ffffff', marginBottom: '8px' }}>
                Ranked Hypotheses ({session.likelyCauses.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {session.likelyCauses.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'var(--bg-secondary)',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      borderLeft: `2px solid ${i === 0 ? 'var(--emerald-primary)' : 'var(--border-subtle)'}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: '#ffffff' }}>
                      <span>{i + 1}. {c.cause}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--emerald-light)' }}>{c.confidence}%</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#ffffff', opacity: 0.8, marginTop: '2px' }}>
                      {c.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current Step Box */}
          {session.currentStep && (
            <div className="step-container" id="current-diagnostic-step">
              <div className="step-indicator">
                <Wrench size={13} />
                <span>Diagnostic Check #{session.currentStep.stepNumber}</span>
              </div>

              <h3 className="step-title">{session.currentStep.title}</h3>
              <p className="step-instruction" style={{ color: '#ffffff', opacity: 0.9 }}>
                {session.currentStep.instruction}
              </p>

              {session.currentStep.warning && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    color: 'var(--accent-amber)',
                    background: 'var(--accent-amber-subtle)',
                    border: '1px solid var(--accent-amber-border)',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '14px',
                  }}
                >
                  <AlertTriangle size={13} />
                  <span>{session.currentStep.warning}</span>
                </div>
              )}

              {session.currentStep.requiresMultimeter && (
                <MultimeterInput
                  unit={session.currentStep.measurementUnit}
                  hint={session.currentStep.measurementHint}
                  onSubmit={(m) => handleStepResponse('Multimeter measurement submitted', m)}
                  onSkip={() => handleStepResponse('No multimeter available')}
                />
              )}

              <div className="step-options-grid">
                {(session.currentStep.options || ['Yes', 'No', 'Not sure']).map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleStepResponse(opt)}
                    className="step-option-btn"
                    id={`step-option-${i}`}
                    style={{ textDecoration: 'none', color: '#ffffff' }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Accumulated Evidence */}
          {session.evidence && (session.evidence.confirmed.length > 0 || session.evidence.ruledOut.length > 0) && (
            <div className="fix-card" style={{ marginTop: '14px', padding: '12px 14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', fontFamily: 'var(--font-mono)', color: '#ffffff', marginBottom: '6px' }}>
                Accumulated Evidence
              </div>
              {session.evidence.confirmed.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--emerald-light)', marginBottom: '3px' }}>
                  <CheckCircle2 size={12} />
                  <span>{item}</span>
                </div>
              ))}
              {session.evidence.ruledOut.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#fca5a5', marginBottom: '3px' }}>
                  <X size={12} />
                  <span style={{ textDecoration: 'line-through' }}>{item}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* PHASE 7: DIAGNOSIS RESULT */}
      {phase === 'result' && session && (
        <section>
          {/* Status Result Hero Card */}
          <div
            className="fix-card"
            style={{
              border:
                session.status === 'solved'
                  ? '1px solid var(--emerald-primary)'
                  : session.status === 'technician_required'
                  ? '1px solid var(--accent-red)'
                  : '1px solid var(--accent-amber)',
              background: 'var(--bg-secondary)',
              textAlign: 'center',
              padding: '22px 16px',
            }}
          >
            {session.status === 'solved' && (
              <>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--emerald-subtle)',
                    border: '1px solid var(--emerald-border)',
                    color: 'var(--emerald-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 10px auto',
                  }}
                >
                  <CheckCircle2 size={26} />
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--emerald-primary)', marginBottom: '4px' }}>
                  Problem Solved!
                </h2>
              </>
            )}

            {session.status === 'technician_required' && (
              <>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--accent-red-subtle)',
                    border: '1px solid var(--accent-red-border)',
                    color: '#f87171',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 10px auto',
                  }}
                >
                  <ShieldAlert size={26} />
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f87171', marginBottom: '4px' }}>
                  Professional Assistance Required
                </h2>
              </>
            )}

            {session.status === 'continue' && (
              <>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--accent-amber-subtle)',
                    border: '1px solid var(--accent-amber-border)',
                    color: '#fbbf24',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 10px auto',
                  }}
                >
                  <Info size={26} />
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fbbf24', marginBottom: '4px' }}>
                  Further Testing Needed
                </h2>
              </>
            )}

            <p style={{ fontSize: '13px', color: '#ffffff', marginTop: '6px', lineHeight: 1.5 }}>
              {session.resolutionSummary}
            </p>

            <div style={{ marginTop: '12px' }}>
              <ConfidenceMeter confidence={session.confidence} showExplanation={true} />
            </div>

            {timerSeconds > 0 && (
              <div style={{ fontSize: '11px', color: '#ffffff', opacity: 0.8, fontFamily: 'var(--font-mono)', marginTop: '8px' }}>
                Completed in {formatTimer(timerSeconds)}
              </div>
            )}
          </div>

          {/* Action Breakdown: Safe User vs Technician */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', marginBottom: '14px' }}>
            {session.safeUserActions && session.safeUserActions.length > 0 && (
              <div className="fix-card" style={{ margin: 0, borderLeft: '3px solid var(--emerald-primary)' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', fontFamily: 'var(--font-mono)', color: 'var(--emerald-light)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={14} />
                  <span>Safe DIY Checks</span>
                </h4>
                <ul style={{ paddingLeft: '18px', fontSize: '12px', color: '#ffffff', opacity: 0.9, lineHeight: 1.55 }}>
                  {session.safeUserActions.map((act, i) => (
                    <li key={i}>{act}</li>
                  ))}
                </ul>
              </div>
            )}

            {session.technicianActions && session.technicianActions.length > 0 && (
              <div className="fix-card" style={{ margin: 0, borderLeft: '3px solid var(--accent-red)' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', fontFamily: 'var(--font-mono)', color: '#fca5a5', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Wrench size={14} />
                  <span>Technician Handover Brief</span>
                </h4>
                <ul style={{ paddingLeft: '18px', fontSize: '12px', color: '#ffffff', opacity: 0.9, lineHeight: 1.55 }}>
                  {session.technicianActions.map((act, i) => (
                    <li key={i}>{act}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Evidence Checklist */}
          {session.evidence && session.evidence.confirmed.length > 0 && (
            <div className="fix-card" style={{ marginBottom: '14px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '8px', color: '#ffffff' }}>
                Diagnostic Evidence Collected
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {session.evidence.confirmed.map((ev, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '12px', color: '#ffffff', opacity: 0.9 }}>
                    <CheckCircle2 size={13} color="var(--emerald-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{ev}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Link
              href={`/diagnosis/${session.id}`}
              className="btn btn-primary btn-full"
              id="view-full-report-btn"
              style={{ textDecoration: 'none' }}
            >
              <BookmarkCheck size={16} />
              <span>Save & View Full Report</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                setSession(null);
                setPhase('category');
              }}
              className="btn btn-secondary btn-full"
              style={{ textDecoration: 'none' }}
            >
              <RotateCcw size={15} />
              <span>Start Another Diagnosis</span>
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export default function DiagnosePage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: '#ffffff' }}>Loading FixIt AI...</div>}>
      <DiagnoseContent />
    </Suspense>
  );
}
