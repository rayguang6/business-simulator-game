import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  
  try {
    const { cards } = await request.json();
    
    if (!Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json(
        { error: 'Invalid data format or empty array' },
        { status: 400 }
      );
    }
    
    // Process each card one by one
    const results = await Promise.all(cards.map(async (card) => {
      try {
        // Basic validation
        if (!card.id || !card.industry_id || !card.type || !card.title) {
          return { id: card.id || 'unknown', success: false, error: 'Missing required fields' };
        }
        
        // Check if card exists already
        const { data: existingCard } = await supabase
          .from('cards')
          .select('id')
          .eq('id', card.id)
          .single();
          
        if (existingCard) {
          // Update existing card
          const { error } = await supabase
            .from('cards')
            .update({
              industry_id: card.industry_id,
              type: card.type,
              title: card.title,
              description: card.description || null,
              stage_month: card.stage_month || null,
              min_cash: card.min_cash || null,
              max_cash: card.max_cash || null,
              probability: card.probability || 100
            })
            .eq('id', card.id);
            
          if (error) throw error;
        } else {
          // Insert new card
          const { error } = await supabase
            .from('cards')
            .insert({
              id: card.id,
              industry_id: card.industry_id,
              type: card.type,
              title: card.title,
              description: card.description || null,
              stage_month: card.stage_month || null,
              min_cash: card.min_cash || null,
              max_cash: card.max_cash || null,
              probability: card.probability || 100
            });
            
          if (error) throw error;
        }
        
        return { id: card.id, success: true };
      } catch (error) {
        console.error(`Error processing card ${card.id}:`, error);
        return { id: card.id, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }));
    
    // Count successes and failures
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    return NextResponse.json({ 
      success: true, 
      message: `Imported ${successful} cards successfully. ${failed} cards failed.`,
      results 
    });
  } catch (error) {
    console.error('Error importing cards:', error);
    return NextResponse.json(
      { error: 'Failed to import cards' },
      { status: 500 }
    );
  }
}