// app/admin/page.js
import Link from 'next/link';
import { getAllCards } from '@/lib/game-data/data-service';
import CardList from '@/components/admin/CardList';

export default async function AdminPage() {
  const cards = await getAllCards();
  
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Card Admin</h1>
        <Link 
          href="/admin/cards/new" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Add New Card
        </Link>
      </div>
      
      <CardList initialCards={cards} />
    </div>
  );
}