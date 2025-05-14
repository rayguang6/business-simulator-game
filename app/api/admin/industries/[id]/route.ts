// app/api/admin/industries/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET a single industry
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const { id } = params;
  
  const { data, error } = await supabase
    .from('industries')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Industry not found' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(data);
}

// DELETE an industry
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const { id } = params;
  
  // Check if any cards are using this industry
  const { data: cards, error: cardsError } = await supabase
    .from('cards')
    .select('id')
    .eq('industry_id', id);
    
  if (cardsError) {
    return NextResponse.json({ error: cardsError.message }, { status: 500 });
  }
  
  // Prevent deletion if there are cards using this industry
  if (cards && cards.length > 0) {
    return NextResponse.json(
      { error: 'Cannot delete industry with existing cards. Delete the cards first.' },
      { status: 400 }
    );
  }
  
  // Delete the industry
  const { error } = await supabase
    .from('industries')
    .delete()
    .eq('id', id);
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true });
}