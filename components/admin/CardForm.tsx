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
    probability: card?.probability || 100, // Default to 100% probability
    choices: card?.choices?.length ? card.choices : [
      { 
        label: 'Yes', 
        description: '',
        cash_min: 0,
        cash_max: 0,
        revenue_min: 0,
        revenue_max: 0,
        expenses_min: 0,
        expenses_max: 0,
        customer_rating_min: 0,
        customer_rating_max: 0,
        duration: 1
      },
      { 
        label: 'No', 
        description: '',
        cash_min: 0,
        cash_max: 0,
        revenue_min: 0,
        revenue_max: 0,
        expenses_min: 0,
        expenses_max: 0,
        customer_rating_min: 0,
        customer_rating_max: 0,
        duration: 1
      }
    ]
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Generate ID based on type
  const generateCardId = () => {
    const prefix = formData.type.toLowerCase().substring(0, 4);
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${randomNum}`;
  };
  
  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle number inputs
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? null : Number(value)
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Auto-generate ID when type changes for new cards
    if (isNewCard && name === 'type') {
      setFormData(prev => ({ ...prev, id: generateCardId() }));
    }
  };
  
  // Handle choice field changes
  const handleChoiceChange = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newChoices = [...prev.choices];
      newChoices[index] = { ...newChoices[index], [field]: value };
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
        revenue_min: 0,
        revenue_max: 0,
        expenses_min: 0,
        expenses_max: 0,
        customer_rating_min: 0,
        customer_rating_max: 0,
        duration: 1
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
      choices: prev.choices.filter((_, i) => i !== index)
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
      if (isNewCard && !dataToSave.id) {
        dataToSave.id = generateCardId();
      }
      
      // Make API call to save the card
      const response = await fetch('/api/admin/cards', {
        method: isNewCard ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save card');
      }
      
      // Redirect back to cards page
      router.push('/admin/cards');
      router.refresh();
    } catch (err) {
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
            Card ID
          </label>
          <div className="flex">
            <input
              type="text"
              name="id"
              value={formData.id}
              onChange={handleChange}
              disabled={!isNewCard}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-gray-700"
              placeholder="opp-001"
            />
            {isNewCard && (
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, id: generateCardId() }))}
                className="ml-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                title="Generate ID based on type"
              >
                Generate
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Unique identifier for the card
          </p>
        </div>
        
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
            <option value="Opportunity">Opportunity</option>
            <option value="Problem">Problem</option>
            <option value="Market">Market</option>
            <option value="Happy">Happy</option>
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
        <label className="block text-gray-700 font-medium mb-2">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
          placeholder="Additional details about the card scenario"
        />
      </div>
      
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Stage Month (Optional)
          </label>
          <input
            type="number"
            name="stage_month"
            value={formData.stage_month === null ? '' : formData.stage_month}
            onChange={handleChange}
            min={1}
            // components/admin/CardForm.tsx (continued)
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
            placeholder="e.g., 3"
          />
          <p className="text-xs text-gray-500 mt-1">
            Month when this card should appear (leave empty for random)
          </p>
        </div>
        
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Min Cash Requirement
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
            <input
              type="number"
              name="min_cash"
              value={formData.min_cash === null ? '' : formData.min_cash}
              onChange={handleChange}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
              placeholder="Minimum cash needed"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Minimum cash required for this card to appear
          </p>
        </div>
        
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Max Cash Limit
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
            <input
              type="number"
              name="max_cash"
              value={formData.max_cash === null ? '' : formData.max_cash}
              onChange={handleChange}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
              placeholder="Maximum cash limit"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Maximum cash limit for this card to appear
          </p>
        </div>
      </div>
      
      <div className="mb-6">
        <label className="block text-gray-700 font-medium mb-2">
          Probability (%)
        </label>
        <div className="flex items-center">
          <input
            type="range"
            name="probability"
            value={formData.probability}
            onChange={handleChange}
            min={1}
            max={100}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="ml-3 w-12 text-center text-gray-700 font-medium">
            {formData.probability}%
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Likelihood of this card appearing in the game (100% = Always included in deck)
        </p>
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
          {formData.choices.map((choice, index) => (
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
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-gray-700 text-sm mb-1">
                    Label
                  </label>
                  <input
                    type="text"
                    value={choice.label}
                    onChange={(e) => handleChoiceChange(index, 'label', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                    placeholder="e.g., Yes, No, Buy New, etc."
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm mb-1">
                    Duration (Months)
                  </label>
                  <input
                    type="number"
                    value={choice.duration}
                    onChange={(e) => handleChoiceChange(index, 'duration', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                    min={1}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    How many months effects last
                  </p>
                </div>
              </div>
              
              <div className="mb-3">
                <label className="block text-gray-700 text-sm mb-1">
                  Description
                </label>
                <textarea
                  value={choice.description}
                  onChange={(e) => handleChoiceChange(index, 'description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                  rows={2}
                  placeholder="e.g., Pay $3,000 for a promotional campaign"
                  required
                ></textarea>
              </div>
              
              {/* Cash Effect */}
              <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
                <h5 className="font-medium text-gray-700 mb-2 text-sm">Cash Effect</h5>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-700 text-xs mb-1">
                      Minimum Value
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                      <input
                        type="number"
                        value={choice.cash_min}
                        onChange={(e) => handleChoiceChange(index, 'cash_min', parseInt(e.target.value))}
                        className="w-full pl-8 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 text-xs mb-1">
                      Maximum Value
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                      <input
                        type="number"
                        value={choice.cash_max}
                        onChange={(e) => handleChoiceChange(index, 'cash_max', parseInt(e.target.value))}
                        className="w-full pl-8 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                      />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Immediate cash effect (negative = cost, positive = gain)
                </p>
              </div>
              
              {/* Revenue Effect */}
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <h5 className="font-medium text-gray-700 mb-2 text-sm">Revenue Effect (per month)</h5>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-700 text-xs mb-1">
                      Minimum Value
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                      <input
                        type="number"
                        value={choice.revenue_min}
                        onChange={(e) => handleChoiceChange(index, 'revenue_min', parseInt(e.target.value))}
                        className="w-full pl-8 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 text-xs mb-1">
                      Maximum Value
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                      <input
                        type="number"
                        value={choice.revenue_max}
                        onChange={(e) => handleChoiceChange(index, 'revenue_max', parseInt(e.target.value))}
                        className="w-full pl-8 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700"
                      />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Monthly revenue change (negative = decrease, positive = increase)
                </p>
              </div>
              
              {/* Expenses Effect */}
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <h5 className="font-medium text-gray-700 mb-2 text-sm">Expenses Effect (per month)</h5>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-700 text-xs mb-1">
                      Minimum Value
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                      <input
                        type="number"
                        value={choice.expenses_min}
                        onChange={(e) => handleChoiceChange(index, 'expenses_min', parseInt(e.target.value))}
                        className="w-full pl-8 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-700"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 text-xs mb-1">
                      Maximum Value
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                      <input
                        type="number"
                        value={choice.expenses_max}
                        onChange={(e) => handleChoiceChange(index, 'expenses_max', parseInt(e.target.value))}
                        className="w-full pl-8 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-700"
                      />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Monthly expenses change (negative = decrease, positive = increase)
                </p>
              </div>
              
              {/* Customer Rating Effect */}
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <h5 className="font-medium text-gray-700 mb-2 text-sm">Customer Rating Effect</h5>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-700 text-xs mb-1">
                      Minimum Rating Change
                    </label>
                    <input
                      type="number"
                      value={choice.customer_rating_min}
                      onChange={(e) => handleChoiceChange(index, 'customer_rating_min', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-700"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-xs mb-1">
                      Maximum Rating Change
                    </label>
                    <input
                      type="number"
                      value={choice.customer_rating_max}
                      onChange={(e) => handleChoiceChange(index, 'customer_rating_max', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-700"
                      step="0.1"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Customer rating change (-5 to +5 stars)
                </p>
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