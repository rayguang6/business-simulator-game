// app/admin/cards/[id]/page.js
import { getCardForEditing, getIndustries } from '@/lib/game-data/data-service';
import CardForm from '@/components/admin/CardForm';
import { notFound } from 'next/navigation';

export default async function EditCardPage({ params }: { params: { id: string } }) {
  const { id } = params;
  
  // For new cards
  if (id === 'new') {
    const industries = await getIndustries();
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create New Card</h1>
        <CardForm industries={industries} card={undefined} />
      </div>
    );
  }
  
  // For existing cards
  const card = await getCardForEditing(id);
  const industries = await getIndustries();
  
  if (!card) {
    return notFound();
  }
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Edit Card</h1>
      <CardForm card={card} industries={industries} />
    </div>
  );
}