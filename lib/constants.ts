export enum CardTypeEnum {
  opportunity = 'opportunity',
  problem = 'problem',
  market = 'market',
  happy = 'happy',
}

export const CARD_TYPE_STYLES: Record<string, string> = {
  opportunity: 'bg-blue-100 text-blue-800',
  problem: 'bg-red-100 text-red-800',
  market: 'bg-yellow-100 text-yellow-800',
  happy: 'bg-green-100 text-green-800',
};

