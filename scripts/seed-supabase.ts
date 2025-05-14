// @ts-nocheck
// scripts/seed-supabase.js
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Your industries and cards data...

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use service_role key to bypass RLS
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL or service role key is missing. Check your .env.local file.');
  process.exit(1);
}

// Create client with admin privileges - renamed to supabaseAdmin
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seedIndustries() {
  console.log('Seeding industries...');
  
  try {
    const industriesData = industries.map(industry => ({
      id: industry.id,
      name: industry.name,
      description: industry.description,
      icon: industry.icon,
      starting_cash: industry.startingCash,
      starting_revenue: industry.startingRevenue,
      starting_expenses: industry.startingExpenses
    }));
    
    // Use supabaseAdmin instead of supabase
    const { data, error } = await supabaseAdmin
      .from('industries')
      .upsert(industriesData);
    
    if (error) {
      console.error('Error seeding industries:', error);
      return false;
    }
    
    console.log('Industries seeded successfully');
    return true;
  } catch (err) {
    console.error('Exception while seeding industries:', err);
    return false;
  }
}

async function seedCards() {
  console.log('Seeding cards...');
  
  try {
    let allCards = [];
    
    // Process each industry's cards
    Object.entries(cards).forEach(([industryId, industryCards]) => {
      const industryCardsData = industryCards.map(card => ({
        id: card.id,
        industry_id: industryId,
        type: card.type,
        question: card.question,
        choice_title: card.choiceTitle,
        choices: card.choices
      }));
      
      allCards = [...allCards, ...industryCardsData];
    });
    
    // Use supabaseAdmin instead of supabase
    const { data, error } = await supabaseAdmin
      .from('cards')
      .upsert(allCards);
    
    if (error) {
      console.error('Error seeding cards:', error);
      return false;
    }
    
    console.log('Cards seeded successfully');
    return true;
  } catch (err) {
    console.error('Exception while seeding cards:', err);
    return false;
  }
}

async function main() {
  try {
    const industryResult = await seedIndustries();
    if (!industryResult) {
      console.error('Failed to seed industries. Exiting.');
      process.exit(1);
    }
    
    const cardsResult = await seedCards();
    if (!cardsResult) {
      console.error('Failed to seed cards. Exiting.');
      process.exit(1);
    }
    
    console.log('All data seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Unhandled exception:', err);
    process.exit(1);
  }
}

main();