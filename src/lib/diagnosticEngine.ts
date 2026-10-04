import {
  EquipmentCategory,
  DiagnosticSession,
  DiagnosticStep,
  PossibleCause,
  SafetyLevel,
  ResolutionStatus,
} from '@/types/diagnosis';

export interface CategoryInfo {
  id: EquipmentCategory;
  name: string;
  icon: string;
  description: string;
  items: string[];
}

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'solar',
    name: 'Solar',
    icon: '☀️',
    description: 'Solar panels, generators, inverters, MPPT controllers, & DC breakers',
    items: [
      'Solar generator / portable power station',
      'Solar panel (PV array)',
      'MPPT / PWM Charge controller',
      'Solar Battery (LiFePO4 / Lead-Acid)',
      'Solar Inverter (Off-grid / Hybrid)',
      'DC Breaker / Disconnect switch',
      'I don’t know (Help me identify)',
    ],
  },
  {
    id: 'electrical',
    name: 'Electrical',
    icon: '⚡',
    description: 'Wall switches, power sockets, MCB breakers, distribution & wiring',
    items: [
      'Wall socket / Receptacle',
      'Light switch / Dimmer',
      'Circuit breaker (MCB / GFCI / RCD)',
      'Extension cord / Power strip',
      'Junction box / Wiring connection',
      'I don’t know (Help me identify)',
    ],
  },
  {
    id: 'electronics',
    name: 'Electronics',
    icon: '🔌',
    description: 'Power supplies, laptop chargers, USB adapters, & circuit modules',
    items: [
      'AC/DC Power supply / Adapter',
      'USB-C / Fast charger',
      'Battery charger',
      'Step-down / Buck converter',
      'Desktop power supply unit (PSU)',
      'I don’t know (Help me identify)',
    ],
  },
  {
    id: 'appliances',
    name: 'Appliances',
    icon: '🏠',
    description: 'Standing fans, lamps, heaters, kettles, & small household equipment',
    items: [
      'Standing / Desk fan',
      'Table lamp / LED fixture',
      'Electric kettle / Heating appliance',
      'Blender / Kitchen mixer',
      'Space heater',
      'I don’t know (Help me identify)',
    ],
  },
];

// Helper to determine danger/safety level from description and category
export function assessInitialSafety(
  category: EquipmentCategory,
  description: string,
  answers?: Record<string, string>
): { safetyLevel: SafetyLevel; warnings: string[] } {
  const lower = description.toLowerCase();
  const warnings: string[] = [];

  const dangerKeywords = [
    'smoke',
    'smoking',
    'spark',
    'sparking',
    'burning smell',
    'burnt',
    'electric shock',
    'tingling',
    'water damaged',
    'submerged',
    'swollen battery',
    'bloated battery',
    'hissing',
    'fire',
    'flame',
  ];

  for (const kw of dangerKeywords) {
    if (lower.includes(kw)) {
      warnings.push(`Hazard detected: "${kw.toUpperCase()}". Unplug and disconnect from power immediately.`);
      return {
        safetyLevel: 'danger_technician_required',
        warnings: [
          ...warnings,
          'Do NOT attempt to open the chassis or probe energized terminals.',
          'Physical component degradation or thermal hazard requires qualified technician repair.',
        ],
      };
    }
  }

  // Electrical category warnings
  if (category === 'electrical') {
    warnings.push('This diagnosis involves mains electrical equipment (110V - 240V AC).');
    warnings.push('Always turn off the relevant circuit breaker at the main distribution panel before touching terminals.');
    warnings.push('Never touch bare metal conductors with bare hands or uninsulated tools.');
    return { safetyLevel: 'caution', warnings };
  }

  // Solar category warnings
  if (category === 'solar') {
    warnings.push('Solar PV panels generate hazardous DC voltage whenever exposed to daylight, even when disconnected.');
    warnings.push('Never connect or disconnect high-voltage solar strings under active load.');
    warnings.push('Ensure the DC isolator or breaker is disengaged before checking connector pins.');
    return { safetyLevel: 'caution', warnings };
  }

  // Electronics / Appliances
  warnings.push('Ensure the appliance or adapter is unplugged from the wall socket before physical inspection.');
  warnings.push('Internal electrolytic capacitors can hold high charge even after disconnecting.');
  return { safetyLevel: 'safe', warnings };
}

