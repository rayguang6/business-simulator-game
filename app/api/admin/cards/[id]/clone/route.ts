import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const { id } = params;
  
  try {
    // Get the original card
    const { data: originalCard, error: cardError } = await supabase
      .from('cards')
      .select('*')
      .eq('id', id)
      .single();
      
    if (cardError) {
      if (cardError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Card not found' }, { status: 404 });
      }
      return NextResponse.json({ error: cardError.message }, { status: 500 });
    }
    
    // Get the choices
    const { data: originalChoices, error: choicesError } = await supabase
      .from('card_choices')
      .select('*')
      .eq('card_id', id);
      
    if (choicesError) {
      return NextResponse.json({ error: choicesError.message }, { status: 500 });
    }
    
    // Create a new ID
    const prefix = originalCard.type.toLowerCase().substring(0, 4);
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const newId = `${prefix}-${randomNum}`;
    
    // Clone the card
    const { data: newCard, error: newCardError } = await supabase
      .from('cards')
      .insert({
        ...originalCard,
        id: newId,
        title: `Copy of ${originalCard.title}`
      })
      .select()
      .single();
      
    if (newCardError) {
      return NextResponse.json({ error: newCardError.message }, { status: 500 });
    }
    
    // Clone the choices
    if (originalChoices && originalChoices.length > 0) {
      const newChoices = originalChoices.map(choice => ({
        ...choice,
        id: undefined, // Let the database generate a new ID
        card_id: newId
      }));
      
      const { error: newChoicesError } = await supabase
        .from('card_choices')
        .insert(newChoices);
        
      if (newChoicesError) {
        // If choices insertion fails, delete the cloned card
        await supabase.from('cards').delete().eq('id', newId);
        return NextResponse.json({ error: newChoicesError.message }, { status: 500 });
      }
    }
    
    return NextResponse.json({ success: true, card: newCard });
  } catch (error) {
    console.error('Error cloning card:', error);
    return NextResponse.json(
      { error: 'Failed to clone card' },
      { status: 500 }
    );
  }
}