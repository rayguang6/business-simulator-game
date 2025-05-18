import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET all cards with industry info
export async function GET() {
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(data);
}

// POST new card with choices
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  
  try {
    const cardData = await request.json();
    console.log('Received card data:', cardData);
    
    // Validate required fields
    if (!cardData.id || !cardData.industry_id || !cardData.type || !cardData.title) {
      console.error('Missing required fields:', {
        id: cardData.id,
        industry_id: cardData.industry_id,
        type: cardData.type,
        title: cardData.title
      });
      return NextResponse.json(
        { error: 'ID, Industry, Type, and Title are required' },
        { status: 400 }
      );
    }

    // Validate the ID is in UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(cardData.id)) {
      console.error('Invalid UUID format:', cardData.id);
      return NextResponse.json(
        { error: 'Card ID must be a valid UUID' },
        { status: 400 }
      );
    }
    
    // Check if card with this ID already exists
    const { data: existingCard, error: existingCardError } = await supabase
      .from('cards')
      .select('id')
      .eq('id', cardData.id)
      .single();
    
    if (existingCardError && existingCardError.code !== 'PGRST116') {
      console.error('Error checking existing card:', existingCardError);
      return NextResponse.json({ error: existingCardError.message }, { status: 500 });
    }
      
    if (existingCard) {
      return NextResponse.json(
        { error: 'Card with this ID already exists' },
        { status: 400 }
      );
    }
    
    // Insert the new card
    const cardToInsert = {
      id: cardData.id,
      industry_id: cardData.industry_id,
      type: cardData.type,
      title: cardData.title,
      description: cardData.description || null,
      stage_month: cardData.stage_month || null,
      min_cash: cardData.min_cash || null,
      max_cash: cardData.max_cash || null,
      rarity: cardData.rarity || 1
    };
    
    console.log('Inserting card:', cardToInsert);
    
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .insert(cardToInsert)
      .select()
      .single();
      
    if (cardError) {
      console.error('Error inserting card:', cardError);
      return NextResponse.json({ error: cardError.message }, { status: 500 });
    }
    
    // Insert card choices
    if (cardData.choices && cardData.choices.length > 0) {
      const choicesToInsert = cardData.choices.map((choice: any) => {
        // Create a base choice object with all required fields
        return {
          card_id: cardData.id,
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
        };
      });
      
      console.log('Inserting choices:', choicesToInsert);
      
      const { error: choicesError } = await supabase
        .from('card_choices')
        .insert(choicesToInsert);
        
      if (choicesError) {
        // If choices insertion fails, try to delete the card
        console.error('Error inserting choices:', choicesError);
        await supabase.from('cards').delete().eq('id', cardData.id);
        return NextResponse.json({ error: choicesError.message }, { status: 500 });
      }
    }
    
    return NextResponse.json({ success: true, card });
  } catch (error) {
    console.error('Error creating card:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create card' },
      { status: 500 }
    );
  }
}

// PUT update card with choices
export async function PUT(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  
  try {
    const cardData = await request.json();
    console.log('Updating card data:', cardData);
    
    // Validate required fields
    if (!cardData.id || !cardData.industry_id || !cardData.type || !cardData.title) {
      console.error('Missing required fields:', {
        id: cardData.id,
        industry_id: cardData.industry_id,
        type: cardData.type,
        title: cardData.title
      });
      return NextResponse.json(
        { error: 'ID, Industry, Type, and Title are required' },
        { status: 400 }
      );
    }
    
    // Validate the ID is in UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(cardData.id)) {
      console.error('Invalid UUID format:', cardData.id);
      return NextResponse.json(
        { error: 'Card ID must be a valid UUID' },
        { status: 400 }
      );
    }
    
    // Update the card
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .update({
        industry_id: cardData.industry_id,
        type: cardData.type,
        title: cardData.title,
        description: cardData.description || null,
        stage_month: cardData.stage_month || null,
        min_cash: cardData.min_cash || null,
        max_cash: cardData.max_cash || null,
        rarity: cardData.rarity || 1
      })
      .eq('id', cardData.id)
      .select()
      .single();
      
    if (cardError) {
      return NextResponse.json({ error: cardError.message }, { status: 500 });
    }
    
    // Delete existing choices
    const { error: deleteError } = await supabase
      .from('card_choices')
      .delete()
      .eq('card_id', cardData.id);
      
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
    
    // Insert new choices
    if (cardData.choices && cardData.choices.length > 0) {
      const choicesToInsert = cardData.choices.map((choice: any) => {
        // Create a base choice object with all required fields
        return {
          card_id: cardData.id,
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
        };
      });
      
      console.log('Inserting choices:', choicesToInsert);
      
      const { error: choicesError } = await supabase
        .from('card_choices')
        .insert(choicesToInsert);
        
      if (choicesError) {
        return NextResponse.json({ error: choicesError.message }, { status: 500 });
      }
    }
    
    return NextResponse.json({ success: true, card });
  } catch (error) {
    console.error('Error updating card:', error);
    return NextResponse.json(
      { error: 'Failed to update card' },
      { status: 500 }
    );
  }
}