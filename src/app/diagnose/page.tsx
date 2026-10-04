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
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  Zap,
  HelpCircle,
  Clock,
  Sparkles,
  Info,
  Wrench,
  BookmarkCheck,
} from 'lucide-react';
import { CATEGORIES } from '@/lib/diagnosticEngine';
import { saveSession, getSessionById } from '@/lib/storage';
import {
  EquipmentCategory,
  DiagnosticSession,
  DiagnosticStep,
  PossibleCause,
  SafetyLevel,
} from '@/types/diagnosis';
import ConfidenceMeter from '@/components/ConfidenceMeter';
import SafetyBanner from '@/components/SafetyBanner';
import MultimeterInput from '@/components/MultimeterInput';

function DiagnoseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Wizard Phases:
  // 'category' -> 'equipment' -> 'description' -> 'photos' -> 'analyzing' -> 'troubleshooting' -> 'result'
  const [phase, setPhase] = useState<
    'category' | 'equipment' | 'description' | 'photos' | 'analyzing' | 'troubleshooting' | 'result'
  >('category');

  // Input states
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
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Active Session & AI State
  const [session, setSession] = useState<DiagnosticSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(false);

  // Check URL query parameters for demo or category preselect
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
      // Preload sample visual reference
      setPhotos([
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%231e293b"/><text x="50%" y="45%" fill="%2338bdf8" font-family="sans-serif" font-weight="bold" font-size="16" text-anchor="middle">☀️ Solar Input Port Connected</text><text x="50%" y="65%" fill="%2394a3b8" font-family="sans-serif" font-size="13" text-anchor="middle">LCD Input: 0 Watts (No DC Flow)</text></svg>',
      ]);
      setPhase('photos');
    } else if (cat && ['solar', 'electrical', 'electronics', 'appliances'].includes(cat)) {
      setSelectedCategory(cat);
      setPhase('equipment');
    }
  }, [searchParams]);

  // Elapsed timer tracking for the session
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
        setPhotoPreview(result);
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const addSamplePhoto = () => {
    const sample =
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%230f172a"/><rect x="40" y="40" width="220" height="120" rx="8" fill="%231e293b" stroke="%2338bdf8" stroke-width="2"/><text x="150" y="95%" fill="%2394a3b8" font-size="12" text-anchor="middle">Reference Test Equipment</text><text x="150" y="105" fill="%2338bdf8" font-family="monospace" font-size="18" text-anchor="middle">INPUT: 0W</text></svg>';
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

        // Transition to troubleshooting
        setTimeout(() => {
          setIsLoading(false);
          setPhase('troubleshooting');
        }, 800);
      } else {
        throw new Error(data.error || 'Failed to start diagnosis');
      }
    } catch (e) {
      console.error(e);
      setIsLoading(false);
      // Fallback local recovery
      setPhase('troubleshooting');
    }
  };

  // User submits an answer to a troubleshooting step
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
        >
          <ArrowLeft size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            FixIt AI Session
          </span>
          {timerActive && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent-cyan)',
                background: 'rgba(0, 210, 255, 0.1)',
                padding: '2px 6px',
                borderRadius: '4px',
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
            <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Select Equipment Domain</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
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
                <div className="category-icon">{cat.icon}</div>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ fontSize: '20px' }}>{currentCategoryInfo.icon}</span>
              <h2 style={{ fontSize: '20px', fontWeight: 800 }}>What are you troubleshooting?</h2>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Select the exact component, or choose &ldquo;I don&rsquo;t know&rdquo; to have the AI identify it.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                }}
                id={`equip-item-${idx}`}
              >
                <span>{item}</span>
                <ChevronRight size={16} color="var(--text-muted)" />
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
            <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Describe what is happening</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Be as specific as you can. Mention noises, lights, and when it occurred.
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

          {/* Structured Questions Layer */}
          <div className="fix-card" style={{ background: 'var(--bg-secondary)', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} color="var(--accent-cyan)" />
              <span>Quick Technical Context</span>
            </h4>

            {/* Q1: Power Status */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Is the device powered on / showing any power?
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {['Yes', 'No', "Don't know"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setStructuredAnswers({ ...structuredAnswers, isPowered: opt })}
                    className={`btn btn-secondary ${structuredAnswers.isPowered === opt ? 'btn-primary' : ''}`}
                    style={{ fontSize: '12px', padding: '6px', minHeight: '36px' }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Q2: Indicator Lights */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Are there any indicator lights or screen active?
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {['Yes', 'No', 'Blinking'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setStructuredAnswers({ ...structuredAnswers, indicatorLights: opt })}
                    className={`btn btn-secondary ${structuredAnswers.indicatorLights === opt ? 'btn-primary' : ''}`}
                    style={{ fontSize: '12px', padding: '6px', minHeight: '36px' }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Q3: When problem started */}
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                When did the issue start?
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {['Today', 'Recently', 'Long time ago'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setStructuredAnswers({ ...structuredAnswers, whenStarted: opt })}
                    className={`btn btn-secondary ${structuredAnswers.whenStarted === opt ? 'btn-primary' : ''}`}
                    style={{ fontSize: '12px', padding: '6px', minHeight: '36px' }}
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
          >
            <span>Next: Add Photos</span>
            <ChevronRight size={18} />
          </button>
        </section>
      )}

      {/* PHASE 4: PHOTO UPLOAD */}
      {phase === 'photos' && (
        <section>
          <div style={{ marginBottom: '14px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Add Photos (Recommended)</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Clear photos of connectors, display screens, labels, and wiring assist the visual reasoning model.
            </p>
          </div>

          {/* Upload Box */}
          <div
            className="fix-card"
            style={{
              border: '2px dashed var(--border-highlight)',
              background: 'var(--bg-input)',
              textAlign: 'center',
              padding: '24px 16px',
              cursor: 'pointer',
              marginBottom: '16px',
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
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: 'rgba(0, 210, 255, 0.1)',
                  color: 'var(--accent-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px auto',
                }}
              >
                <Camera size={26} />
              </div>
              <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>
                Take a photo or choose from device
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                PNG, JPG, or WEBP &bull; Camera capture on mobile
              </div>
            </label>
          </div>

          {/* Fast Reference Demo Photo Button */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <button
              type="button"
              onClick={addSamplePhoto}
              className="btn btn-secondary"
              style={{ fontSize: '12px', padding: '6px 12px', minHeight: '34px' }}
            >
              <Upload size={14} />
              <span>Insert Demo Reference Image</span>
            </button>
          </div>

          {/* Image Previews */}
          {photos.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Uploaded Images ({photos.length})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {photos.map((src, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'relative',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      height: '90px',
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
                        background: 'rgba(0, 0, 0, 0.7)',
                        border: 'none',
                        color: '#fff',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              type="button"
              onClick={handleStartAnalysis}
              className="btn btn-primary btn-full"
              id="start-ai-analysis-btn"
            >
              <Sparkles size={18} />
              <span>Begin AI Diagnostic Process</span>
            </button>
          </div>
        </section>
      )}

      {/* PHASE 5: AI ANALYZING SPINNER */}
      {phase === 'analyzing' && (
        <section style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              border: '3px solid rgba(0, 210, 255, 0.2)',
              borderTopColor: 'var(--accent-cyan)',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px auto',
            }}
          />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>
            Evaluating Circuit & Symptoms
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '380px', margin: '0 auto' }}>
            Running open-weight diagnostic engine, inspecting safety constraints, and generating hypotheses...
          </p>
        </section>
      )}

      {/* PHASE 6: INTERACTIVE TROUBLESHOOTING MODE (One test at a time!) */}
      {phase === 'troubleshooting' && session && (
        <section>
          {/* Header Summary */}
          <div className="fix-card" style={{ padding: '14px 16px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span className="badge badge-solar">{session.equipmentType}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Step {session.stepsHistory.length + 1}
              </span>
            </div>

            <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>
              {session.initialAssessment || 'Troubleshooting Active'}
            </div>

            <ConfidenceMeter confidence={session.confidence} showExplanation={false} />
          </div>

          {/* Safety Layer (Priority over troubleshooting) */}
          <SafetyBanner level={session.safetyLevel} warnings={session.safetyWarnings} />

          {/* Ranked Hypotheses Accordion */}
          {session.likelyCauses && session.likelyCauses.length > 0 && (
            <div className="fix-card" style={{ padding: '12px 14px', marginBottom: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px' }}>
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
                      borderLeft: `3px solid ${i === 0 ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600 }}>
                      <span>
                        {i + 1}. {c.cause}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        {c.confidence}%
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {c.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current Diagnostic Step Container */}
          {session.currentStep && (
            <div className="step-container" id="current-diagnostic-step">
              <div className="step-indicator">
                <Wrench size={13} />
                <span>Diagnostic Check #{session.currentStep.stepNumber}</span>
              </div>

              <h3 className="step-title">{session.currentStep.title}</h3>

              <p className="step-instruction">{session.currentStep.instruction}</p>

              {session.currentStep.warning && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    color: '#fbbf24',
                    background: 'rgba(245, 158, 11, 0.1)',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '16px',
                  }}
                >
                  <AlertTriangle size={14} />
                  <span>{session.currentStep.warning}</span>
                </div>
              )}

              {/* Multimeter measurement input if step requests it */}
              {session.currentStep.requiresMultimeter && (
                <MultimeterInput
                  unit={session.currentStep.measurementUnit}
                  hint={session.currentStep.measurementHint}
                  onSubmit={(m) => handleStepResponse('Multimeter measurement submitted', m)}
                  onSkip={() => handleStepResponse('No multimeter available')}
                />
              )}

              {/* Standard Options Grid */}
              <div className="step-options-grid">
                {(session.currentStep.options || ['Yes', 'No', 'Not sure']).map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleStepResponse(opt)}
                    className="step-option-btn"
                    id={`step-option-${i}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Evidence Gathered So Far */}
          {session.evidence && (session.evidence.confirmed.length > 0 || session.evidence.ruledOut.length > 0) && (
            <div className="fix-card" style={{ marginTop: '16px', padding: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Accumulated Evidence
              </div>
              {session.evidence.confirmed.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#86efac', marginBottom: '4px' }}>
                  <CheckCircle2 size={13} />
                  <span>{item}</span>
                </div>
              ))}
              {session.evidence.ruledOut.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#fca5a5', marginBottom: '4px' }}>
                  <X size={13} />
                  <span style={{ textDecoration: 'line-through' }}>{item}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* PHASE 7: DIAGNOSIS RESULT (Solved, Continue, Technician Required) */}
      {phase === 'result' && session && (
        <section>
          {/* Status Result Hero Card */}
          <div
            className="fix-card"
            style={{
              border:
                session.status === 'solved'
                  ? '1px solid #10b981'
                  : session.status === 'technician_required'
                  ? '1px solid #ef4444'
                  : '1px solid #f59e0b',
              background:
                session.status === 'solved'
                  ? 'linear-gradient(180deg, rgba(16, 185, 129, 0.12) 0%, var(--bg-card) 100%)'
                  : session.status === 'technician_required'
                  ? 'linear-gradient(180deg, rgba(239, 68, 68, 0.12) 0%, var(--bg-card) 100%)'
                  : 'linear-gradient(180deg, rgba(245, 158, 11, 0.12) 0%, var(--bg-card) 100%)',
              textAlign: 'center',
              padding: '24px 18px',
            }}
          >
            {session.status === 'solved' && (
              <>
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#34d399',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px auto',
                  }}
                >
                  <CheckCircle2 size={32} />
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#34d399', marginBottom: '6px' }}>
                  Problem Solved!
                </h2>
              </>
            )}

            {session.status === 'technician_required' && (
              <>
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    background: 'rgba(239, 68, 68, 0.2)',
                    color: '#f87171',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px auto',
                  }}
                >
                  <ShieldAlert size={32} />
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#f87171', marginBottom: '6px' }}>
                  Professional Assistance Required
                </h2>
              </>
            )}

            {session.status === 'continue' && (
              <>
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    background: 'rgba(245, 158, 11, 0.2)',
                    color: '#fbbf24',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px auto',
                  }}
                >
                  <Info size={32} />
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#fbbf24', marginBottom: '6px' }}>
                  Further Testing Needed
                </h2>
              </>
            )}

            <p style={{ fontSize: '14px', color: 'var(--text-primary)', marginTop: '8px', lineHeight: 1.5 }}>
              {session.resolutionSummary}
            </p>

            <div style={{ marginTop: '14px' }}>
              <ConfidenceMeter confidence={session.confidence} showExplanation={true} />
            </div>

            {timerSeconds > 0 && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '8px' }}>
                Diagnosis completed in {formatTimer(timerSeconds)}
              </div>
            )}
          </div>

          {/* Section 16: Safe User Action vs Technician Action */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px', marginBottom: '18px' }}>
            {session.safeUserActions && session.safeUserActions.length > 0 && (
              <div className="fix-card" style={{ margin: 0, borderLeft: '4px solid #10b981' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#6ee7b7', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={16} />
                  <span>Safe DIY Checks</span>
                </h4>
                <ul style={{ paddingLeft: '20px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {session.safeUserActions.map((act, i) => (
                    <li key={i}>{act}</li>
                  ))}
                </ul>
              </div>
            )}

            {session.technicianActions && session.technicianActions.length > 0 && (
              <div className="fix-card" style={{ margin: 0, borderLeft: '4px solid #ef4444' }}>
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
          </div>

          {/* Evidence Checklist */}
          {session.evidence && session.evidence.confirmed.length > 0 && (
            <div className="fix-card" style={{ marginBottom: '18px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px' }}>Diagnostic Evidence Collected</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {session.evidence.confirmed.map((ev, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <CheckCircle2 size={14} color="#34d399" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{ev}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link
              href={`/diagnosis/${session.id}`}
              className="btn btn-primary btn-full"
              id="view-full-report-btn"
            >
              <BookmarkCheck size={18} />
              <span>Save & View Full Report</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                setSession(null);
                setPhase('category');
              }}
              className="btn btn-secondary btn-full"
            >
              <RotateCcw size={16} />
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
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Loading FixIt AI...</div>}>
      <DiagnoseContent />
    </Suspense>
  );
}
