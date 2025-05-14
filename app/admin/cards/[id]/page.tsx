import { notFound } from 'next/navigation';
import { getCardForEditing, getIndustries } from '@/lib/game-data/data-service';
import CardForm from '@/components/admin/CardForm';

export default async function EditCardPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const industries = await getIndustries();
  
  // For new cards
  if (id === 'new') {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Create New Card</h1>
        <CardForm industries={industries} />
      </div>
    );
  }
  
  // For existing cards
  const card = await getCardForEditing(id);
  
  if (!card) {
    return notFound();
  }
  
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Edit Card</h1>
      <CardForm card={card} industries={industries} />
    </div>
  );
}