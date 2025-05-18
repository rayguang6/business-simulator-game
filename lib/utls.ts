import { CARD_TYPE_STYLES } from './constants';

export function getCardTypeStyle(type: string) {
    return CARD_TYPE_STYLES[type.toLowerCase()] || 'bg-gray-100 text-gray-800';
  } 