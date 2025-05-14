import Link from 'next/link';
import { getAllCards } from '@/lib/game-data/data-service';
import { getIndustries } from '@/lib/game-data/data-service';
import CardList from '@/components/admin/CardList';

export default async function CardsPage() {
  const cards = await getAllCards();
  const industries = await getIndustries();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Cards</h1>
        <Link
          href="/admin/cards/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Add Card
        </Link>
      </div>
      
      <CardList initialCards={cards} industries={industries} />
    </div>
  );
}