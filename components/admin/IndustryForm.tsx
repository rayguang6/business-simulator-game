'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface IndustryFormProps {
  industry?: Industry;
}

export default function IndustryForm({ industry }: IndustryFormProps) {
  const isNewIndustry = !industry;
  const router = useRouter();
  
  const [formData, setFormData] = useState<Industry>({
    id: industry?.id || '',
    name: industry?.name || '',
    description: industry?.description || '',
    icon: industry?.icon || '🏢',
    startingCash: industry?.startingCash || 10000,
    startingRevenue: industry?.startingRevenue || 5000,
    startingExpenses: industry?.startingExpenses || 3000,
    isAvailable: industry?.isAvailable || false
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) : value
    }));
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // For new industries, generate an ID if not provided
      let dataToSave = { ...formData };
      
      if (isNewIndustry && !dataToSave.id) {
        // Create a slug from the name
        dataToSave.id = dataToSave.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }
      
      // Make API call to save the industry
      const response = await fetch('/api/admin/industries', {
        method: isNewIndustry ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save industry');
      }
      
      // Redirect back to industries page
      router.push('/admin/industries');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const popularIcons = ['🏢', '☕', '🛍️', '💻', '🏪', '🍔', '🚗', '🏥', '🏫', '🏦', '🏭', '🏗️', '🚀'];
  
  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* <div>
          <label className="block text-gray-700 font-medium mb-2">
            Industry ID
          </label>
          <input
            type="text"
            name="id"
            value={formData.id}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 cursor-not-allowed"
            placeholder="coffee-shop"
          />
          <p className="text-xs text-gray-500 mt-1">
            Unique identifier for the industry (auto-generated, cannot be changed)
          </p>
        </div> */}
        
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
            placeholder="Coffee Shop"
          />
        </div>
      </div>
      
      <div className="mb-6">
        <label className="block text-gray-700 font-medium mb-2">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
          placeholder="Create a cozy café serving specialty coffee and pastries."
        />
      </div>
      
      <div className="mb-6">
        <label className="block text-gray-700 font-medium mb-2">
          Icon
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {popularIcons.map(icon => (
            <button
              key={icon}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, icon }))}
              className={`w-10 h-10 text-xl flex items-center justify-center rounded ${
                formData.icon === icon
                  ? 'bg-blue-100 border-2 border-blue-500'
                  : 'bg-gray-100 border border-gray-300 hover:bg-gray-200'
              }`}
            >
              {icon}
            </button>
          ))}
        </div>
        <input
          type="text"
          name="icon"
          value={formData.icon}
          onChange={handleChange}
          maxLength={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
          placeholder="🏢"
        />
        <p className="text-xs text-gray-500 mt-1">
          Enter an emoji or select from the options above
        </p>
      </div>
      
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Starting Cash
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
            <input
              type="number"
              name="startingCash"
              value={formData.startingCash}
              onChange={handleChange}
              min={0}
              step={100}
              required
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Starting Revenue
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
            <input
              type="number"
              name="startingRevenue"
              value={formData.startingRevenue}
              onChange={handleChange}
              min={0}
              step={100}
              required
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Monthly revenue
          </p>
        </div>
        
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Starting Expenses
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
            <input
              type="number"
              name="startingExpenses"
              value={formData.startingExpenses}
              onChange={handleChange}
              min={0}
              step={100}
              required
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Monthly expenses
          </p>
        </div>
      </div>
      
      <div className="mb-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            name="isAvailable"
            checked={formData.isAvailable}
            onChange={handleCheckboxChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-gray-700">Show to Players</span>
        </label>
        <p className="text-xs text-gray-500 mt-1 ml-6">
          If unchecked, this industry will be hidden from players and shown as "Coming Soon" in the game.
        </p>
      </div>
      
      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => router.push('/admin/industries')}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 bg-white"
        >
          Cancel
        </button>
        
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
        >
          {loading ? 'Saving...' : 'Save Industry'}
        </button>
      </div>
    </form>
  );
}