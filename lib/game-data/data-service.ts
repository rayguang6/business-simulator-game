// lib/game-data/data-service.js
import { createServerSupabaseClient } from '../supabase';

// Get all industries
export async function getIndustries(): Promise<Industry[]> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('industries')
    .select('*')
    .order('is_available', { ascending: false })
    .order('name', { ascending: true }); // or any other secondary sort
    
  if (error) {
    console.error('Error fetching industries:', error);
    return [];
  }
  
  return data.map(industry => ({
    id: industry.id,
    name: industry.name,
    description: industry.description,
    icon: industry.icon,
    startingCash: industry.starting_cash,
    startingRevenue: industry.starting_revenue,
    startingExpenses: industry.starting_expenses,
    isAvailable: industry.is_available || false
  }));
}

// Get a single industry by ID
export async function getIndustry(industryId: string): Promise<Industry | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('industries')
    .select('*')
    .eq('id', industryId)
    .single();

  if (error) {
    console.error(`Error fetching industry ${industryId}:`, error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    icon: data.icon,
    startingCash: data.starting_cash,
    startingRevenue: data.starting_revenue,
    startingExpenses: data.starting_expenses,
    isAvailable: data.is_available || false
  };
}

function getRandomInRange(min: number, max: number) {
  if (typeof min !== 'number' || typeof max !== 'number') return 0;
  if (min === max) return min;

  // Make sure min and max are divisible by 100
  const scaledMin = Math.ceil(min / 100);
  const scaledMax = Math.floor(max / 100);

  const randomScaled = Math.floor(Math.random() * (scaledMax - scaledMin + 1)) + scaledMin;
  return randomScaled * 100;
}

// For customer rating
function getRandomInt(min: number, max: number) {
  if (typeof min !== 'number' || typeof max !== 'number') return 0;
  if (min === max) return min;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Get all cards for a specific industry with their choices
export async function getCardsByIndustry(industryId: string): Promise<Card[]> {
  const supabase = createServerSupabaseClient();

  // Get all cards for the industry
  const { data: cardsData, error: cardsError } = await supabase
    .from('cards')
    .select('*')
    .eq('industry_id', industryId);

  if (cardsError) {
    console.error(`Error fetching cards for industry ${industryId}:`, cardsError);
    return [];
  }

  // Get all choices for each card
  const cards = await Promise.all(cardsData.map(async (card) => {
    const { data: choicesData, error: choicesError } = await supabase
      .from('card_choices')
      .select('*')
      .eq('card_id', card.id);

    if (choicesError) {
      console.error(`Error fetching choices for card ${card.id}:`, choicesError);
      return null;
    }

    // Randomize effects for each choice
    const choices = choicesData.map(choice => ({
      label: choice.label,
      description: choice.description,
      cash: getRandomInRange(choice.cash_min, choice.cash_max),
      revenue: getRandomInRange(choice.revenue_min, choice.revenue_max),
      expenses: getRandomInRange(choice.expenses_min, choice.expenses_max),
      customerRating: getRandomInt(choice.customer_rating_min, choice.customer_rating_max),
      duration: choice.duration
    }));

    return {
      id: card.id,
      type: card.type,
      title: card.title,
      description: card.description,
      stage_month: card.stage_month,
      min_cash: card.min_cash,
      max_cash: card.max_cash,
      choices
    };
  }));

  // Remove any null entries (from cards where choices couldn't be loaded)
  return cards.filter(card => card !== null) as Card[];
}

// For the admin page - get all cards with basic info (no choices)
export async function getAllCards() {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('cards')
    .select(`
      *,
      industries(name)
    `)
    .order('industry_id');
    
  if (error) {
    console.error('Error fetching all cards:', error);
    return [];
  }
  
  return data;
}

// Get a single card with its choices for editing
export async function getCardForEditing(cardId: string) {
  const supabase = createServerSupabaseClient();
  
  // Get the card
  const { data: card, error: cardError } = await supabase
    .from('cards')
    .select('*')
    .eq('id', cardId)
    .single();
    
  if (cardError) {
    console.error(`Error fetching card ${cardId}:`, cardError);
    return null;
  }
  
  // Get the choices
  const { data: choices, error: choicesError } = await supabase
    .from('card_choices')
    .select('*')
    .eq('card_id', cardId);
    
  if (choicesError) {
    console.error(`Error fetching choices for card ${cardId}:`, choicesError);
    return null;
  }
  
  return { ...card, choices };
}

// Create/update a card and its choices
export async function saveCard(cardData: any) {
  const supabase = createServerSupabaseClient();
  
  // Start a transaction
  try {
    // 1. Save the card data
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .upsert({
        id: cardData.id,
        industry_id: cardData.industry_id,
        type: cardData.type,
        question: cardData.question,
        choice_title: cardData.choice_title
      })
      .select()
      .single();
      
    if (cardError) throw cardError;
    
    // 2. Delete existing choices (if updating)
    if (cardData.id) {
      const { error: deleteError } = await supabase
        .from('card_choices')
        .delete()
        .eq('card_id', cardData.id);
        
      if (deleteError) throw deleteError;
    }
    
    // 3. Insert new choices
    const choicesToInsert = cardData.choices.map((choice: any) => ({
      card_id: cardData.id,
      label: choice.label,
      description: choice.description,
      cash_effect: choice.cash_effect || 0,
      revenue_effect: choice.revenue_effect || 0,
      expenses_effect: choice.expenses_effect || 0,
      duration: choice.duration || 1,
      delayed_cash_value: choice.delayed_cash_value || null,
      delayed_cash_months: choice.delayed_cash_months || null
    }));
    
    const { data: choices, error: choicesError } = await supabase
      .from('card_choices')
      .insert(choicesToInsert)
      .select();
      
    if (choicesError) throw choicesError;
    
    return { success: true, card, choices };
  } catch (error) {
    console.error('Error saving card:', error);
    return { success: false, error };
  }
}

// Delete a card (choices will cascade delete)
export async function deleteCard(cardId: string) {
  const supabase = createServerSupabaseClient();
  
  const { error } = await supabase
    .from('cards')
    .delete()
    .eq('id', cardId);
    
  if (error) {
    console.error(`Error deleting card ${cardId}:`, error);
    return { success: false, error };
  }
  
  return { success: true };
}

