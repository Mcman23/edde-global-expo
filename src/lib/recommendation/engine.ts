import { DESTINATIONS } from '@/lib/config/destinations-data';
import { RecommendationResult } from '@/types';

export interface RecommendationConfig {
  weights: {
    region: number;
    budget: number;
    field: number;
    intake: number;
    english: number;
  };
  alternatives: Record<string, string[]>;
}

export const DEFAULT_RECOMMENDATION_CONFIG: RecommendationConfig = {
  weights: {
    region: 40,
    budget: 25,
    field: 20,
    intake: 5,
    english: 10,
  },
  alternatives: {
    uk: ['europe', 'canada', 'australia'],
    europe: ['uk', 'canada', 'australia'],
    usa: ['canada', 'uk', 'australia'],
    canada: ['australia', 'uk', 'europe'],
    australia: ['canada', 'uk', 'europe'],
  },
};

const STUDY_LEVEL_MAP: Record<string, string> = {
  bachelors: "Bachelor's Degree",
  masters: "Master's Degree",
  phd: 'PhD / Doctoral',
  foundation: 'Foundation / Language',
  not_sure: 'Higher Education',
};

const FIELD_MAP: Record<string, string> = {
  business: 'Business & Management',
  it: 'IT & Computer Science',
  engineering: 'Engineering',
  medicine: 'Medicine & Health Sciences',
  arts: 'Arts & Design',
  social: 'Social Sciences',
  other: 'General Studies',
  not_sure: 'Multiple Fields',
};

const INTAKE_MAP: Record<string, string> = {
  y2026: '2026 Intake',
  y2027: '2027 Intake',
  y2028_plus: '2028+ Intake',
  not_sure: 'Upcoming Intake',
};

const BUDGET_MAP: Record<string, string> = {
  under_10k: 'Under €10,000 / year',
  '10_20k': '€10,000–€20,000 / year',
  '20_30k': '€20,000–€30,000 / year',
  '30k_plus': '€30,000+ / year',
  not_sure: 'Flexible Budget',
};

export function recommend(
  answers: Record<string, string>,
  config: RecommendationConfig = DEFAULT_RECOMMENDATION_CONFIG
): RecommendationResult {
  const destinationKeys = Object.keys(DESTINATIONS);
  const scores: Record<string, number> = {};

  destinationKeys.forEach((key) => {
    scores[key] = 0;
  });

  const { region, budget, field, intake, english } = answers;
  const weights = config.weights;

  // 1. Region Scoring
  if (region && region !== 'not_sure' && scores[region] !== undefined) {
    scores[region] += weights.region;
  } else {
    // If not sure or missing, distribute small bonus evenly
    destinationKeys.forEach((key) => {
      scores[key] += weights.region * 0.3;
    });
  }

  // 2. Budget Scoring
  destinationKeys.forEach((key) => {
    const dest = DESTINATIONS[key];
    if (budget === 'not_sure' || !budget) {
      scores[key] += weights.budget * 0.5;
    } else if (dest.budgetFitKeys.includes(budget)) {
      scores[key] += weights.budget;
    } else if ((budget === 'under_10k' || budget === '10_20k') && key === 'europe') {
      scores[key] += weights.budget;
    } else if (budget === '30k_plus' && (key === 'usa' || key === 'uk')) {
      scores[key] += weights.budget;
    } else {
      scores[key] += weights.budget * 0.2;
    }
  });

  // 3. Field Scoring
  destinationKeys.forEach((key) => {
    const dest = DESTINATIONS[key];
    if (field && field !== 'not_sure' && dest.fieldWhyFit[field]) {
      scores[key] += weights.field;
    } else {
      scores[key] += weights.field * 0.5;
    }
  });

  // 4. Intake Scoring
  destinationKeys.forEach((key) => {
    if (intake === 'y2026') {
      scores[key] += weights.intake;
    } else if (intake === 'y2027' || intake === 'y2028_plus') {
      scores[key] += weights.intake * 0.8;
    } else {
      scores[key] += weights.intake * 0.5;
    }
  });

  // 5. English Proficiency Scoring
  destinationKeys.forEach((key) => {
    if (english === 'none' || english === 'preparing') {
      if (key === 'europe') {
        scores[key] += weights.english;
      } else if (key === 'uk' || key === 'canada') {
        scores[key] += weights.english * 0.7;
      } else {
        scores[key] += weights.english * 0.4;
      }
    } else if (english === 'ielts' || english === 'toefl') {
      if (key === 'uk' || key === 'usa' || key === 'canada' || key === 'australia') {
        scores[key] += weights.english;
      } else {
        scores[key] += weights.english * 0.8;
      }
    } else {
      scores[key] += weights.english * 0.5;
    }
  });

  // Sort destinations by score descending
  const sortedDestinations = destinationKeys.sort((a, b) => scores[b] - scores[a]);

  const primaryKey = sortedDestinations[0] || 'uk';
  let altKey = sortedDestinations[1] || 'europe';

  if (altKey === primaryKey) {
    const fallbackList = config.alternatives[primaryKey] || DESTINATIONS[primaryKey]?.alternativeFallback || ['europe'];
    altKey = fallbackList.find((k) => k !== primaryKey) || 'europe';
  }

  const primaryDest = DESTINATIONS[primaryKey] || DESTINATIONS.uk;
  const altDest = DESTINATIONS[altKey] || DESTINATIONS.europe;

  const fieldLabel = FIELD_MAP[field] || FIELD_MAP.not_sure;
  const studyLevelLabel = STUDY_LEVEL_MAP[answers.study_level] || STUDY_LEVEL_MAP.not_sure;
  const intakeLabel = INTAKE_MAP[intake] || INTAKE_MAP.not_sure;
  const budgetLabel = BUDGET_MAP[budget] || BUDGET_MAP.not_sure;

  // Build 3-4 compelling reasons
  const reasons: string[] = [];

  // Reason 1: Field fit
  if (field && field !== 'not_sure' && primaryDest.fieldWhyFit[field]) {
    reasons.push(primaryDest.fieldWhyFit[field]);
  } else {
    reasons.push(`Strong academic programs and high graduate employability in ${fieldLabel}`);
  }

  // Reason 2: Budget fit
  if (budget && budget !== 'not_sure' && primaryDest.budgetFitKeys.includes(budget)) {
    reasons.push(`Fits your selected annual budget (${budgetLabel})`);
  } else {
    reasons.push(primaryDest.typicalBudgetNote);
  }

  // Reason 3: Destination strength
  if (primaryDest.generalWhyFit[0]) {
    reasons.push(primaryDest.generalWhyFit[0]);
  }

  // Reason 4: Intake & pathway availability
  reasons.push(`Multiple university pathways available for the ${intakeLabel}`);

  return {
    primaryDestination: primaryDest.name,
    studyLevel: studyLevelLabel,
    field: fieldLabel,
    intake: intakeLabel,
    budgetCategory: budgetLabel,
    alternativeDestination: altDest.name,
    reasons,
  };
}
