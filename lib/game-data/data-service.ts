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
    isAvailable: industry.is_available || false,
    mobile_background: industry.mobile_background,
    desktop_background: industry.desktop_background
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
    isAvailable: data.is_available || false,
    mobile_background: data.mobile_background,
    desktop_background: data.desktop_background
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

// For percentage effects (no scaling)
function getRandomPercentInRange(min: number, max: number) {
  if (typeof min !== 'number' || typeof max !== 'number') return 0;
  if (min === max) return min;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Export the utility functions so they can be used elsewhere
export { getRandomInRange, getRandomInt, getRandomPercentInRange };

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

    // Pass through all the original fields, don't transform to game values yet
    const choices = choicesData.map(choice => ({
      id: choice.id,
      card_id: choice.card_id,
      label: choice.label,
      description: choice.description,
      cash_min: choice.cash_min,
      cash_max: choice.cash_max,
      cash_is_percent: choice.cash_is_percent,
      revenue_min: choice.revenue_min,
      revenue_max: choice.revenue_max,
      revenue_is_percent: choice.revenue_is_percent,
      revenue_duration: choice.revenue_duration,
      expenses_min: choice.expenses_min,
      expenses_max: choice.expenses_max,
      expenses_is_percent: choice.expenses_is_percent,
      expenses_duration: choice.expenses_duration,
      customer_rating_min: choice.customer_rating_min,
      customer_rating_max: choice.customer_rating_max
    }));

    return {
      id: card.id,
      industry_id: card.industry_id,  // Added this field to fix TypeScript error
      type: card.type,
      title: card.title,
      description: card.description,
      stage_month: card.stage_month,
      min_cash: card.min_cash,
      max_cash: card.max_cash,
      rarity: card.rarity,  // Added this field to fix TypeScript error
      choices
    };
  }));

  // Remove any null entries (from cards where choices couldn't be loaded)
  return cards.filter(card => card !== null) as Card[];
}


//////////
//ADMIN
//////////

// Create a new industry
export async function createIndustry(industryData: Omit<Industry, 'isAvailable'> & { isAvailable?: boolean }): Promise<Industry | null> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('industries')
    .insert({
      id: industryData.id,
      name: industryData.name,
      description: industryData.description || '',
      icon: industryData.icon || '🏢',
      starting_cash: industryData.startingCash,
      starting_revenue: industryData.startingRevenue,
      starting_expenses: industryData.startingExpenses,
      is_available: industryData.isAvailable || false
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error creating industry:', error);
    return null;
  }
  
  return {
    id: data.id,
    name: data.name,
    description: data.description || '',
    icon: data.icon,
    startingCash: data.starting_cash,
    startingRevenue: data.starting_revenue,
    startingExpenses: data.starting_expenses,
    isAvailable: data.is_available
  };
}

// Update an industry
export async function updateIndustry(industryData: Industry): Promise<Industry | null> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('industries')
    .update({
      name: industryData.name,
      description: industryData.description || '',
      icon: industryData.icon,
      starting_cash: industryData.startingCash,
      starting_revenue: industryData.startingRevenue,
      starting_expenses: industryData.startingExpenses,
      is_available: industryData.isAvailable
    })
    .eq('id', industryData.id)
    .select()
    .single();
    
  if (error) {
    console.error(`Error updating industry ${industryData.id}:`, error);
    return null;
  }
  
  return {
    id: data.id,
    name: data.name,
    description: data.description || '',
    icon: data.icon,
    startingCash: data.starting_cash,
    startingRevenue: data.starting_revenue,
    startingExpenses: data.starting_expenses,
    isAvailable: data.is_available
  };
}

// Delete an industry
export async function deleteIndustry(id: string): Promise<boolean> {
  const supabase = createServerSupabaseClient();
  
  // Check if any cards are using this industry
  const { data: cards, error: cardsError } = await supabase
    .from('cards')
    .select('id')
    .eq('industry_id', id);
    
  if (cardsError) {
    console.error(`Error checking cards for industry ${id}:`, cardsError);
    return false;
  }
  
  // Prevent deletion if there are cards using this industry
  if (cards && cards.length > 0) {
    console.error(`Cannot delete industry ${id} with existing cards`);
    return false;
  }
  
  // Delete the industry
  const { error } = await supabase
    .from('industries')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error(`Error deleting industry ${id}:`, error);
    return false;
  }
  
  return true;
}



