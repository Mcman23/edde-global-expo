export interface DestinationMetadata {
  key: string;
  name: string;
  flag?: string;
  strengths: string[];
  typicalBudgetNote: string;
  budgetFitKeys: string[];
  fieldWhyFit: Record<string, string>;
  generalWhyFit: string[];
  alternativeFallback: string[];
}

export const DESTINATIONS: Record<string, DestinationMetadata> = {
  uk: {
    key: 'uk',
    name: 'United Kingdom',
    strengths: [
      'Top-tier global university reputation',
      "Accelerated 1-year Master's degrees",
      'Graduate Route post-study work visa',
    ],
    typicalBudgetNote: 'Ideal for annual study budgets from €20,000 upwards.',
    budgetFitKeys: ['20_30k', '30k_plus'],
    fieldWhyFit: {
      business: 'Home to world-class business hubs, AACSB accredited schools, and London financial centers.',
      it: 'Leading AI research institutions and thriving European technology venture networks.',
      engineering: 'Strong industry partnerships with pioneering aerospace, automotive, and civil engineering firms.',
      medicine: 'Globally respected clinical research programs and world-renowned academic medical centers.',
      arts: 'Vibrant creative capital with prestigious design academies and cultural institutions.',
      social: 'World-leading centers for law, international relations, and public policy.',
      other: 'Globally recognized qualification with extensive academic networks.',
    },
    generalWhyFit: [
      'High density of top-ranked QS global universities',
      "1-year intensive Master's structure reduces overall living costs",
      'Post-study work permissions for international graduates',
    ],
    alternativeFallback: ['europe', 'canada', 'australia'],
  },
  europe: {
    key: 'europe',
    name: 'Europe',
    strengths: [
      'Affordable tuition & low living costs',
      'Wide range of English-taught programs',
      'Schengen area mobility & job market access',
    ],
    typicalBudgetNote: 'Excellent fit for budgets under €10,000 to €20,000 per year.',
    budgetFitKeys: ['under_10k', '10_20k', '20_30k'],
    fieldWhyFit: {
      business: 'Gateway to European trade, multinational corporate headquarters, and innovation centers.',
      it: 'Fast-growing tech hotspots in Berlin, Amsterdam, Tallinn, and Nordic innovation capitals.',
      engineering: 'Historic tuition subsidies at premier technical universities in Germany, Netherlands, and Scandinavia.',
      medicine: 'High-standard European medical degrees offered in English with cross-border licensing.',
      arts: 'Rich artistic traditions combined with contemporary design and media academies.',
      social: 'Hub for global governance, diplomacy, and international legal studies.',
      other: 'Accessible tuition fees with excellent academic standards across EU member states.',
    },
    generalWhyFit: [
      'Low or zero tuition fees at world-class public universities',
      "Hundreds of accredited English-taught bachelor's and master's degrees",
      'Schengen mobility providing international internships and career growth',
    ],
    alternativeFallback: ['uk', 'canada', 'australia'],
  },
  usa: {
    key: 'usa',
    name: 'United States',
    strengths: [
      'Unrivaled institutional prestige',
      'Expansive campus resources',
      'OPT post-grad work opportunity',
    ],
    typicalBudgetNote: 'Best suited for annual budgets of €30,000+ with merit scholarship opportunities.',
    budgetFitKeys: ['30k_plus'],
    fieldWhyFit: {
      business: 'Global hub for Fortune 500 leadership, Wall Street finance, and global consulting.',
      it: 'Direct ecosystem link to Silicon Valley, global tech giants, and tech venture capital.',
      engineering: 'State-of-the-art research laboratories and industry-funded innovation programs.',
      medicine: 'Pioneering biomedical research, clinical technology, and global healthcare initiatives.',
      arts: 'World-leading entertainment, digital media, and fine arts schools.',
      social: 'Renowned political science, economics, and social research institutions.',
      other: 'Flexible liberal arts credit system with vast academic customization.',
    },
    generalWhyFit: [
      'Unmatched global brand recognition and global alumni networks',
      'Flexibility to customize majors, double majors, and research projects',
      'Up to 3-year OPT work authorization for STEM degree graduates',
    ],
    alternativeFallback: ['canada', 'uk', 'australia'],
  },
  canada: {
    key: 'canada',
    name: 'Canada',
    strengths: [
      'Clear immigration & work pathways',
      'High safety & quality of life',
      'PGWP work permits',
    ],
    typicalBudgetNote: 'Fits balanced annual budgets from €10,000 to €30,000+.',
    budgetFitKeys: ['10_20k', '20_30k', '30k_plus'],
    fieldWhyFit: {
      business: 'Dynamic national economy with thriving financial and international commerce sectors.',
      it: 'Booming technology sectors in Toronto, Vancouver, Montreal, and Waterloo.',
      engineering: 'High demand for specialized engineers supported by government infrastructure spending.',
      medicine: 'Advanced health research facilities and community health initiatives.',
      arts: 'Diverse multicultural creative sector with major film and media studios.',
      social: 'Progressive public policy, sociology, and international development programs.',
      other: 'Comprehensive career support with clear international student pathways.',
    },
    generalWhyFit: [
      'Post-Graduation Work Permit (PGWP) for up to 3 years after completion',
      'Extremely welcoming, safe, and multicultural student environments',
      'Competitive tuition rates compared to US institutions with equal quality',
    ],
    alternativeFallback: ['australia', 'uk', 'europe'],
  },
  australia: {
    key: 'australia',
    name: 'Australia',
    strengths: [
      'High student liveability',
      'Generous post-study work rights',
      'Group of Eight universities',
    ],
    typicalBudgetNote: 'Ideal for annual budgets from €20,000 to €30,000+.',
    budgetFitKeys: ['20_30k', '30k_plus'],
    fieldWhyFit: {
      business: 'Strategic economic link to Asia-Pacific trade and thriving commercial capitals.',
      it: 'Rapid growth in software development, cybersecurity, and data science sectors.',
      engineering: 'Massive engineering and sustainable energy development projects nationwide.',
      medicine: 'World-class medical research institutes and public health healthcare models.',
      arts: 'Inspiring architecture, design, and media faculties in Sydney & Melbourne.',
      social: 'Strong emphasis on environmental science, law, and international policy.',
      other: 'Globally respected qualifications in modern, well-equipped campuses.',
    },
    generalWhyFit: [
      'Consistently ranked among the top cities globally for international student living',
      'Generous post-study work visas enabling valuable international career experience',
      'Strong student welfare protections and vibrant campus culture',
    ],
    alternativeFallback: ['canada', 'uk', 'europe'],
  },
};
