'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, MinusCircle } from 'lucide-react';

// Define the interface for the card form data
interface CardFormProps {
  card?: any; // Using any for now, will refine when you finalize your CardFormData interface
  industries: Industry[];
}

export default function CardForm({ card, industries }: CardFormProps) {
  const isNewCard = !card;
  const router = useRouter();
  
  // Initialize form state
  const [formData, setFormData] = useState({
    id: card?.id || '',
    industry_id: card?.industry_id || (industries[0]?.id || ''),
    type: card?.type || 'Opportunity',
    title: card?.title || '',
    description: card?.description || '',
    stage_month: card?.stage_month || null,
    min_cash: card?.min_cash || null,
    max_cash: card?.max_cash || null,
    probability: card?.probability || 100,
    rarity: card?.rarity || 1,
    choices: card?.choices?.length ? card.choices : [
      { 
        label: 'Yes', 
        description: '',
        cash_min: 0,
        cash_max: 0,
        cash_is_percent: false,
        revenue_min: 0,
        revenue_max: 0,
        revenue_is_percent: false,
        revenue_duration: 0, // 0 means infinite/permanent effect
        expenses_min: 0,
        expenses_max: 0,
        expenses_is_percent: false,
        expenses_duration: 0, // 0 means infinite/permanent effect
        customer_rating_min: 0,
        customer_rating_max: 0
      },
      { 
        label: 'No', 
        description: '',
        cash_min: 0,
        cash_max: 0,
        cash_is_percent: false,
        revenue_min: 0,
        revenue_max: 0,
        revenue_is_percent: false,
        revenue_duration: 0, // 0 means infinite/permanent effect
        expenses_min: 0,
        expenses_max: 0,
        expenses_is_percent: false,
        expenses_duration: 0, // 0 means infinite/permanent effect
        customer_rating_min: 0,
        customer_rating_max: 0
      }
    ]
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Generate proper UUID for new cards
  const generateCardId = () => {
    // Use crypto.randomUUID() for proper UUID generation
    // This is supported in modern browsers but we'll add a fallback
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    
    // Fallback implementation for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };
  
  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // For card type, always store as lowercase
    if (name === 'type') {
      setFormData(prev => ({ ...prev, [name]: value.toLowerCase() }));
      return;
    }
    // Handle number inputs
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? null : Number(value)
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  // Handle choice field changes
  const handleChoiceChange = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newChoices = [...prev.choices];
      // For label, always ensure it's a string
      if (field === 'label') {
        newChoices[index] = { ...newChoices[index], [field]: String(value) };
      } else if (field === 'description') {
        newChoices[index] = { ...newChoices[index], [field]: String(value) };
      } else {
        newChoices[index] = { ...newChoices[index], [field]: value };
      }
      return { ...prev, choices: newChoices };
    });
  };
  
  // Add a new choice
  const addChoice = () => {
    setFormData(prev => ({
        ...prev,
      choices: [...prev.choices, { 
        label: `Option ${prev.choices.length + 1}`, 
        description: '',
        cash_min: 0,
        cash_max: 0,
        cash_is_percent: false,
        revenue_min: 0,
        revenue_max: 0,
        revenue_is_percent: false,
        revenue_duration: 0, // 0 means infinite/permanent effect
        expenses_min: 0,
        expenses_max: 0,
        expenses_is_percent: false,
        expenses_duration: 0, // 0 means infinite/permanent effect
        customer_rating_min: 0,
        customer_rating_max: 0
      }]
    }));
  };
  
  // Remove a choice
  const removeChoice = (index: number) => {
    if (formData.choices.length <= 2) {
      setError('A card must have at least 2 choices');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      choices: prev.choices.filter((_: any, i: any) => i !== index)
    }));
  };
  
  // Save the card
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Generate a new ID for new cards if not already set
      const dataToSave = { ...formData };
      if (isNewCard) {
        // Always use UUID for new cards
        dataToSave.id = generateCardId();
      }
      // Always send type as lowercase
      dataToSave.type = String(dataToSave.type).toLowerCase();
      // Convert rarity to probability (for API compatibility)
      // Use a simple mapping: rarity 1-5 -> probability 100-20
      dataToSave.probability = 120 - (dataToSave.rarity * 20);
      
      // Format choices data for API compatibility
      if (dataToSave.choices && dataToSave.choices.length > 0) {
        dataToSave.choices = dataToSave.choices.map((choice: any) => {
          // Create a copy of the choice and ensure all fields are properly formatted
          const formattedChoice = { 
            label: choice.label || '',
            description: choice.description || '',
            cash_min: ensureNumber(choice.cash_min),
            cash_max: ensureNumber(choice.cash_max),
            cash_is_percent: !!choice.cash_is_percent,
            revenue_min: ensureNumber(choice.revenue_min),
            revenue_max: ensureNumber(choice.revenue_max),
            revenue_is_percent: !!choice.revenue_is_percent,
            revenue_duration: ensureNumber(choice.revenue_duration),
            expenses_min: ensureNumber(choice.expenses_min),
            expenses_max: ensureNumber(choice.expenses_max),
            expenses_is_percent: !!choice.expenses_is_percent,
            expenses_duration: ensureNumber(choice.expenses_duration),
            customer_rating_min: ensureNumber(choice.customer_rating_min),
            customer_rating_max: ensureNumber(choice.customer_rating_max),
          };
          
          return formattedChoice;
        });
      }
      
      console.log('Saving card data:', JSON.stringify(dataToSave, null, 2));
      
      // Make API call to save the card
      const response = await fetch('/api/admin/cards', {
        method: isNewCard ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('Card save error:', responseData);
        throw new Error(responseData.error || 'Failed to save card');
      }
      
      console.log('Card saved successfully:', responseData);
      
      // Redirect back to cards page
      router.push('/admin/cards');
      router.refresh();
    } catch (err) {
      console.error('Error in card submission:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Get card type style
  const getCardTypeStyle = (type: string) => {
    switch (type) {
      case 'Opportunity':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Problem':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Market':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Happy':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Helper function to ensure we have a valid number
  const ensureNumber = (value: any): number => {
    if (value === null || value === undefined || isNaN(Number(value))) {
      return 0;
    }
    return Number(value);
  };
  
  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Industry
          </label>
          <select
            name="industry_id"
            value={formData.industry_id}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
          >
            {industries.map(industry => (
              <option key={industry.id} value={industry.id}>
                {industry.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Card Type
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 ${getCardTypeStyle(formData.type)}`}
          >
            <option value="opportunity">Opportunity</option>
            <option value="problem">Problem</option>
            <option value="market">Market</option>
            <option value="happy">Happy</option>
          </select>
        </div>
      </div>
      
      <div className="mb-6">
        <label className="block text-gray-700 font-medium mb-2">
          Card Title
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
          placeholder="A popular social media influencer has offered to promote your coffee shop"
        />
      </div>
      
      <div className="mb-6">
        <label className="block text-gray-700 font-medium mb-2">Card Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
          placeholder="Describe the scenario or event for this card. E.g., 'A popular influencer offers to promote your shop.'"
        />
      </div>
      
      <div className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-4">Requirements</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-gray-700 text-sm mb-1">Min Cash Requirement</label>
            <input
              type="number"
              name="min_cash"
              value={formData.min_cash === null ? '' : formData.min_cash}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
              placeholder="Minimum cash needed"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum cash required for this card to appear</p>
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1">Max Cash Limit</label>
            <input
              type="number"
              name="max_cash"
              value={formData.max_cash === null ? '' : formData.max_cash}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
              placeholder="Maximum cash limit"
            />
            <p className="text-xs text-gray-500 mt-1">Maximum cash limit for this card to appear</p>
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1">Earliest Month</label>
            <input
              type="number"
              name="stage_month"
              value={formData.stage_month === null ? '' : formData.stage_month}
              onChange={handleChange}
              min={1}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
              placeholder="e.g., 3"
            />
            <p className="text-xs text-gray-500 mt-1">Show this card only after this month</p>
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1">Rarity</label>
            <select
              name="rarity"
              value={formData.rarity || 1}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
            >
              <option value="1">1 (Common)</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5 (Legendary)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">1 = Common, 5 = Legendary</p>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-800">Card Choices</h3>
          <button
            type="button"
            onClick={addChoice}
            className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <PlusCircle size={16} className="mr-1" /> Add Choice
          </button>
        </div>
        
        <div className="space-y-6">
          {formData.choices.map((choice: any, index: any) => (
            <div 
              key={index} 
              className={`p-4 border rounded-md shadow-sm ${
                index % 2 === 0 
                  ? 'bg-white border-blue-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex justify-between mb-3">
                <h4 className="font-medium text-gray-800">Choice {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => removeChoice(index)}
                  className="text-red-600 hover:text-red-800 flex items-center"
                >
                  <MinusCircle size={16} className="mr-1" /> Remove
                </button>
              </div>
              {/* Label and Description Inputs */}
              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm mb-1">Label</label>
                  <input
                    type="text"
                    value={choice.label || ''}
                    onChange={e => handleChoiceChange(index, 'label', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                    placeholder="Choice label (e.g. Yes, No, Accept, Decline)"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm mb-1">Description</label>
                  <input
                    type="text"
                    value={choice.description || ''}
                    onChange={e => handleChoiceChange(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                    placeholder="Describe this choice (optional)"
                  />
                </div>
              </div>

              {/* Cash Effect */}
              <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
                <h5 className="font-semibold text-gray-700 mb-3">Cash Effect</h5>
                <label className="block text-xs text-gray-500 mb-1">Amount</label>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center">
                    <span className="mr-2 text-sm font-medium text-gray-700">Min:</span>
                    <div className="flex">
                      <button 
                        type="button" 
                        className={`px-3 py-1 rounded-l cursor-pointer ${ensureNumber(choice.cash_min) < 0 ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        onClick={() => {
                          handleChoiceChange(index, 'cash_min', Math.abs(ensureNumber(choice.cash_min)) * -1);
                        }}
                      >
                        -
                      </button>
                      <button 
                        type="button" 
                        className={`px-3 py-1 rounded-r cursor-pointer ${ensureNumber(choice.cash_min) >= 0 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        onClick={() => {
                          handleChoiceChange(index, 'cash_min', Math.abs(ensureNumber(choice.cash_min)));
                        }}
                      >
                        +
                      </button>
                    </div>
                    <input
                      type="number"
                      value={Math.abs(ensureNumber(choice.cash_min))}
                      min={0}
                      onChange={e => {
                        const value = Math.max(Number(e.target.value.replace(/[^\d]/g, '')), 0);
                        const sign = ensureNumber(choice.cash_min) < 0 ? -1 : 1;
                        handleChoiceChange(index, 'cash_min', value * sign);
                      }}
                      className="ml-2 w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 text-center"
                    />
                  </div>
                  <span className="mx-2 text-gray-400">to</span>
                  <div className="flex items-center">
                    <span className="mr-2 text-sm font-medium text-gray-700">Max:</span>
                    <div className="flex">
                      <button 
                        type="button" 
                        className={`px-3 py-1 rounded-l cursor-pointer ${ensureNumber(choice.cash_max) < 0 ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        onClick={() => {
                          handleChoiceChange(index, 'cash_max', Math.abs(ensureNumber(choice.cash_max)) * -1);
                        }}
                      >
                        -
                      </button>
                      <button 
                        type="button" 
                        className={`px-3 py-1 rounded-r cursor-pointer ${ensureNumber(choice.cash_max) >= 0 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        onClick={() => {
                          handleChoiceChange(index, 'cash_max', Math.abs(ensureNumber(choice.cash_max)));
                        }}
                      >
                        +
                      </button>
                    </div>
                    <input
                      type="number"
                      value={Math.abs(ensureNumber(choice.cash_max))}
                      min={0}
                      onChange={e => {
                        const value = Math.max(Number(e.target.value.replace(/[^\d]/g, '')), 0);
                        const sign = ensureNumber(choice.cash_max) < 0 ? -1 : 1;
                        handleChoiceChange(index, 'cash_max', value * sign);
                      }}
                      className="ml-2 w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 text-center"
                    />
                  </div>
                  <div className="ml-4 flex items-center">
                    <span className="text-xs text-gray-700 font-medium mr-2">Type:</span>
                    <div className="flex">
                      <button
                        type="button"
                        className={`px-3 py-1 rounded-l cursor-pointer ${!choice.cash_is_percent ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 border border-gray-300'}`}
                        onClick={() => handleChoiceChange(index, 'cash_is_percent', false)}
                      >
                        $
                      </button>
                      <button
                        type="button"
                        className={`px-3 py-1 rounded-r cursor-pointer ${choice.cash_is_percent ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 border border-gray-300'}`}
                        onClick={() => handleChoiceChange(index, 'cash_is_percent', true)}
                      >
                        %
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Enter the minimum and maximum cash effect. Use + or - buttons to make values positive or negative. Use $ for flat amount or % for percentage of current cash.
                </p>
              </div>

              {/* Revenue Effect */}
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
                <h5 className="font-semibold text-gray-700 mb-3">Revenue Effect (per month)</h5>
                <label className="block text-xs text-gray-500 mb-1">Amount</label>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center">
                    <span className="mr-2 text-sm font-medium text-gray-700">Min:</span>
                    <div className="flex">
                      <button 
                        type="button" 
                        className={`px-3 py-1 rounded-l cursor-pointer ${ensureNumber(choice.revenue_min) < 0 ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        onClick={() => {
                          handleChoiceChange(index, 'revenue_min', Math.abs(ensureNumber(choice.revenue_min)) * -1);
                        }}
                      >
                        -
                      </button>
                      <button 
                        type="button" 
                        className={`px-3 py-1 rounded-r cursor-pointer ${ensureNumber(choice.revenue_min) >= 0 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        onClick={() => {
                          handleChoiceChange(index, 'revenue_min', Math.abs(ensureNumber(choice.revenue_min)));
                        }}
                      >
                        +
                      </button>
                    </div>
                    <input
                      type="number"
                      value={Math.abs(ensureNumber(choice.revenue_min))}
                      min={0}
                      onChange={e => {
                        const value = Math.max(Number(e.target.value.replace(/[^\d]/g, '')), 0);
                        const sign = ensureNumber(choice.revenue_min) < 0 ? -1 : 1;
                        handleChoiceChange(index, 'revenue_min', value * sign);
                      }}
                      className="ml-2 w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700 text-center"
                    />
                  </div>
                  <span className="mx-2 text-gray-400">to</span>
                  <div className="flex items-center">
                    <span className="mr-2 text-sm font-medium text-gray-700">Max:</span>
                    <div className="flex">
                      <button 
                        type="button" 
                        className={`px-3 py-1 rounded-l cursor-pointer ${ensureNumber(choice.revenue_max) < 0 ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        onClick={() => {
                          handleChoiceChange(index, 'revenue_max', Math.abs(ensureNumber(choice.revenue_max)) * -1);
                        }}
                      >
                        -
                      </button>
                      <button 
                        type="button" 
                        className={`px-3 py-1 rounded-r cursor-pointer ${ensureNumber(choice.revenue_max) >= 0 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        onClick={() => {
                          handleChoiceChange(index, 'revenue_max', Math.abs(ensureNumber(choice.revenue_max)));
                        }}
                      >
                        +
                      </button>
                    </div>
                    <input
                      type="number"
                      value={Math.abs(ensureNumber(choice.revenue_max))}
                      min={0}
                      onChange={e => {
                        const value = Math.max(Number(e.target.value.replace(/[^\d]/g, '')), 0);
                        const sign = ensureNumber(choice.revenue_max) < 0 ? -1 : 1;
                        handleChoiceChange(index, 'revenue_max', value * sign);
                      }}
                      className="ml-2 w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700 text-center"
                    />
                  </div>
                  <div className="ml-4 flex items-center">
                    <span className="text-xs text-gray-700 font-medium mr-2">Type:</span>
                    <div className="flex">
                      <button
                        type="button"
                        className={`px-3 py-1 rounded-l cursor-pointer ${!choice.revenue_is_percent ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 border border-gray-300'}`}
                        onClick={() => handleChoiceChange(index, 'revenue_is_percent', false)}
                      >
                        $
                      </button>
                      <button
                        type="button"
                        className={`px-3 py-1 rounded-r cursor-pointer ${choice.revenue_is_percent ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 border border-gray-300'}`}
                        onClick={() => handleChoiceChange(index, 'revenue_is_percent', true)}
                      >
                        %
                      </button>
                  </div>
                </div>
                  <div className="ml-4 flex items-center">
                    <span className="text-xs text-gray-700 font-medium mr-2">Duration:</span>
                    <div className="flex items-center">
                      <button
                        type="button"
                        className={`px-3 py-1 rounded-l cursor-pointer ${ensureNumber(choice.revenue_duration) === 0 ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 border border-gray-300'}`}
                        onClick={() => handleChoiceChange(index, 'revenue_duration', 0)}
                      >
                        ∞
                      </button>
                      <button
                        type="button"
                        className={`px-3 py-1 rounded-r cursor-pointer ${ensureNumber(choice.revenue_duration) > 0 ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 border border-gray-300'}`}
                        onClick={() => handleChoiceChange(index, 'revenue_duration', ensureNumber(choice.revenue_duration) > 0 ? ensureNumber(choice.revenue_duration) : 1)}
                      >
                        months
                      </button>
                      {ensureNumber(choice.revenue_duration) > 0 && (
                        <input
                          type="number"
                          value={ensureNumber(choice.revenue_duration)}
                          min={1}
                          onChange={e => handleChoiceChange(index, 'revenue_duration', Math.max(Number(e.target.value.replace(/[^\d]/g, '')), 1))}
                          className="ml-2 w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700 text-center"
                        />
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Enter the min/max monthly revenue effect. Use + or - buttons to make values positive or negative. Use $ for flat or % for percentage of current revenue. Set duration to ∞ for permanent effect.
                </p>
              </div>

              {/* Expenses Effect */}
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <h5 className="font-semibold text-gray-700 mb-3">Expenses Effect (per month)</h5>
                <label className="block text-xs text-gray-500 mb-1">Amount</label>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center">
                    <span className="mr-2 text-sm font-medium text-gray-700">Min:</span>
                    <div className="flex">
                      <button 
                        type="button" 
                        className={`px-3 py-1 rounded-l cursor-pointer ${ensureNumber(choice.expenses_min) < 0 ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        onClick={() => {
                          handleChoiceChange(index, 'expenses_min', Math.abs(ensureNumber(choice.expenses_min)) * -1);
                        }}
                      >
                        -
                      </button>
                      <button 
                        type="button" 
                        className={`px-3 py-1 rounded-r cursor-pointer ${ensureNumber(choice.expenses_min) >= 0 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        onClick={() => {
                          handleChoiceChange(index, 'expenses_min', Math.abs(ensureNumber(choice.expenses_min)));
                        }}
                      >
                        +
                      </button>
                    </div>
                    <input
                      type="number"
                      value={Math.abs(ensureNumber(choice.expenses_min))}
                      min={0}
                      onChange={e => {
                        const value = Math.max(Number(e.target.value.replace(/[^\d]/g, '')), 0);
                        const sign = ensureNumber(choice.expenses_min) < 0 ? -1 : 1;
                        handleChoiceChange(index, 'expenses_min', value * sign);
                      }}
                      className="ml-2 w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-700 text-center"
                    />
                  </div>
                  <span className="mx-2 text-gray-400">to</span>
                  <div className="flex items-center">
                    <span className="mr-2 text-sm font-medium text-gray-700">Max:</span>
                    <div className="flex">
                      <button 
                        type="button" 
                        className={`px-3 py-1 rounded-l cursor-pointer ${ensureNumber(choice.expenses_max) < 0 ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        onClick={() => {
                          handleChoiceChange(index, 'expenses_max', Math.abs(ensureNumber(choice.expenses_max)) * -1);
                        }}
                      >
                        -
                      </button>
                      <button 
                        type="button" 
                        className={`px-3 py-1 rounded-r cursor-pointer ${ensureNumber(choice.expenses_max) >= 0 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        onClick={() => {
                          handleChoiceChange(index, 'expenses_max', Math.abs(ensureNumber(choice.expenses_max)));
                        }}
                      >
                        +
                      </button>
                    </div>
                    <input
                      type="number"
                      value={Math.abs(ensureNumber(choice.expenses_max))}
                      min={0}
                      onChange={e => {
                        const value = Math.max(Number(e.target.value.replace(/[^\d]/g, '')), 0);
                        const sign = ensureNumber(choice.expenses_max) < 0 ? -1 : 1;
                        handleChoiceChange(index, 'expenses_max', value * sign);
                      }}
                      className="ml-2 w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-700 text-center"
                    />
                  </div>
                  <div className="ml-4 flex items-center">
                    <span className="text-xs text-gray-700 font-medium mr-2">Type:</span>
                    <div className="flex">
                      <button
                        type="button"
                        className={`px-3 py-1 rounded-l cursor-pointer ${!choice.expenses_is_percent ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 border border-gray-300'}`}
                        onClick={() => handleChoiceChange(index, 'expenses_is_percent', false)}
                      >
                        $
                      </button>
                      <button
                        type="button"
                        className={`px-3 py-1 rounded-r cursor-pointer ${choice.expenses_is_percent ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 border border-gray-300'}`}
                        onClick={() => handleChoiceChange(index, 'expenses_is_percent', true)}
                      >
                        %
                      </button>
                    </div>
                  </div>
                  <div className="ml-4 flex items-center">
                    <span className="text-xs text-gray-700 font-medium mr-2">Duration:</span>
                    <div className="flex items-center">
                      <button
                        type="button"
                        className={`px-3 py-1 rounded-l cursor-pointer ${ensureNumber(choice.expenses_duration) === 0 ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 border border-gray-300'}`}
                        onClick={() => handleChoiceChange(index, 'expenses_duration', 0)}
                      >
                        ∞
                      </button>
                      <button
                        type="button"
                        className={`px-3 py-1 rounded-r cursor-pointer ${ensureNumber(choice.expenses_duration) > 0 ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 border border-gray-300'}`}
                        onClick={() => handleChoiceChange(index, 'expenses_duration', ensureNumber(choice.expenses_duration) > 0 ? ensureNumber(choice.expenses_duration) : 1)}
                      >
                        months
                      </button>
                      {ensureNumber(choice.expenses_duration) > 0 && (
                      <input
                        type="number"
                          value={ensureNumber(choice.expenses_duration)}
                          min={1}
                          onChange={e => handleChoiceChange(index, 'expenses_duration', Math.max(Number(e.target.value.replace(/[^\d]/g, '')), 1))}
                          className="ml-2 w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-700 text-center"
                        />
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Enter the min/max monthly expenses effect. Use + or - buttons to make values positive or negative. Use $ for flat or % for percentage of current expenses. Set duration to ∞ for permanent effect.
                </p>
      </div>
      
              {/* Customer Rating Effect */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <h5 className="font-semibold text-gray-700 mb-3">Customer Rating Effect</h5>
                <label className="block text-xs text-gray-500 mb-1">Change</label>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center">
                    <span className="mr-2 text-sm font-medium text-gray-700">Min:</span>
                    <div className="flex">
        <button
          type="button"
                        className={`px-3 py-1 rounded-l cursor-pointer ${ensureNumber(choice.customer_rating_min) < 0 ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        onClick={() => {
                          handleChoiceChange(index, 'customer_rating_min', Math.abs(ensureNumber(choice.customer_rating_min)) * -1);
                        }}
                      >
                        -
        </button>
        <button
                        type="button" 
                        className={`px-3 py-1 rounded-r cursor-pointer ${ensureNumber(choice.customer_rating_min) >= 0 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        onClick={() => {
                          handleChoiceChange(index, 'customer_rating_min', Math.abs(ensureNumber(choice.customer_rating_min)));
                        }}
                      >
                        +
                      </button>
                    </div>
                      <input
                        type="number"
                      value={Math.abs(ensureNumber(choice.customer_rating_min))}
                      min={0}
                      max={5}
                        onChange={e => {
                        const value = Math.min(Math.max(Number(e.target.value.replace(/[^\d]/g, '')), 0), 5);
                        const sign = ensureNumber(choice.customer_rating_min) < 0 ? -1 : 1;
                        handleChoiceChange(index, 'customer_rating_min', value * sign);
                      }}
                      className="ml-2 w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-700 text-center"
                    />
                  </div>
                  <span className="mx-2 text-gray-400">to</span>
                  <div className="flex items-center">
                    <span className="mr-2 text-sm font-medium text-gray-700">Max:</span>
                    <div className="flex">
                      <button 
                        type="button" 
                        className={`px-3 py-1 rounded-l cursor-pointer ${ensureNumber(choice.customer_rating_max) < 0 ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        onClick={() => {
                          handleChoiceChange(index, 'customer_rating_max', Math.abs(ensureNumber(choice.customer_rating_max)) * -1);
                        }}
                      >
                        -
                      </button>
                      <button 
                        type="button" 
                        className={`px-3 py-1 rounded-r cursor-pointer ${ensureNumber(choice.customer_rating_max) >= 0 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        onClick={() => {
                          handleChoiceChange(index, 'customer_rating_max', Math.abs(ensureNumber(choice.customer_rating_max)));
                        }}
                      >
                        +
                      </button>
                    </div>
                    <input
                      type="number"
                      value={Math.abs(ensureNumber(choice.customer_rating_max))}
                        min={0}
                        max={5}
                      onChange={e => {
                        const value = Math.min(Math.max(Number(e.target.value.replace(/[^\d]/g, '')), 0), 5);
                        const sign = ensureNumber(choice.customer_rating_max) < 0 ? -1 : 1;
                        handleChoiceChange(index, 'customer_rating_max', value * sign);
                      }}
                      className="ml-2 w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-700 text-center"
                    />
                    </div>
                  <div className="ml-4">
                    <span className="text-xs text-gray-500">Stars (0-5)</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Customer rating change (use + or - buttons to set direction, max 5 stars)</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => router.push('/admin/cards')}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 bg-white"
        >
          Cancel
        </button>
        
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
        >
          {loading ? 'Saving...' : 'Save Card'}
        </button>
      </div>
    </form>
  );
}