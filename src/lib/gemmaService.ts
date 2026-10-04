import {
  DiagnosticSession,
  DiagnosticStep,
  EquipmentCategory,
  PossibleCause,
  ResolutionStatus,
  SafetyLevel,
} from '@/types/diagnosis';

export interface GemmaConfig {
  provider: 'groq' | 'ollama' | 'openrouter' | 'huggingface' | 'local_engine';
  apiKey?: string;
  baseUrl?: string;
  model: string;
}

export const DEFAULT_GEMMA_CONFIG: GemmaConfig = {
  provider: 'groq',
  model: 'gemma2-9b-it',
  baseUrl: 'http://localhost:11434', // default Ollama local port
};

export const GEMMA_SYSTEM_PROMPT = `You are FixIt AI, an expert technical troubleshooting assistant powered by Google Gemma open-weight models.
Your role is to help users diagnose common electrical, electronic, solar, and appliance problems through an interactive, step-by-step diagnostic process.

CRITICAL OPERATIONAL RULES:
1. SAFETY FIRST: If symptoms indicate danger (smoke, sparks, burnt odor, water submersion, electric shock, swollen lithium batteries, exposed high mains voltage 110V-240V), immediately classify safety_level as "danger_technician_required", halt DIY steps, and provide a technician handover brief.
2. ONE STEP AT A TIME: Never output a wall of 15 instructions. Provide exactly ONE clear, non-hazardous diagnostic test at a time.
3. STRUCTURED JSON ONLY: You must respond in valid JSON conforming to the requested schema. No markdown formatting outside of JSON.
4. CONFIDENCE ESTIMATION: Estimate confidence as a percentage (0-100) reflecting diagnostic certainty, not absolute claims.
5. TECHNICAL SEPARATION: Always distinguish between Safe User Actions and Technician Actions.`;

/**
 * Formulate initial analysis prompt for Gemma-2
 */
export function buildGemmaInitialPrompt(
  category: EquipmentCategory,
  equipment: string,
  problem: string,
  structuredAnswers?: Record<string, string>,
  hasPhotos?: boolean
): string {
  return `Analyze this equipment problem and return the initial diagnostic assessment:

Equipment Domain: ${category.toUpperCase()}
Equipment Type: ${equipment}
Reported Problem: "${problem}"
Observations:
- Powered on: ${structuredAnswers?.isPowered || 'Unknown'}
- Indicators: ${structuredAnswers?.indicatorLights || 'Unknown'}
- Worked previously: ${structuredAnswers?.workedPreviously || 'Unknown'}
- When started: ${structuredAnswers?.whenStarted || 'Unknown'}
- Photos provided: ${hasPhotos ? 'Yes' : 'No'}

Return JSON matching this exact structure:
{
  "initialAssessment": "Short concise summary of likely subsystem affected",
  "likelyCauses": [
    {
      "cause": "Specific cause",
      "confidence": 70,
      "explanation": "Why this cause is suspected"
    }
  ],
  "confidence": 70,
  "safetyLevel": "safe" | "caution" | "danger_technician_required",
  "safetyWarnings": ["Warning 1", "Warning 2"],
  "firstStep": {
    "title": "Title of first check",
    "instruction": "Clear, single-action instruction for the user to observe or test",
    "warning": "Optional safety reminder",
    "responseType": "yes_no" | "yes_no_unsure" | "choice" | "multimeter",
    "options": ["Option 1", "Option 2", "Not sure"],
    "requiresMultimeter": false
  }
}`;
}

/**
 * Formulate step transition prompt for Gemma-2
 */
export function buildGemmaStepPrompt(
  session: DiagnosticSession,
  lastStep: DiagnosticStep,
  userResponse: string,
  measurement?: { voltage?: number; current?: number; resistance?: number; unit?: string }
): string {
  return `Evaluate this user test observation and determine the next step or resolution:

Domain: ${session.category.toUpperCase()}
Equipment: ${session.equipmentType}
Original Problem: "${session.problemDescription}"

Previous Evidence Gathered:
${session.evidence?.confirmed?.map((e) => `Confirmed: ${e}`).join('\n') || 'None yet'}
${session.evidence?.ruledOut?.map((e) => `Ruled out: ${e}`).join('\n') || ''}
${session.evidence?.measurements?.map((m) => `Measurement: ${m.label} = ${m.value} (${m.assessment})`).join('\n') || ''}

Current Test Step:
Title: ${lastStep.title}
Instruction: ${lastStep.instruction}
User's Observation/Result: "${userResponse}"
${measurement?.voltage ? `User Multimeter Reading: ${measurement.voltage} ${measurement.unit || 'V'}` : ''}

Determine whether the problem is solved, needs a technician, or requires the next test check.
Return JSON matching this exact structure:
{
  "status": "diagnosing" | "solved" | "continue" | "technician_required",
  "updatedConfidence": 85,
  "evidenceLearned": {
    "type": "confirmed" | "ruledOut",
    "text": "Fact established from this test"
  },
  "nextStep": {
    "title": "Title of next check",
    "instruction": "Single clear instruction",
    "warning": "Safety note if relevant",
    "responseType": "yes_no" | "yes_no_unsure" | "choice" | "multimeter",
    "options": ["Yes", "No", "Not sure"],
    "requiresMultimeter": false,
    "measurementUnit": "V DC"
  },
  "resolutionSummary": "Summary if solved or technician required",
  "safeUserActions": ["Action 1", "Action 2"],
  "technicianActions": ["Inspection 1", "Inspection 2"]
}`;
}

/**
 * Call live Gemma model via Groq, Ollama, OpenRouter, or HuggingFace
 */
export async function callGemmaInference(
  prompt: string,
  config?: Partial<GemmaConfig>
): Promise<any | null> {
  const envGroqKey = process.env.GROQ_API_KEY;
  const envOpenRouterKey = process.env.OPENROUTER_API_KEY;
  const envHfKey = process.env.HUGGINGFACE_API_KEY;
  const envOllamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

  const activeApiKey = config?.apiKey || envGroqKey || envOpenRouterKey || envHfKey;

  // 1. Try Groq (Ultra-fast Gemma-2 9B inference)
  if (activeApiKey && (config?.provider === 'groq' || !config?.provider || envGroqKey)) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeApiKey}`,
        },
        body: JSON.stringify({
          model: 'gemma2-9b-it',
          messages: [
            { role: 'system', content: GEMMA_SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          return JSON.parse(content);
        }
      }
    } catch (e) {
      console.warn('Groq Gemma call failed, trying next provider or local fallback:', e);
    }
  }

  // 2. Try Local Ollama (Offline / zero-internet Gemma 2)
  const ollamaUrl = config?.baseUrl || envOllamaUrl;
  try {
    const res = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config?.model || 'gemma2:9b',
        messages: [
          { role: 'system', content: GEMMA_SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        format: 'json',
        stream: false,
      }),
      // Short timeout so app never hangs if Ollama is not started
      signal: AbortSignal.timeout(3500),
    });

    if (res.ok) {
      const data = await res.json();
      const content = data.message?.content;
      if (content) {
        return JSON.parse(content);
      }
    }
  } catch (e) {
    // Local Ollama offline, continue
  }

  // 3. Try OpenRouter Gemma-2
  if (activeApiKey && (config?.provider === 'openrouter' || envOpenRouterKey)) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeApiKey}`,
        },
        body: JSON.stringify({
          model: 'google/gemma-2-9b-it',
          messages: [
            { role: 'system', content: GEMMA_SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          return JSON.parse(content);
        }
      }
    } catch (e) {
      console.warn('OpenRouter Gemma call failed:', e);
    }
  }

  return null;
}
