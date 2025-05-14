import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// PATCH toggle availability
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const { id } = params;
  
  // Get current value
  const { data: industry, error: getError } = await supabase
    .from('industries')
    .select('is_available')
    .eq('id', id)
    .single();
    
  if (getError) {
    if (getError.code === 'PGRST116') {
      return NextResponse.json({ error: 'Industry not found' }, { status: 404 });
    }
    return NextResponse.json({ error: getError.message }, { status: 500 });
  }
  
  // Toggle the value
  const { data, error } = await supabase
    .from('industries')
    .update({ is_available: !industry.is_available })
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(data);
}