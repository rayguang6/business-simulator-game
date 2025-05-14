'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Edit, Trash, CheckCircle, XCircle } from 'lucide-react';

interface IndustryListProps {
  initialIndustries: Industry[];
}

export default function IndustryList({ initialIndustries }: IndustryListProps) {
  const [industries, setIndustries] = useState<Industry[]>(initialIndustries);
  const [industryToDelete, setIndustryToDelete] = useState<Industry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  
  // Toggle industry availability
  const toggleAvailability = async (industry: Industry) => {
    try {
      const response = await fetch(`/api/admin/industries/${industry.id}/toggle-availability`, {
        method: 'PATCH',
      });
      
      if (!response.ok) {
        throw new Error('Failed to update industry');
      }
      
      // Update the industry in the list
      setIndustries(industries.map(i => 
        i.id === industry.id 
          ? { ...i, isAvailable: !i.isAvailable } 
          : i
      ));
      
      // Refresh the page
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };
  
  // Delete industry
  const confirmDelete = (industry: Industry) => {
    setIndustryToDelete(industry);
  };
  
  const cancelDelete = () => {
    setIndustryToDelete(null);
  };
  
  const handleDelete = async () => {
    if (!industryToDelete) return;
    
    setIsDeleting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/industries/${industryToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete industry');
      }
      
      // Remove the industry from the list
      setIndustries(industries.filter(i => i.id !== industryToDelete.id));
      setIndustryToDelete(null);
      
      // Refresh the page
      router.refresh();
    } catch (err) {
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
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Icon</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Starting Cash</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {industries.map((industry) => (
              <tr key={industry.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-2xl">{industry.icon}</td>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{industry.name}</td>
                <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{industry.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600">${industry.startingCash.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span 
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      industry.isAvailable 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {industry.isAvailable ? 'Available' : 'Coming Soon'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex space-x-3">
                  <Link 
                    href={`/admin/industries/${industry.id}`}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    <Edit size={18} />
                  </Link>
                  <button 
                    onClick={() => toggleAvailability(industry)}
                    className={`${
                      industry.isAvailable 
                        ? 'text-red-500 hover:text-red-700' 
                        : 'text-green-500 hover:text-green-700'
                    }`}
                    title={industry.isAvailable ? 'Mark as Coming Soon' : 'Mark as Available'}
                  >
                    {industry.isAvailable ? <XCircle size={18} /> : <CheckCircle size={18} />}
                  </button>
                  <button 
                    onClick={() => confirmDelete(industry)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Delete confirmation modal */}
      {industryToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Confirm Delete</h3>
            <p className="mb-4 text-gray-600">
              Are you sure you want to delete the industry "{industryToDelete.name}"? This action cannot be undone.
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