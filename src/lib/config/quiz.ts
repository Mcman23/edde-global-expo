export interface QuizOption {
  key: string;
  option_text: string;
}

export interface QuizQuestion {
  key: string;
  question_key: string;
  question_text: string;
  options: QuizOption[];
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    key: 'study_level',
    question_key: 'study_level',
    question_text: 'What are you planning to study?',
    options: [
      { key: 'bachelors', option_text: "Bachelor's" },
      { key: 'masters', option_text: "Master's" },
      { key: 'phd', option_text: 'PhD' },
      { key: 'foundation', option_text: 'Foundation / Language' },
      { key: 'not_sure', option_text: 'Not sure' },
    ],
  },
  {
    key: 'field',
    question_key: 'field',
    question_text: 'Which field interests you most?',
    options: [
      { key: 'business', option_text: 'Business & Management' },
      { key: 'it', option_text: 'IT / Computer Science' },
      { key: 'engineering', option_text: 'Engineering' },
      { key: 'medicine', option_text: 'Medicine & Health' },
      { key: 'arts', option_text: 'Arts / Design' },
      { key: 'social', option_text: 'Social Sciences' },
      { key: 'other', option_text: 'Other' },
      { key: 'not_sure', option_text: 'Not sure' },
    ],
  },
  {
    key: 'region',
    question_key: 'region',
    question_text: 'Where would you consider studying?',
    options: [
      { key: 'uk', option_text: 'UK' },
      { key: 'europe', option_text: 'Europe' },
      { key: 'usa', option_text: 'USA' },
      { key: 'canada', option_text: 'Canada' },
      { key: 'australia', option_text: 'Australia' },
      { key: 'not_sure', option_text: 'Not sure' },
    ],
  },
  {
    key: 'budget',
    question_key: 'budget',
    question_text: 'What is your approximate annual study budget?',
    options: [
      { key: 'under_10k', option_text: 'Under €10,000' },
      { key: '10_20k', option_text: '€10,000–€20,000' },
      { key: '20_30k', option_text: '€20,000–€30,000' },
      { key: '30k_plus', option_text: '€30,000+' },
      { key: 'not_sure', option_text: 'Not sure' },
    ],
  },
  {
    key: 'intake',
    question_key: 'intake',
    question_text: 'When are you planning to start?',
    options: [
      { key: 'y2026', option_text: '2026' },
      { key: 'y2027', option_text: '2027' },
      { key: 'y2028_plus', option_text: '2028+' },
      { key: 'not_sure', option_text: 'Not sure' },
    ],
  },
  {
    key: 'english',
    question_key: 'english',
    question_text: 'Do you currently have an English language certificate?',
    options: [
      { key: 'ielts', option_text: 'IELTS' },
      { key: 'toefl', option_text: 'TOEFL' },
      { key: 'other', option_text: 'Other' },
      { key: 'none', option_text: 'No' },
      { key: 'preparing', option_text: 'Preparing' },
      { key: 'not_sure', option_text: 'Not sure' },
    ],
  },
];
