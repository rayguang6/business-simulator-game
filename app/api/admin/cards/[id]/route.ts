import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET a single card with its choices
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const { id } = params;
  
  // Get the card
  const { data: card, error: cardError } = await supabase
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
  const { data: choices, error: choicesError } = await supabase
    .from('card_choices')
    .select('*')
    .eq('card_id', id);

  if (choicesError) {
    return NextResponse.json({ error: choicesError.message }, { status: 500 });
  }

  return NextResponse.json({ ...card, choices });
}

// DELETE a card and its choices
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const { id } = params;

  // Delete the card (choices will cascade delete)
  const { error } = await supabase
    .from('cards')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}