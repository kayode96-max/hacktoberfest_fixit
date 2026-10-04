export type EquipmentCategory = 'electrical' | 'solar' | 'electronics' | 'appliances';

export type SafetyLevel = 'safe' | 'caution' | 'danger_technician_required';

export type StepResponseType = 'yes_no' | 'yes_no_unsure' | 'multimeter' | 'choice' | 'text';

export type ResolutionStatus = 'diagnosing' | 'solved' | 'continue' | 'technician_required';

export interface PossibleCause {
  cause: string;
  confidence: number; // 0 to 100
  explanation: string;
  isDangerous?: boolean;
}

export interface DiagnosticStep {
  id: string;
  stepNumber: number;
  title: string;
  instruction: string;
  warning?: string;
  responseType: StepResponseType;
  options?: string[];
  requiresMultimeter?: boolean;
  measurementUnit?: string;
  measurementHint?: string;
}

export interface StepRecord {
  step: DiagnosticStep;
  userResponse: string;
  measurementValue?: {
    voltage?: number;
    current?: number;
    resistance?: number;
    unit?: string;
  };
  timestamp: string;
  notes?: string;
}

export interface DiagnosticSession {
  id: string;
  category: EquipmentCategory;
  equipmentType: string;
  problemDescription: string;
  structuredAnswers?: Record<string, string>;
  photos?: string[]; // base64 or sample photo URLs
  createdAt: string;
  updatedAt: string;
  
  // AI Assessment
  initialAssessment?: string;
  likelyCauses: PossibleCause[];
  confidence: number; // 0 to 100
  safetyLevel: SafetyLevel;
  safetyWarnings: string[];
  
  // Troubleshooting Flow
  currentStepIndex: number;
  stepsHistory: StepRecord[];
  currentStep?: DiagnosticStep;
  
  // Evidence accumulated
  evidence: {
    confirmed: string[];
    ruledOut: string[];
    measurements: { label: string; value: string; assessment: string }[];
  };
  
  // Final Result
  status: ResolutionStatus;
  resolutionSummary?: string;
  safeUserActions?: string[];
  technicianActions?: string[];
  timeElapsedSeconds?: number;
}
