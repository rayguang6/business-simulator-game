'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Edit, Trash, Eye, Copy, Download, Upload } from 'lucide-react';
import { getCardTypeStyle } from '@/lib/utls';
import { CardTypeEnum } from '@/lib/constants';

// Define a type for the card data returned from the API
interface CardListProps {
  initialCards: Card[];
  industries: Industry[];
}

export default function CardList({ initialCards, industries }: CardListProps) {
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [cardToDelete, setCardToDelete] = useState<Card | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterIndustry, setFilterIndustry] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  
  const router = useRouter();

  // Filter cards based on selected filters
  const filteredCards = cards.filter(card => {
    if (filterIndustry && card.industry_id !== filterIndustry) return false;
    if (filterType && card.type !== filterType) return false;
    return true;
  });
  
  // Delete card
  const confirmDelete = (card: Card) => {
    setCardToDelete(card);
  };
  
  const cancelDelete = () => {
    setCardToDelete(null);
  };
  
  const handleDelete = async () => {
    if (!cardToDelete) return;
    
    setIsDeleting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/cards/${cardToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete card');
      }
      
      // Remove the card from the list
      setCards(cards.filter(c => c.id !== cardToDelete.id));
      setCardToDelete(null);
      
      // Refresh the page
      router.refresh();
    } catch (err) {
      // components/admin/CardList.tsx (continued)
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {/* Filters and Buttons */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2 md:gap-0">
          <h3 className="text-lg font-medium text-gray-800 mb-2 md:mb-0">Filters</h3>
          {(filterIndustry || filterType) && (
            <button
              onClick={() => { setFilterIndustry(''); setFilterType(''); }}
              className="ml-2 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Clear Filters"
            >
              Clear Filters
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="industry-filter">
              Filter by Industry
            </label>
            <select
              id="industry-filter"
              value={filterIndustry}
              onChange={(e) => setFilterIndustry(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
              aria-label="Filter by Industry"
            >
              <option value="">All Industries</option>
              {industries
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(industry => (
                  <option key={industry.id} value={industry.id}>
                    {industry.icon ? `${industry.icon} ` : ''}{industry.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="type-filter">
              Filter by Type
            </label>
            <select
              id="type-filter"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
              aria-label="Filter by Type"
            >
              <option value="">All Types</option>
              {Object.values(CardTypeEnum).map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Cards Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Title</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Description</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Industry</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCards.map((card) => {
              const industry = industries.find(i => i.id === card.industry_id);
              return (
                <tr key={card.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getCardTypeStyle(card.type)}`}>
                      {card.type}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-gray-700 max-w-xs truncate font-medium">
                    {card.title}
                  </td>
                  <td className="px-4 py-4 text-gray-600 max-w-xs truncate">
                    {card.description && card.description.length > 60
                      ? card.description.slice(0, 60) + '...'
                      : card.description}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-gray-600">
                    {industry ? (industry.icon ? `${industry.icon} ` : '') + industry.name : card.industry_id}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm flex space-x-3">
                    <Link 
                      href={`/admin/cards/${card.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </Link>
                    <button 
                      onClick={() => confirmDelete(card)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <Trash size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Empty state */}
      {filteredCards.length === 0 && (
        <div className="bg-white p-8 rounded-lg shadow-md text-center mt-4">
          <p className="text-gray-600 mb-4">No cards found for the selected filters.</p>
          <Link
            href="/admin/cards/new"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Your First Card
          </Link>
        </div>
      )}
      
      {/* Delete confirmation modal */}
      {cardToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Confirm Delete</h3>
            <p className="mb-4 text-gray-600">
              Are you sure you want to delete the card "{cardToDelete.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-400"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}