// lib/game-data/data-service.ts (add or update these functions)

// Get all cards with basic info (no choices)
export async function getAllCards() {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('cards')
    .select(`
      *,
      industries(name)
    `)
    .order('industry_id')
    .order('type');
    
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

// lib/game-data/data-service.ts (continued)

// Create/update a card and its choices
export async function saveCard(cardData: any) {
  const supabase = createServerSupabaseClient();
  const isNewCard = !cardData.id || cardData.id === '';
  
  // Start a transaction-like operation (Supabase doesn't support true transactions)
  try {
    // 1. Generate ID for new cards if not provided
    if (isNewCard && !cardData.id) {
      const prefix = cardData.type.toLowerCase().substring(0, 4);
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      cardData.id = `${prefix}-${randomNum}`;
    }
    
    // 2. Save or update the card data
    let cardResult;
    if (isNewCard) {
      // Create new card
      const { data, error } = await supabase
        .from('cards')
        .insert({
          id: cardData.id,
          industry_id: cardData.industry_id,
          type: cardData.type,
          title: cardData.title,
          description: cardData.description || null,
          stage_month: cardData.stage_month || null,
          min_cash: cardData.min_cash || null,
          max_cash: cardData.max_cash || null,
          probability: cardData.probability || 100
        })
        .select()
        .single();
        
      if (error) throw error;
      cardResult = data;
    } else {
      // Update existing card
      const { data, error } = await supabase
        .from('cards')
        .update({
          industry_id: cardData.industry_id,
          type: cardData.type,
          title: cardData.title,
          description: cardData.description || null,
          stage_month: cardData.stage_month || null,
          min_cash: cardData.min_cash || null,
          max_cash: cardData.max_cash || null,
          probability: cardData.probability || 100
        })
        .eq('id', cardData.id)
        .select()
        .single();
        
      if (error) throw error;
      cardResult = data;
    }
    
    // 3. Delete existing choices (if updating)
    if (!isNewCard) {
      const { error: deleteError } = await supabase
        .from('card_choices')
        .delete()
        .eq('card_id', cardData.id);
        
      if (deleteError) throw deleteError;
    }
    
    // 4. Insert new choices
    if (cardData.choices && cardData.choices.length > 0) {
      const choicesToInsert = cardData.choices.map((choice: any) => ({
        card_id: cardData.id,
        label: choice.label,
        description: choice.description,
        cash_min: choice.cash_min || 0,
        cash_max: choice.cash_max || 0,
        revenue_min: choice.revenue_min || 0,
        revenue_max: choice.revenue_max || 0,
        expenses_min: choice.expenses_min || 0,
        expenses_max: choice.expenses_max || 0,
        customer_rating_min: choice.customer_rating_min || 0,
        customer_rating_max: choice.customer_rating_max || 0,
        duration: choice.duration || 1
      }));
      
      const { error: choicesError } = await supabase
        .from('card_choices')
        .insert(choicesToInsert);
        
      if (choicesError) throw choicesError;
    }
    
    return { success: true, card: cardResult };
  } catch (error) {
    console.error('Error saving card:', error);
    return { success: false, error };
  }
}

// Delete a card and its choices
export async function deleteCard(cardId: string) {
  const supabase = createServerSupabaseClient();
  
  // Delete the card (choices will cascade delete due to foreign key constraints)
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

// Clone a card with its choices
export async function cloneCard(cardId: string) {
  const supabase = createServerSupabaseClient();
  
  try {
    // Get the original card with choices
    const original = await getCardForEditing(cardId);
    
    if (!original) {
      return { success: false, error: 'Card not found' };
    }
    
    // Create a new ID based on the original
    const prefix = original.type.toLowerCase().substring(0, 4);
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const newId = `${prefix}-${randomNum}`;
    
    // Create new card data
    const newCardData = {
      ...original,
      id: newId,
      title: `Copy of ${original.title}`
    };
    
    // Save the new card with choices
    return await saveCard(newCardData);
  } catch (error) {
    console.error(`Error cloning card ${cardId}:`, error);
    return { success: false, error };
  }
}