// Diagnostic Engine: Form initial hypotheses and initial step
export function generateInitialDiagnosticAssessment(
  category: EquipmentCategory,
  equipmentType: string,
  problemDescription: string,
  answers?: Record<string, string>,
  photos?: string[]
): {
  initialAssessment: string;
  likelyCauses: PossibleCause[];
  confidence: number;
  safetyLevel: SafetyLevel;
  safetyWarnings: string[];
  firstStep: DiagnosticStep;
} {
  const safety = assessInitialSafety(category, problemDescription, answers);
  const lower = problemDescription.toLowerCase();

  // If immediate danger is detected
  if (safety.safetyLevel === 'danger_technician_required') {
    return {
      initialAssessment: 'Critical Hardware / Thermal Hazard Detected',
      likelyCauses: [
        {
          cause: 'Catastrophic thermal failure or insulation breakdown',
          confidence: 95,
          explanation: 'Observations indicate arcing, burnt components, or electrolyte venting.',
          isDangerous: true,
        },
      ],
      confidence: 95,
      safetyLevel: 'danger_technician_required',
      safetyWarnings: safety.warnings,
      firstStep: {
        id: 'safety_abort',
        stepNumber: 1,
        title: 'Safely disconnect power and isolate device',
        instruction:
          'Do not proceed with standard checks. Immediately disconnect all power sources (unplug from AC, isolate DC disconnect). Has the device been safely isolated and depowered?',
        warning: 'DO NOT touch exposed conductors or inhale smoke fumes.',
        responseType: 'yes_no',
        options: ['Yes, fully isolated', 'No / Need help'],
      },
    };
  }

  // Solar generator / charging scenario (The Hackathon Flagship Demo)
  if (
    category === 'solar' ||
    lower.includes('solar') ||
    lower.includes('generator') ||
    lower.includes('power station') ||
    equipmentType.toLowerCase().includes('generator') ||
    equipmentType.toLowerCase().includes('solar panel')
  ) {
    const isChargingIssue =
      lower.includes('not charging') ||
      lower.includes("doesn't charge") ||
      lower.includes("isn't charging") ||
      lower.includes('charge') ||
      lower.includes('no input');

    return {
      initialAssessment: isChargingIssue
        ? 'Possible charging-path discontinuity or input voltage lockout'
        : 'Solar DC power delivery or configuration anomaly',
      likelyCauses: [
        {
          cause: 'DC breaker or inline disconnect switch in OFF position',
          confidence: 68,
          explanation: 'Frequently inline protection switches between panel and station trip or are left off.',
        },
        {
          cause: 'MC4 or barrel input connector loose or unseated',
          confidence: 55,
          explanation: 'Solar plugs require a firm mechanical click; partial seating blocks current flow.',
        },
        {
          cause: 'PV open-circuit voltage (VOC) below minimum charging threshold',
          confidence: 42,
          explanation: 'Charge controllers require a minimum delta (often 12V-18V DC) above battery voltage to start MPPT.',
        },
        {
          cause: 'Faulty solar input port on power station',
          confidence: 25,
          explanation: 'Internal charging circuit or fuse blown, which would require technician service.',
        },
      ],
      confidence: 70,
      safetyLevel: safety.safetyLevel,
      safetyWarnings: safety.warnings,
      firstStep: {
        id: 'solar_step_1_input_indicator',
        stepNumber: 1,
        title: 'Check the solar input indicator on the display',
        instruction:
          'Power on your portable power station / generator and connect the solar cable. Look closely at the LCD screen or input LED ring.\n\nDoes the input power icon, "INPUT" wattage meter, or charging indicator show any active detection (even 0W)?',
        warning: 'Ensure hands and connectors are dry before touching ports.',
        responseType: 'yes_no_unsure',
        options: ['Yes (Shows icon or watts)', 'No (Display is blank/zero input)', 'Not sure'],
      },
    };
  }

  // Electrical category (Sockets, switches, breakers)
  if (category === 'electrical') {
    const isNoPower = lower.includes('no power') || lower.includes('dead') || lower.includes("doesn't turn on");
    return {
      initialAssessment: isNoPower
        ? 'Circuit interruption or tripped upstream overcurrent/GFCI device'
        : 'Possible loose connection or switch contact degradation',
      likelyCauses: [
        {
          cause: 'Tripped circuit breaker or GFCI / RCD receptacle',
          confidence: 65,
          explanation: 'Upstream safety protection often cuts power silently due to transient overloads.',
        },
        {
          cause: 'Terminal screw loose or back-stab wire detached',
          confidence: 45,
          explanation: 'Thermal cycling causes terminal screws to loosen over time.',
        },
        {
          cause: 'Failed internal switch mechanism',
          confidence: 30,
          explanation: 'Mechanical contact wear or carbon buildup preventing continuity.',
        },
      ],
      confidence: 65,
      safetyLevel: safety.safetyLevel,
      safetyWarnings: safety.warnings,
      firstStep: {
        id: 'elec_step_1_upstream_breaker',
        stepNumber: 1,
        title: 'Inspect the main distribution board / breaker panel',
        instruction:
          'Locate your home distribution panel. Look for any breaker switch that has flipped to the "OFF" or center "TRIPPED" position, or any GFCI socket test/reset button popped out.\n\nIs any breaker tripped or in the middle position?',
        warning: 'Do NOT remove the panel cover. Only observe external toggle switches.',
        responseType: 'yes_no_unsure',
        options: ['Yes (Found tripped breaker)', 'No (All appear ON)', 'Not sure'],
      },
    };
  }

  // Electronics (Chargers, adapters, power supplies)
  if (category === 'electronics') {
    return {
      initialAssessment: 'DC output regulation failure or cable strain fracture',
      likelyCauses: [
        {
          cause: 'Cable strain relief break or internal wire fracture',
          confidence: 62,
          explanation: 'Repetitive bending near the connector head causes microscopic copper fatigue.',
        },
        {
          cause: 'Wall outlet loose or surge protector switched off',
          confidence: 50,
          explanation: 'No AC power reaching the input prongs.',
        },
        {
          cause: 'Thermal overload or internal primary switching failure',
          confidence: 35,
          explanation: 'Adapter shut down due to overheating or short-circuit protection.',
        },
      ],
      confidence: 60,
      safetyLevel: safety.safetyLevel,
      safetyWarnings: safety.warnings,
      firstStep: {
        id: 'elec_step_1_status_led',
        stepNumber: 1,
        title: 'Check the adapter indicator LED and cable flexing',
        instruction:
          'Plug the adapter into a known working wall outlet without attaching the end device.\n\nDoes the indicator light illuminate? If you gently wiggle the cable near both ends, does the light flicker?',
        warning: 'Do not use frayed cables with visible copper wire strands.',
        responseType: 'choice',
        options: ['Light is solid ON', 'Light is OFF completely', 'Light blinks or flickers when wiggled', 'No light on this device'],
      },
    };
  }

  // Appliances (Fans, lamps, heaters)
  return {
    initialAssessment: 'Mechanical resistance or motor thermal fuse trip',
    likelyCauses: [
      {
        cause: 'Rotor bearing seized or hair/dust binding the shaft',
        confidence: 60,
        explanation: 'Dust and dry oil prevent the motor from developing starting torque.',
      },
      {
        cause: 'Thermal cutoff fuse blown due to previous overheating',
        confidence: 45,
        explanation: 'Built-in non-resettable safety fuse opens when motor stalls.',
      },
      {
        cause: 'Cord switch or power selector dial open-circuit',
        confidence: 35,
        explanation: 'Mechanical switch contacts worn out.',
      },
    ],
    confidence: 60,
    safetyLevel: safety.safetyLevel,
    safetyWarnings: safety.warnings,
    firstStep: {
      id: 'appliance_step_1_shaft_spin',
      stepNumber: 1,
      title: 'Unplug and manually test the blade/shaft movement',
      instruction:
        'With the appliance COMPLETELY UNPLUGGED from the wall socket, spin the fan blades or mechanical shaft with your finger.\n\nDoes it spin freely with momentum, or is it stiff / resisting rotation?',
      warning: 'NEVER touch fan blades while the appliance is plugged into mains power.',
      responseType: 'choice',
      options: ['Spins freely and smoothly', 'Stiff / Stops immediately / Gritty', 'Cannot reach or not applicable'],
    },
  };
}

