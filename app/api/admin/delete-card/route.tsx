// app/api/admin/delete-card/route.js
import { deleteCard } from '@/lib/game-data/data-service';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get('id');
    
    if (!cardId) {
      return NextResponse.json(
        { success: false, error: 'Card ID is required' },
        { status: 400 }
      );
    }
    
    const result = await deleteCard(cardId);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error?.message || 'Failed to delete card' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting card:', error);
    return NextResponse.json(
      { success: false, error: (error as { message?: string }).message || 'Internal server error' },
      { status: 500 }
    );
  }
}