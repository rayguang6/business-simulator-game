// app/api/admin/save-card/route.tsx
import { saveCard } from '@/lib/game-data/data-service';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const cardData = await request.json();
    
    // Simple validation
    if (!cardData.industry_id || !cardData.type || !cardData.question || !cardData.choice_title) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    if (!cardData.choices || cardData.choices.length < 2) {
      return NextResponse.json(
        { success: false, error: 'A card must have at least 2 choices' },
        { status: 400 }
      );
    }
    
    // Save the card
    const result: { success: boolean; card?: any; error?: any } = await saveCard(cardData);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: typeof result.error === 'string' ? result.error : (result.error?.message || 'Failed to save card') },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, card: result.card });
  } catch (error: unknown) {
    console.error('Error saving card:', error);
    let errorMessage = 'Internal server error';
    if (typeof error === 'object' && error && 'message' in error) {
      errorMessage = (error as { message?: string }).message || errorMessage;
    }
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}