// Troubleshooting Step Transition Engine
export function evaluateNextDiagnosticStep(
  session: DiagnosticSession,
  lastStep: DiagnosticStep,
  userResponse: string,
  measurement?: { voltage?: number; current?: number; resistance?: number; unit?: string }
): {
  nextStep?: DiagnosticStep;
  status: ResolutionStatus;
  resolutionSummary?: string;
  safeUserActions?: string[];
  technicianActions?: string[];
  updatedConfidence: number;
  evidenceLearned: { type: 'confirmed' | 'ruledOut'; text: string };
} {
  const currentStepNum = session.stepsHistory.length + 1;
  const isSolar = session.category === 'solar';

  // --- SOLAR TROUBLESHOOTING PATH ---
  if (isSolar) {
    // Step 1: Input indicator check
    if (lastStep.id.includes('input_indicator')) {
      if (userResponse.toLowerCase().includes('no')) {
        // No input detected at all
        return {
          status: 'diagnosing',
          updatedConfidence: 75,
          evidenceLearned: {
            type: 'confirmed',
            text: 'Power station LCD displays 0W and does not detect DC solar input.',
          },
          nextStep: {
            id: 'solar_step_2_dc_breaker',
            stepNumber: currentStepNum + 1,
            title: 'Inspect the DC breaker or inline disconnect switch',
            instruction:
              'Check along the solar cable between your solar panel and power station. Is there an inline DC breaker, fuse box, or switch?\n\nIs the breaker switch in the "ON" (Closed) position?',
            warning: 'Only touch insulated plastic toggle handles. Do not touch exposed wire terminals.',
            responseType: 'yes_no_unsure',
            options: ['Yes (It is ON)', 'No (It was OFF or tripped)', 'No breaker installed / Not sure'],
          },
        };
      } else if (userResponse.toLowerCase().includes('yes')) {
        // Input icon is on, maybe low power or fluctuating
        return {
          status: 'diagnosing',
          updatedConfidence: 72,
          evidenceLearned: {
            type: 'confirmed',
            text: 'Power station detects connection, but charging rate is abnormal or zero current.',
          },
          nextStep: {
            id: 'solar_step_sunlight_angle',
            stepNumber: currentStepNum + 1,
            title: 'Verify sunlight conditions and panel orientation',
            instruction:
              'Is the solar panel in full direct midday sun without tree or roof shadows? Even partial shading of a single cell can drop output by over 80% on series panels.\n\nIs the entire panel surface unshaded?',
            responseType: 'yes_no',
            options: ['Yes, direct unshaded sunlight', 'Partially shaded / overcast'],
          },
        };
      }
    }

    // Step 2: DC breaker was checked
    if (lastStep.id.includes('dc_breaker')) {
      if (userResponse.toLowerCase().includes('no') || userResponse.includes('OFF')) {
        // THE HACKATHON DEMO RESOLUTION!
        return {
          status: 'solved',
          updatedConfidence: 94,
          evidenceLearned: {
            type: 'confirmed',
            text: 'DC inline breaker was switched OFF, physically opening the photovoltaic circuit.',
          },
          resolutionSummary:
            'Problem Solved: The inline DC breaker between the solar panel and power station was in the OFF position, preventing current from reaching the MPPT charge controller.',
          safeUserActions: [
            'Ensure the solar connectors are firmly clicked together.',
            'Switch the DC breaker firmly to the "ON" position.',
            'Observe the power station screen for input wattage climb (typically takes 5-10 seconds to handshake).',
          ],
          technicianActions: [
            'If the breaker immediately trips open again upon turning on, do not force it. Have a certified technician test the circuit for a direct short-circuit or reverse polarity.',
          ],
        };
      } else {
        // Breaker was ON or none installed -> test connectors / multimeter
        return {
          status: 'diagnosing',
          updatedConfidence: 78,
          evidenceLearned: {
            type: 'ruledOut',
            text: 'Inline DC breaker is active and closed.',
          },
          nextStep: {
            id: 'solar_step_3_connector_seat',
            stepNumber: currentStepNum + 1,
            title: 'Check MC4 / XT60 / DC7909 connector seating',
            instruction:
              'Inspect the DC plug connecting into the solar input port of your power station. Disconnect it and inspect the internal metal pins for corrosion or bent pins, then push firmly until it snaps into place.\n\nDid the plug click tightly into place with zero wiggle?',
            warning: 'Always disconnect under shaded conditions or switch off breaker before unplugging.',
            responseType: 'yes_no_unsure',
            options: ['Yes, connector is fully locked', 'Found loose pin / damaged connector', 'Not sure'],
            requiresMultimeter: true,
            measurementUnit: 'V DC',
            measurementHint: 'If you have a multimeter, measure open-circuit DC voltage at the plug tips.',
          },
        };
      }
    }

    // Step 3: Multimeter or Connector check
    if (lastStep.id.includes('connector_seat')) {
      if (measurement && measurement.voltage !== undefined) {
        const v = measurement.voltage;
        if (v < 10) {
          return {
            status: 'technician_required',
            updatedConfidence: 89,
            evidenceLearned: {
              type: 'confirmed',
              text: `Multimeter reading at solar plug is critically low (${v}V DC).`,
            },
            resolutionSummary:
              'Open circuit or diode failure in PV array: Measured voltage is below the operational threshold required by the power station MPPT charge controller.',
            safeUserActions: [
              'Visually inspect the full run of solar cable for cuts, pinches, or rodent bites.',
              'Check that all MC4 series interconnects between solar panels are tight.',
            ],
            technicianActions: [
              'Test individual bypass diodes in the solar panel junction box.',
              'Perform cable insulation resistance (megger) test.',
              'Verify panel Voc under Standard Test Conditions (STC).',
            ],
          };
        } else {
          return {
            status: 'technician_required',
            updatedConfidence: 86,
            evidenceLearned: {
              type: 'confirmed',
              text: `Panel outputs healthy ${v}V DC, but power station fails to consume power.`,
            },
            resolutionSummary:
              'Internal Power Station Charging Port Failure: The PV array delivers proper voltage, but the internal MPPT controller or DC input MOSFETs have failed.',
            safeUserActions: [
              'Test charging the power station using the AC wall charger to confirm battery management system (BMS) health.',
              'Check device settings menu for PV input voltage limit settings.',
            ],
            technicianActions: [
              'Replace blown input fuse or surface-mount protection diode on power station mainboard.',
              'Inspect internal MPPT buck-boost converter circuitry.',
            ],
          };
        }
      }

      if (userResponse.toLowerCase().includes('loose') || userResponse.toLowerCase().includes('damaged')) {
        return {
          status: 'solved',
          updatedConfidence: 91,
          evidenceLearned: {
            type: 'confirmed',
            text: 'DC connector was partially unseated or bent pin prevented continuity.',
          },
          resolutionSummary:
            'Resolved: Fault was caused by a mechanical disconnection in the DC connector. Re-seating or replacing the plug restores charging.',
          safeUserActions: [
            'Replace degraded solar adapter cable with manufacturer-approved gauge (minimum 12 AWG).',
            'Ensure strain relief is tight to prevent future disconnection.',
          ],
          technicianActions: [
            'Inspect socket barrel for internal heat deformation or oxidation.',
          ],
        };
      }

      // If still unsure, offer multimeter or continue
      return {
        status: 'continue',
        updatedConfidence: 80,
        evidenceLearned: {
          type: 'confirmed',
          text: 'External connections inspected; deeper electrical testing required.',
        },
        nextStep: {
          id: 'solar_step_4_multimeter_check',
          stepNumber: currentStepNum + 1,
          title: 'Measure DC Open-Circuit Voltage with Multimeter',
          instruction:
            'Set your digital multimeter to DC Volts (⎓ 200V range). Touch the black probe to negative and red probe to positive on the solar cable connector.\n\nWhat voltage reading does your meter display?',
          warning: 'Do NOT set multimeter to Current/Amps while testing open panel terminals.',
          responseType: 'multimeter',
          requiresMultimeter: true,
          measurementUnit: 'V DC',
          measurementHint: 'Typical 100W-400W panels read between 18V and 48V DC.',
          options: ['Above 18V DC', 'Zero or near zero (< 5V)', 'Do not have multimeter'],
        },
      };
    }
  }

  // --- ELECTRICAL TROUBLESHOOTING PATH ---
  if (session.category === 'electrical') {
    if (lastStep.id.includes('upstream_breaker')) {
      if (userResponse.toLowerCase().includes('yes') || userResponse.includes('tripped')) {
        return {
          status: 'solved',
          updatedConfidence: 88,
          evidenceLearned: {
            type: 'confirmed',
            text: 'Circuit breaker was tripped in the distribution board.',
          },
          resolutionSummary:
            'Problem Identified: Circuit breaker or GFCI protective disconnect opened to protect against a circuit overload or transient ground fault.',
          safeUserActions: [
            'Unplug high-draw appliances (heaters, kettles, hair dryers) on that same circuit.',
            'Firmly switch the breaker handle all the way to OFF first, then push to ON until it snaps.',
            'If breaker holds, plug devices back in one by one to find the faulty appliance.',
          ],
          technicianActions: [
            'If breaker instantly trips again with NO loads plugged in, do NOT repeatedly reset. Call a licensed electrician to locate short-circuit or fault in concealed wiring.',
          ],
        };
      } else {
        return {
          status: 'technician_required',
          updatedConfidence: 82,
          evidenceLearned: {
            type: 'confirmed',
            text: 'All distribution breakers are closed, indicating localized receptacle or terminal failure.',
          },
          resolutionSummary:
            'Internal Switch/Socket Contact Failure or Open Neutral: Breakers are supplying voltage, but the specific point of use has an internal open circuit.',
          safeUserActions: [
            'Test with a secondary appliance known to work on a different outlet.',
            'Check if a GFCI outlet earlier in the chain needs resetting.',
          ],
          technicianActions: [
            'De-energize circuit, remove wall plate, and test line-to-neutral voltage with a CAT-III multimeter.',
            'Re-torque screw terminals or replace worn receptacle.',
          ],
        };
      }
    }
  }

  // Default fallback progression
  return {
    status: currentStepNum >= 3 ? 'continue' : 'diagnosing',
    updatedConfidence: Math.min(85, session.confidence + 10),
    evidenceLearned: {
      type: 'confirmed',
      text: `Completed test step: ${lastStep.title} (Result: ${userResponse})`,
    },
    nextStep: {
      id: `step_${currentStepNum + 1}_general`,
      stepNumber: currentStepNum + 1,
      title: 'Secondary component isolation',
      instruction:
        'To isolate the issue further, test the device on an alternate independent power supply or receptacle.\n\nDid the device behave identically under the alternate source?',
      responseType: 'yes_no',
      options: ['Behaves identically (device at fault)', 'Works on alternate source (original supply at fault)'],
    },
    resolutionSummary: 'Further diagnostic evidence collected. Proceed to component test.',
    safeUserActions: ['Clean external contacts with dry cloth', 'Verify cable connections'],
    technicianActions: ['Internal resistance and continuity testing'],
  };
}
