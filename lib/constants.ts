export enum CardTypeEnum {
  opportunity = 'opportunity',
  problem = 'problem',
  market = 'market',
  happy = 'happy',
}

// Card Type Probability Definitions
export const CARD_TYPE_DEFINITIONS = [
  { type: CardTypeEnum.opportunity, weight: 5 }, // 60% - opportunities
  { type: CardTypeEnum.problem,    weight: 10 }, // 20% - problems
  { type: CardTypeEnum.market,     weight: 5 }, // 15% - market events
  { type: CardTypeEnum.happy,      weight: 80 }   // 5% - happy events
];

// Calculate total weight for probability calculations
export const TOTAL_CARD_TYPE_WEIGHT = CARD_TYPE_DEFINITIONS.reduce((sum, def) => sum + def.weight, 0);

// Card Type Colors (Hex values for easy opacity manipulation)
export const CARD_TYPE_COLORS = {
  opportunity: '#3B82F6', // Blue
  problem: '#EF4444',     // Red  
  market: '#F59E0B',      // Yellow/Amber
  happy: '#10B981',       // Green
} as const;

export const CARD_TYPE_STYLES: Record<string, string> = {
  opportunity: 'bg-blue-100 text-blue-800',     // Blue for opportunities
  problem: 'bg-red-100 text-red-800',           // Red for problems
  market: 'bg-yellow-100 text-yellow-800',      // Yellow for market events
  happy: 'bg-green-100 text-green-800',         // Green for happy events
};

export const INDUSTRY_BACKGROUNDS = {
  mobile: '/images/backgrounds/default-mobile.jpeg',
  desktop: '/images/backgrounds/default-desktop.jpeg'
} as const;
