export interface JourneySession {
  session_id: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  source: string;
  campaign: string;
}

export type QuizAnswerMap = Record<string, string>;

export interface QuizAnswer {
  question_key: string;
  option_key: string;
  question_text?: string;
  option_text?: string;
}

export interface RecommendationResult {
  primaryDestination: string;
  studyLevel: string;
  field: string;
  intake: string;
  budgetCategory: string;
  alternativeDestination: string;
  reasons: string[];
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  cta_text: string;
  active: boolean;
  campaign: string;
  expires_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export type LeadStatus = 'New' | 'Contacted' | 'Consultation' | 'Application' | 'Converted' | 'Lost';

export interface LeadRecord {
  id?: string;
  quiz_session_id?: string | null;
  session_id: string;
  full_name: string;
  whatsapp_number: string;
  email?: string | null;
  preferred_destination?: string | null;
  study_level?: string | null;
  intended_intake?: string | null;
  quiz_answers?: Record<string, any> | null;
  recommendation?: RecommendationResult | null;
  offer_id?: string | null;
  offer_title?: string | null;
  campaign?: string | null;
  source?: string | null;
  lead_status?: LeadStatus;
  created_at?: string;
  updated_at?: string;
}

export interface QuizQuestion {
  id: string;
  question_key: string;
  question_text: string;
  display_order: number;
  active: boolean;
  options?: QuizOption[];
}

export interface QuizOption {
  id: string;
  question_id: string;
  option_key: string;
  option_text: string;
  display_order: number;
  active: boolean;
}

export interface AnalyticsEvent {
  id?: string;
  event_name: string;
  session_id: string;
  source?: string;
  campaign?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
}
