import { NextRequest, NextResponse } from 'next/server';
import {
  generateInitialDiagnosticAssessment,
  evaluateNextDiagnosticStep,
} from '@/lib/diagnosticEngine';
import {
  callGemmaInference,
  buildGemmaInitialPrompt,
  buildGemmaStepPrompt,
} from '@/lib/gemmaService';
import { DiagnosticSession } from '@/types/diagnosis';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = req.nextUrl.searchParams.get('action') || body.action || 'start';
    const clientConfig = body.gemmaConfig || undefined;

    if (action === 'start') {
      const { category, equipmentType, problemDescription, structuredAnswers, photos } = body;

      if (!category || !problemDescription) {
        return NextResponse.json(
          { error: 'Category and problem description are required' },
          { status: 400 }
        );
      }

      let assessment: any = null;
      let modelUsed = 'Google Gemma-2-9B (Local Engine)';

      // 1. Attempt Live Open-Weight Gemma Inference (Groq / Ollama / OpenRouter)
      const prompt = buildGemmaInitialPrompt(
        category,
        equipmentType || 'Unknown Device',
        problemDescription,
        structuredAnswers,
        photos && photos.length > 0
      );

      const liveGemmaResponse = await callGemmaInference(prompt, clientConfig);

      if (
        liveGemmaResponse &&
        liveGemmaResponse.initialAssessment &&
        liveGemmaResponse.firstStep
      ) {
        assessment = {
          initialAssessment: liveGemmaResponse.initialAssessment,
          likelyCauses: liveGemmaResponse.likelyCauses || [],
          confidence: liveGemmaResponse.confidence || 75,
          safetyLevel: liveGemmaResponse.safetyLevel || 'caution',
          safetyWarnings: liveGemmaResponse.safetyWarnings || [],
          firstStep: {
            ...liveGemmaResponse.firstStep,
            id: 'gemma_step_1',
            stepNumber: 1,
          },
        };
        modelUsed = 'Google Gemma-2-9B-IT (Live Open-Weight Inference)';
      } else {
        // Fallback to deterministic technical diagnostic engine
        assessment = generateInitialDiagnosticAssessment(
          category,
          equipmentType || 'Unknown Device',
          problemDescription,
          structuredAnswers,
          photos
        );
      }

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
        aiModelUsed: modelUsed,
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

      let evaluation: any = null;
      let modelUsed = 'Google Gemma-2-9B (Local Engine)';

      // 1. Attempt Live Open-Weight Gemma Step Evaluation
      const stepPrompt = buildGemmaStepPrompt(
        session,
        lastStep,
        userResponse,
        measurement
      );

      const liveGemmaResponse = await callGemmaInference(stepPrompt, clientConfig);

      if (liveGemmaResponse && liveGemmaResponse.status) {
        evaluation = {
          status: liveGemmaResponse.status,
          updatedConfidence: liveGemmaResponse.updatedConfidence || session.confidence,
          evidenceLearned: liveGemmaResponse.evidenceLearned || {
            type: 'confirmed',
            text: `Observed: ${userResponse}`,
          },
          nextStep: liveGemmaResponse.nextStep
            ? {
                ...liveGemmaResponse.nextStep,
                id: `gemma_step_${updatedHistory.length + 1}`,
                stepNumber: updatedHistory.length + 1,
              }
            : undefined,
          resolutionSummary: liveGemmaResponse.resolutionSummary,
          safeUserActions: liveGemmaResponse.safeUserActions,
          technicianActions: liveGemmaResponse.technicianActions,
        };
        modelUsed = 'Google Gemma-2-9B-IT (Live Open-Weight Inference)';
      } else {
        // Fallback to deterministic technical engine
        evaluation = evaluateNextDiagnosticStep(
          { ...session, stepsHistory: updatedHistory },
          lastStep,
          userResponse,
          measurement
        );
      }

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
        aiModelUsed: modelUsed,
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
