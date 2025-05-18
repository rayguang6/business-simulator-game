'use client';

import { useEffect, useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase';
import CardForm from '@/components/admin/CardForm';

// This is now a client component that fetches its own data
export default function EditCardPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [card, setCard] = useState<any>(null);
  const [industries, setIndustries] = useState<any[]>([]);

  // Fetch data on mount
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch industries first
        const industriesResponse = await fetch('/api/admin/industries');
        if (!industriesResponse.ok) {
          throw new Error('Failed to load industries');
        }
        const industriesData = await industriesResponse.json();
        setIndustries(industriesData);

        // For new cards, we're done
        if (id === 'new') {
          setLoading(false);
          return;
        }

        // For existing cards, fetch the card data
        const cardResponse = await fetch(`/api/admin/cards/${id}`);
        if (!cardResponse.ok) {
          if (cardResponse.status === 404) {
            router.replace('/admin/cards');
            return;
          }
          throw new Error('Failed to load card data');
        }
        
        const cardData = await cardResponse.json();
        setCard(cardData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id, router]);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="text-gray-800">{error}</p>
        <button 
          onClick={() => router.push('/admin/cards')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Return to Cards
        </button>
      </div>
    );
  }

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