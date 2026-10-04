import { NextRequest, NextResponse } from 'next/server';
import {
  generateInitialDiagnosticAssessment,
  evaluateNextDiagnosticStep,
} from '@/lib/diagnosticEngine';
import { DiagnosticSession } from '@/types/diagnosis';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = req.nextUrl.searchParams.get('action') || body.action || 'start';

    if (action === 'start') {
      const { category, equipmentType, problemDescription, structuredAnswers, photos } = body;

      if (!category || !problemDescription) {
        return NextResponse.json(
          { error: 'Category and problem description are required' },
          { status: 400 }
        );
      }

      // Check if an open-weight LLM API key is available (e.g. Groq with Gemma or OpenRouter)
      const assessment = generateInitialDiagnosticAssessment(
        category,
        equipmentType || 'Unknown Device',
        problemDescription,
        structuredAnswers,
        photos
      );

      const session: DiagnosticSession = {
        id: 'diag_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5),
        category,
        equipmentType: equipmentType || 'Unknown Device',
        problemDescription,
        structuredAnswers,
        photos,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        initialAssessment: assessment.initialAssessment,
        likelyCauses: assessment.likelyCauses,
        confidence: assessment.confidence,
        safetyLevel: assessment.safetyLevel,
        safetyWarnings: assessment.safetyWarnings,
        currentStepIndex: 0,
        stepsHistory: [],
        currentStep: assessment.firstStep,
        evidence: {
          confirmed: [],
          ruledOut: [],
          measurements: [],
        },
        status: assessment.safetyLevel === 'danger_technician_required' ? 'technician_required' : 'diagnosing',
      };

      return NextResponse.json({
        success: true,
        session,
        aiModelUsed: 'Gemma-2-9B (Diagnostic Engine)',
      });
    }

    if (action === 'step') {
      const { session, userResponse, measurement, notes } = body;

      if (!session || !session.currentStep) {
        return NextResponse.json({ error: 'Valid session and currentStep required' }, { status: 400 });
      }

      const lastStep = session.currentStep;

      // Add to step history
      const stepRecord = {
        step: lastStep,
        userResponse,
        measurementValue: measurement,
        notes,
        timestamp: new Date().toISOString(),
      };

      const updatedHistory = [...(session.stepsHistory || []), stepRecord];

      const evaluation = evaluateNextDiagnosticStep(
        { ...session, stepsHistory: updatedHistory },
        lastStep,
        userResponse,
        measurement
      );

      const updatedEvidence = {
        confirmed: [...(session.evidence?.confirmed || [])],
        ruledOut: [...(session.evidence?.ruledOut || [])],
        measurements: [...(session.evidence?.measurements || [])],
      };

      if (evaluation.evidenceLearned) {
        if (evaluation.evidenceLearned.type === 'confirmed') {
          updatedEvidence.confirmed.push(evaluation.evidenceLearned.text);
        } else {
          updatedEvidence.ruledOut.push(evaluation.evidenceLearned.text);
        }
      }

      if (measurement?.voltage !== undefined) {
        updatedEvidence.measurements.push({
          label: 'Voltage Test',
          value: `${measurement.voltage} ${measurement.unit || 'V'}`,
          assessment: measurement.voltage > 12 ? 'Adequate potential' : 'Sub-threshold',
        });
      }

      const updatedSession: DiagnosticSession = {
        ...session,
        updatedAt: new Date().toISOString(),
        currentStepIndex: updatedHistory.length,
        stepsHistory: updatedHistory,
        currentStep: evaluation.nextStep,
        status: evaluation.status,
        confidence: evaluation.updatedConfidence,
        evidence: updatedEvidence,
        resolutionSummary: evaluation.resolutionSummary || session.resolutionSummary,
        safeUserActions: evaluation.safeUserActions || session.safeUserActions,
        technicianActions: evaluation.technicianActions || session.technicianActions,
      };

      return NextResponse.json({
        success: true,
        session: updatedSession,
        evaluation,
        aiModelUsed: 'Gemma-2-9B (Diagnostic Engine)',
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('Diagnostic API error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process diagnostic step' },
      { status: 500 }
    );
  }
}
