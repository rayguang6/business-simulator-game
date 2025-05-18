import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

function generateUUID() {
  // Use crypto.randomUUID if available
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  try {
    const cards = await request.json();
    if (!Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json({ error: 'Request body must be a non-empty array of cards.' }, { status: 400 });
    }
    const results = [];
    for (const cardData of cards) {
      // Generate UUID if missing
      let cardId = cardData.id;
      if (!cardId) {
        cardId = generateUUID();
      }
      // Insert card
      const cardToInsert = {
        id: cardId,
        industry_id: cardData.industry_id,
        type: String(cardData.type).toLowerCase(),
        title: cardData.title,
        description: cardData.description || null,
        stage_month: cardData.stage_month || null,
        min_cash: cardData.min_cash || null,
        max_cash: cardData.max_cash || null,
        rarity: cardData.rarity || 1
      };
      const { data: card, error: cardError } = await supabase
        .from('cards')
        .insert(cardToInsert)
        .select()
        .single();
      if (cardError) {
        results.push({ card: cardToInsert, error: cardError.message });
        continue;
      }
      // Insert choices if any
      if (Array.isArray(cardData.choices) && cardData.choices.length > 0) {
        const choicesToInsert = cardData.choices.map((choice: any) => ({
          card_id: cardId,
          label: choice.label || '',
          description: choice.description || '',
          cash_min: choice.cash_min || 0,
          cash_max: choice.cash_max || 0,
          cash_is_percent: !!choice.cash_is_percent,
          revenue_min: choice.revenue_min || 0,
          revenue_max: choice.revenue_max || 0,
          revenue_is_percent: !!choice.revenue_is_percent,
          revenue_duration: Number(choice.revenue_duration) || 0,
          expenses_min: choice.expenses_min || 0,
          expenses_max: choice.expenses_max || 0,
          expenses_is_percent: !!choice.expenses_is_percent,
          expenses_duration: Number(choice.expenses_duration) || 0,
          customer_rating_min: choice.customer_rating_min || 0,
          customer_rating_max: choice.customer_rating_max || 0
        }));
        const { error: choicesError } = await supabase
          .from('card_choices')
          .insert(choicesToInsert);
        if (choicesError) {
          // If choices insertion fails, try to delete the card
          await supabase.from('cards').delete().eq('id', cardId);
          results.push({ card: cardToInsert, error: choicesError.message });
          continue;
        }
      }
      results.push({ card: cardToInsert, success: true });
    }
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to bulk create cards.' }, { status: 500 });
  }
} 