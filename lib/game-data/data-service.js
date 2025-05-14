// lib/game-data/data-service.js
import { createServerSupabaseClient } from '../supabase';

export async function getIndustries() {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('industries')
    .select('*');
    
  if (error) {
    console.error('Error fetching industries:', error);
    return [];
  }
  
  // Transform the data to match your current structure
  return data.map(industry => ({
    id: industry.id,
    name: industry.name,
    description: industry.description,
    icon: industry.icon,
    startingCash: industry.starting_cash,
    startingRevenue: industry.starting_revenue,
    startingExpenses: industry.starting_expenses
  }));
}

export async function getCardsByIndustry(industryId) {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('industry_id', industryId);
    
  if (error) {
    console.error(`Error fetching cards for industry ${industryId}:`, error);
    return [];
  }
  
  // Transform the data to match your current structure
  return data.map(card => ({
    id: card.id,
    type: card.type,
    question: card.question,
    choiceTitle: card.choice_title,
    choices: card.choices // This is already JSON
  }));
}