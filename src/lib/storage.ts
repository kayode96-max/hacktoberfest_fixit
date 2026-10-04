import { DiagnosticSession } from '@/types/diagnosis';

const STORAGE_KEY = 'fixit_ai_sessions_v1';
const SETTINGS_KEY = 'fixit_ai_settings_v1';

export interface AppSettings {
  aiModel: string;
  theme: 'dark' | 'light' | 'system';
  strictSafety: boolean;
  multimeterMode: boolean;
  hapticFeedback: boolean;
  apiEndpoint?: string;
  apiKey?: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  aiModel: 'gemma-2-9b-it',
  theme: 'dark',
  strictSafety: true,
  multimeterMode: true,
  hapticFeedback: true,
};

const SEED_SESSIONS: DiagnosticSession[] = [
  {
    id: 'diag-seed-solar-01',
    category: 'solar',
    equipmentType: 'Solar generator / portable power station',
    problemDescription: 'My solar generator isn’t charging even though the 200W panel is connected in full daylight.',
    structuredAnswers: {
      isPowered: 'Yes',
      indicatorLights: 'No indicator',
      workedPreviously: 'Yes',
      whenStarted: 'Today',
    },
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 3600 * 1000 + 134 * 1000).toISOString(),
    initialAssessment: 'Possible charging-path discontinuity or DC protection lockout',
    likelyCauses: [
      {
        cause: 'DC inline breaker or isolator switched OFF',
        confidence: 94,
        explanation: 'Inline protection toggle opened during cable positioning or trip event.',
      },
      {
        cause: 'MC4 connector unseated',
        confidence: 45,
        explanation: 'Positive pin was not locked past the retention barb.',
      },
      {
        cause: 'Panel open-circuit voltage out of range',
        confidence: 20,
        explanation: 'Voltage mismatch against MPPT controller.',
      },
    ],
    confidence: 94,
    safetyLevel: 'caution',
    safetyWarnings: [
      'Solar panels generate live DC whenever exposed to ambient light.',
      'Do not short-circuit solar cables or touch bare metal pins.',
    ],
    currentStepIndex: 2,
    stepsHistory: [
      {
        step: {
          id: 'step_1',
          stepNumber: 1,
          title: 'Check the solar input indicator on the display',
          instruction: 'Is the solar input indicator showing that a panel is connected?',
          responseType: 'yes_no',
        },
        userResponse: 'No',
        timestamp: new Date(Date.now() - 24 * 3600 * 1000 + 35 * 1000).toISOString(),
      },
      {
        step: {
          id: 'step_2',
          stepNumber: 2,
          title: 'Inspect the DC breaker between panel and device',
          instruction: 'Is the inline DC breaker switched to the ON position?',
          responseType: 'yes_no',
        },
        userResponse: 'No (It was OFF)',
        timestamp: new Date(Date.now() - 24 * 3600 * 1000 + 95 * 1000).toISOString(),
      },
    ],
    evidence: {
      confirmed: [
        'Device is powered on with 64% battery',
        'LCD input wattage meter registers 0W with solar panel connected',
        'Inline DC breaker was in the OFF position',
      ],
      ruledOut: ['Internal AC inverter fault', 'Display hardware failure'],
      measurements: [],
    },
    status: 'solved',
    resolutionSummary:
      'Problem Solved: The inline DC breaker between the solar panel and power station was switched OFF. Engaging the breaker restored normal 165W charging input.',
    safeUserActions: [
      'Ensure the DC breaker toggle is securely latched in the ON position.',
      'Inspect MC4 connectors for tight weather seals.',
      'Monitor display input wattage as sun angle changes.',
    ],
    technicianActions: [
      'If breaker trips again under normal sunlight, call technician to inspect solar string for short-circuit or reverse polarity.',
    ],
    timeElapsedSeconds: 134,
  },
  {
    id: 'diag-seed-fan-02',
    category: 'appliances',
    equipmentType: 'Standing / Desk fan',
    problemDescription: 'Standing fan hums when switched to speed 1, 2, or 3, but the blades do not rotate at all.',
    structuredAnswers: {
      isPowered: 'Yes',
      indicatorLights: 'Hums',
      workedPreviously: 'Yes',
      whenStarted: 'Recently',
    },
    createdAt: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 24 * 3600 * 1000 + 190 * 1000).toISOString(),
    initialAssessment: 'Motor shaft bearing seizure or start capacitor degradation',
    likelyCauses: [
      {
        cause: 'Dry brass bushing / hair-bound rotor shaft',
        confidence: 85,
        explanation: 'Rotor lacks initial torque due to mechanical friction.',
      },
      {
        cause: 'Starting capacitor open-circuit',
        confidence: 60,
        explanation: 'Failed capacitor cannot create phase displacement to start rotation.',
      },
    ],
    confidence: 85,
    safetyLevel: 'safe',
    safetyWarnings: [
      'Disconnect power cord completely before removing blade cage or touching rotor shaft.',
    ],
    currentStepIndex: 2,
    stepsHistory: [
      {
        step: {
          id: 'fan_step_1',
          stepNumber: 1,
          title: 'Manual rotation friction check',
          instruction: 'With the fan UNPLUGGED, spin the blade with your finger. Does it spin freely?',
          responseType: 'choice',
        },
        userResponse: 'Stiff / Stops immediately',
        timestamp: new Date(Date.now() - 6 * 24 * 3600 * 1000 + 40 * 1000).toISOString(),
      },
    ],
    evidence: {
      confirmed: [
        'Motor hums indicating primary coil receives AC voltage',
        'Rotor shaft is physically stiff to turn by hand',
      ],
      ruledOut: ['Blown thermal fuse', 'Broken wall plug wire'],
      measurements: [],
    },
    status: 'solved',
    resolutionSummary:
      'Mechanical friction resolved: Removed front grill and cleared wound hair/lint from front brass bushing. Applied synthetic lubricating oil to shaft.',
    safeUserActions: [
      'Keep grill and motor vents free of hair and pet fur.',
      'Unplug fan when not in use for extended periods.',
    ],
    technicianActions: [
      'If motor continues to run hot, replace sealed sleeve bearings or start capacitor.',
    ],
    timeElapsedSeconds: 190,
  },
  {
    id: 'diag-seed-adapter-03',
    category: 'electronics',
    equipmentType: 'AC/DC Power supply / Adapter',
    problemDescription: 'Laptop power adapter becomes extremely hot to the touch and smells slightly like warm plastic.',
    structuredAnswers: {
      isPowered: 'Yes',
      indicatorLights: 'Blinking',
      workedPreviously: 'Yes',
      whenStarted: 'Today',
    },
    createdAt: new Date(Date.now() - 9 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 9 * 24 * 3600 * 1000 + 60 * 1000).toISOString(),
    initialAssessment: 'Thermal overload and primary switching stage stress',
    likelyCauses: [
      {
        cause: 'Internal capacitor electrolyte breakdown / thermal dissipation failure',
        confidence: 90,
        explanation: 'Overheating adapter presents fire and thermal hazard.',
        isDangerous: true,
      },
    ],
    confidence: 90,
    safetyLevel: 'danger_technician_required',
    safetyWarnings: [
      'CRITICAL: Unplug adapter immediately from the wall outlet.',
      'Do not attempt to open the ultrasonically welded plastic brick.',
    ],
    currentStepIndex: 1,
    stepsHistory: [],
    evidence: {
      confirmed: ['Plastic enclosure exhibits abnormal surface temperature (>65°C)', 'Chemical plastic odor present'],
      ruledOut: [],
      measurements: [],
    },
    status: 'technician_required',
    resolutionSummary:
      'Professional Replacement Required: The power adapter has experienced internal thermal degradation or component breakdown. Continued usage presents a risk of fire or short-circuit.',
    safeUserActions: ['Dispose of adapter in approved electronics recycling', 'Do not attempt to tape or glue enclosure'],
    technicianActions: ['Replace with OEM rated adapter matching exact voltage and polarity specifications'],
    timeElapsedSeconds: 65,
  },
];

export function getStoredSessions(): DiagnosticSession[] {
  if (typeof window === 'undefined') return SEED_SESSIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_SESSIONS));
      return SEED_SESSIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_SESSIONS;
  } catch (e) {
    console.error('Error loading sessions from localStorage', e);
    return SEED_SESSIONS;
  }
}

export function saveSession(session: DiagnosticSession): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getStoredSessions();
    const index = existing.findIndex((s) => s.id === session.id);
    let updated: DiagnosticSession[];
    if (index >= 0) {
      updated = [...existing];
      updated[index] = session;
    } else {
      updated = [session, ...existing];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving session to localStorage', e);
  }
}

export function getSessionById(id: string): DiagnosticSession | undefined {
  const sessions = getStoredSessions();
  return sessions.find((s) => s.id === id);
}

export function deleteSession(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getStoredSessions();
    const filtered = existing.filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Error deleting session', e);
  }
}

export function getAppSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export function saveAppSettings(settings: Partial<AppSettings>): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const current = getAppSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}
