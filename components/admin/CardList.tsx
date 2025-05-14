'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Edit, Trash, Eye, Copy, Download, Upload } from 'lucide-react';

// Define a type for the card data returned from the API
interface CardListItem {
  id: string;
  industry_id: string;
  type: string;
  title: string;
  description: string | null;
  stage_month: number | null;
  min_cash: number | null;
  max_cash: number | null;
  probability: number | null;
  industries: {
    name: string;
  };
}

interface CardListProps {
  initialCards: CardListItem[];
  industries: Industry[];
}

export default function CardList({ initialCards, industries }: CardListProps) {
  const [cards, setCards] = useState<CardListItem[]>(initialCards);
  const [cardToDelete, setCardToDelete] = useState<CardListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterIndustry, setFilterIndustry] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter cards based on selected filters
  const filteredCards = cards.filter(card => {
    if (filterIndustry && card.industry_id !== filterIndustry) return false;
    if (filterType && card.type !== filterType) return false;
    return true;
  });
  
  // Delete card
  const confirmDelete = (card: CardListItem) => {
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

  // Clone card
  const handleClone = async (card: CardListItem) => {
    try {
      const response = await fetch(`/api/admin/cards/${card.id}/clone`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to clone card');
      }
      
      // Refresh the page to show the new card
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  // Export all cards to JSON
  const handleExport = () => {
    // Format the data for export (exclude non-essential fields)
    const exportData = cards.map(card => ({
      id: card.id,
      industry_id: card.industry_id,
      type: card.type,
      title: card.title,
      description: card.description,
      stage_month: card.stage_month,
      min_cash: card.min_cash,
      max_cash: card.max_cash,
      probability: card.probability
    }));
    
    // Create a JSON blob and download it
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'business-tycoon-cards.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import cards from JSON
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const cardsData = JSON.parse(event.target?.result as string);
          
          // Validate the data structure
          if (!Array.isArray(cardsData)) {
            throw new Error('Invalid data format. Expected an array of cards.');
          }
          
          // Send to API for processing
          const response = await fetch('/api/admin/cards/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cards: cardsData })
          });
          
          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to import cards');
          }
          
          // Refresh the page
          router.refresh();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An error occurred while parsing the file');
        }
      };
      reader.readAsText(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while reading the file');
    }
    
    // Reset the file input
    e.target.value = '';
  };

  // Get card type style
  const getCardTypeStyle = (type: string) => {
    switch (type) {
      case 'Opportunity':
        return 'bg-emerald-100 text-emerald-800';
      case 'Problem':
        return 'bg-red-100 text-red-800';
      case 'Market':
        return 'bg-blue-100 text-blue-800';
      case 'Happy':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-800">Filters</h3>
          <div className="flex space-x-2">
            <button
              onClick={handleExport}
              className="flex items-center px-3 py-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
              title="Export Cards"
            >
              <Download size={16} className="mr-1" /> Export
            </button>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              className="hidden"
              accept=".json"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center px-3 py-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
              title="Import Cards"
            >
              <Upload size={16} className="mr-1" /> Import
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Industry
            </label>
            <select
              value={filterIndustry}
              onChange={(e) => setFilterIndustry(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
            >
              <option value="">All Industries</option>
              {industries.map(industry => (
                <option key={industry.id} value={industry.id}>
                  {industry.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
            >
              <option value="">All Types</option>
              <option value="Opportunity">Opportunity</option>
              <option value="Problem">Problem</option>
              <option value="Market">Market</option>
              <option value="Happy">Happy</option>
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Industry</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Probability</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Cash Range</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCards.map((card) => (
              <tr key={card.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${getCardTypeStyle(card.type)}`}>
                    {card.type}
                  </span>
                </td>
                <td className="px-4 py-4 text-gray-700 max-w-xs truncate font-medium">
                  {card.title}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-gray-600">
                  {card.industries.name}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-gray-600">
                  {card.probability ? `${card.probability}%` : 'Default'}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-gray-600">
                  {card.min_cash !== null && card.max_cash !== null
                    ? `$${card.min_cash.toLocaleString()} - $${card.max_cash.toLocaleString()}`
                    : 'N/A'}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm flex space-x-3">
                  <Link 
                    href={`/admin/cards/${card.id}/view`}
                    className="text-blue-600 hover:text-blue-900"
                    title="View"
                  >
                    <Eye size={18} />
                  </Link>
                  <Link 
                    href={`/admin/cards/${card.id}`}
                    className="text-indigo-600 hover:text-indigo-900"
                    title="Edit"
                  >
                    <Edit size={18} />
                  </Link>
                  <button
                    onClick={() => handleClone(card)}
                    className="text-purple-600 hover:text-purple-900"
                    title="Clone"
                  >
                    <Copy size={18} />
                  </button>
                  <button 
                    onClick={() => confirmDelete(card)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete"
                  >
                    <Trash size={18} />
                  </button>
                </td>
              </tr>
            ))}
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