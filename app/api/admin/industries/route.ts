import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET all industries
export async function GET() {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('industries')
    .select('*')
    .order('is_available', { ascending: false })
    .order('name', { ascending: true });
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(data);
}

// POST new industry
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  
  try {
    const industryData = await request.json();
    
    // Validate required fields
    if (!industryData.id || !industryData.name) {
      return NextResponse.json(
        { error: 'ID and Name are required' },
        { status: 400 }
      );
    }
    
    // Check if industry with this ID already exists
    const { data: existingIndustry } = await supabase
      .from('industries')
      .select('id')
      .eq('id', industryData.id)
      .single();
      
    if (existingIndustry) {
      return NextResponse.json(
        { error: 'Industry with this ID already exists' },
        { status: 400 }
      );
    }
    
    // Insert the new industry
    const { data, error } = await supabase
      .from('industries')
      .insert({
        id: industryData.id,
        name: industryData.name,
        description: industryData.description || null,
        icon: industryData.icon || '🏢',
        starting_cash: industryData.startingCash,
        starting_revenue: industryData.startingRevenue,
        starting_expenses: industryData.startingExpenses,
        is_available: industryData.isAvailable || false
      })
      .select()
      .single();
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating industry:', error);
    return NextResponse.json(
      { error: 'Failed to create industry' },
      { status: 500 }
    );
  }
}

// PUT update industry
export async function PUT(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  
  try {
    const industryData = await request.json();
    
    // Validate required fields
    if (!industryData.id || !industryData.name) {
      return NextResponse.json(
        { error: 'ID and Name are required' },
        { status: 400 }
      );
    }
    
    // Update the industry
    const { data, error } = await supabase
      .from('industries')
      .update({
        name: industryData.name,
        description: industryData.description || null,
        icon: industryData.icon || '🏢',
        starting_cash: industryData.startingCash,
        starting_revenue: industryData.startingRevenue,
        starting_expenses: industryData.startingExpenses,
        is_available: industryData.isAvailable || false
      })
      .eq('id', industryData.id)
      .select()
      .single();
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating industry:', error);
    return NextResponse.json(
      { error: 'Failed to update industry' },
      { status: 500 }
    );
  }
}