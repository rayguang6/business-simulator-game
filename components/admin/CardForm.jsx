// components/admin/CardForm.jsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CardForm({ card, industries }) {
  const router = useRouter();
  const isNewCard = !card;
  
  // Initialize form state
  const [formData, setFormData] = useState({
    id: card?.id || '',
    industry_id: card?.industry_id || industries[0]?.id || '',
    type: card?.type || 'Opportunity',
    question: card?.question || '',
    choice_title: card?.choice_title || '',
    choices: card?.choices?.length ? card.choices : [
      { label: 'Option 1', description: '', cash_effect: 0, revenue_effect: 0, expenses_effect: 0, duration: 1 },
      { label: 'Option 2', description: '', cash_effect: 0, revenue_effect: 0, expenses_effect: 0, duration: 1 }
    ]
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Generate ID based on type
  const generateCardId = (type) => {
    const prefix = type.toLowerCase().substring(0, 4);
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${randomNum}`;
  };
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-generate ID when type changes for new cards
    if (isNewCard && name === 'type') {
      setFormData(prev => ({ ...prev, id: generateCardId(value) }));
    }
  };
  
  // Handle choice field changes
  const handleChoiceChange = (index, field, value) => {
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
      choices: [...prev.choices, { label: `Option ${prev.choices.length + 1}`, description: '', cash_effect: 0, revenue_effect: 0, expenses_effect: 0, duration: 1 }]
    }));
  };
  
  // Remove a choice
  const removeChoice = (index) => {
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
  const saveCard = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Generate a new ID for new cards if not already set
      const dataToSave = { ...formData };
      if (isNewCard && !dataToSave.id) {
        dataToSave.id = generateCardId(dataToSave.type);
      }
      
      // Make API call to save the card
      const response = await fetch('/api/admin/save-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save card');
      }
      
      // Redirect back to admin page on success
      router.push('/admin');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper for effect description
  const getEffectDescription = (value, type) => {
    if (value === 0) return 'No change';
    
    const prefix = value > 0 ? 'Increase' : 'Decrease';
    
    switch (type) {
      case 'cash':
        return `${prefix} cash by $${Math.abs(value).toLocaleString()}`;
      case 'revenue':
        return `${prefix} monthly revenue by $${Math.abs(value).toLocaleString()}`;
      case 'expenses':
        return `${prefix} monthly expenses by $${Math.abs(value).toLocaleString()}`;
      default:
        return `${prefix} by ${Math.abs(value)}`;
    }
  };
  
  return (
    <form onSubmit={saveCard} className="bg-gray-100 p-6 rounded-lg shadow-md border border-gray-300">
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div className="mb-4">
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 text-gray-700"
            placeholder="Example: opp-001, prob-002, etc."
          />
          {isNewCard && (
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, id: generateCardId(prev.type) }))}
              className="ml-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              title="Generate ID based on type"
            >
              Generate
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          ID format should be: type prefix (e.g., opp-, prob-) followed by a number
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Industry
          </label>
          <select
            name="industry_id"
            value={formData.industry_id}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 bg-white"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 bg-white"
          >
            <option value="Opportunity">Opportunity</option>
            <option value="Problem">Problem</option>
            <option value="Market">Market</option>
            <option value="Happy">Happy</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Type affects the card appearance and ID generation
          </p>
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2">
          Question/Scenario
        </label>
        <input
          type="text"
          name="question"
          value={formData.question}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 bg-white"
          placeholder="Example: A popular social media influencer has offered to promote your coffee shop"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          The main scenario or situation presented to the player
        </p>
      </div>
      
      <div className="mb-6">
        <label className="block text-gray-700 font-medium mb-2">
          Choice Title
        </label>
        <input
          type="text"
          name="choice_title"
          value={formData.choice_title}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 bg-white"
          placeholder="Example: Hire the influencer? / What will you do?"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          The question that prompts the player to make a choice
        </p>
      </div>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-800">Choices</h3>
          <button
            type="button"
            onClick={addChoice}
            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <span className="mr-1">+</span> Add Choice
          </button>
        </div>
        
        <div className="space-y-6">
          {formData.choices.map((choice, index) => (
            <div key={index} className="p-4 border border-gray-300 rounded-md bg-white shadow-sm">
              <div className="flex justify-between mb-3">
                <h4 className="font-medium text-gray-800">Choice {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => removeChoice(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 bg-white"
                    placeholder="Example: Yes, No, Buy New, etc."
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Short text for the choice button
                  </p>
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm mb-1">
                    Duration (Months)
                  </label>
                  <input
                    type="number"
                    value={choice.duration}
                    onChange={(e) => handleChoiceChange(index, 'duration', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 bg-white"
                    min="1"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    How many months the effects last (1 = one-time)
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 bg-white"
                  rows="2"
                  placeholder="Example: Pay $3,000 for a promotional campaign"
                  required
                ></textarea>
                <p className="text-xs text-gray-500 mt-1">
                  Detailed explanation of what this choice entails
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-3">
                <h5 className="font-medium text-gray-700 mb-3">Effects</h5>
                
                {/* Cash Effect with better UX */}
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm mb-1">
                    Cash Effect
                  </label>
                  <div className="flex items-center">
                    <select
                      value={choice.cash_effect < 0 ? 'decrease' : choice.cash_effect > 0 ? 'increase' : 'none'}
                      onChange={(e) => {
                        const action = e.target.value;
                        const currentValue = Math.abs(choice.cash_effect) || 0;
                        let newValue = 0;
                        
                        if (action === 'increase') newValue = currentValue || 1000;
                        else if (action === 'decrease') newValue = -(currentValue || 1000);
                        
                        handleChoiceChange(index, 'cash_effect', newValue);
                      }}
                      className="py-2 px-3 border border-gray-300 rounded-l-md text-sm text-gray-700 bg-white"
                    >
                      <option value="none">No Change</option>
                      <option value="increase">Increase Cash</option>
                      <option value="decrease">Decrease Cash</option>
                    </select>
                    
                    <span className="bg-gray-200 px-3 py-2 text-gray-700">$</span>
                    
                    <input
                      type="number"
                      value={Math.abs(choice.cash_effect) || ''}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        const isNegative = choice.cash_effect < 0;
                        handleChoiceChange(index, 'cash_effect', isNegative ? -value : value);
                      }}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-r-md text-sm focus:outline-none focus:ring-2 text-gray-700 bg-white ${
                        choice.cash_effect < 0 
                          ? 'focus:ring-red-500 border-r-red-300' 
                          : choice.cash_effect > 0 
                            ? 'focus:ring-green-500 border-r-green-300' 
                            : 'focus:ring-blue-500'
                      }`}
                      placeholder="Amount"
                      disabled={choice.cash_effect === 0}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {getEffectDescription(choice.cash_effect, 'cash')}
                  </p>
                </div>
                
                {/* Revenue Effect with better UX */}
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm mb-1">
                    Monthly Revenue Effect
                  </label>
                  <div className="flex items-center">
                    <select
                      value={choice.revenue_effect < 0 ? 'decrease' : choice.revenue_effect > 0 ? 'increase' : 'none'}
                      onChange={(e) => {
                        const action = e.target.value;
                        const currentValue = Math.abs(choice.revenue_effect) || 0;
                        let newValue = 0;
                        
                        if (action === 'increase') newValue = currentValue || 500;
                        else if (action === 'decrease') newValue = -(currentValue || 500);
                        
                        handleChoiceChange(index, 'revenue_effect', newValue);
                      }}
                      className="py-2 px-3 border border-gray-300 rounded-l-md text-sm text-gray-700 bg-white"
                    >
                      <option value="none">No Change</option>
                      <option value="increase">Increase Revenue</option>
                      <option value="decrease">Decrease Revenue</option>
                    </select>
                    
                    <span className="bg-gray-200 px-3 py-2 text-gray-700">$</span>
                    
                    <input
                      type="number"
                      value={Math.abs(choice.revenue_effect) || ''}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        const isNegative = choice.revenue_effect < 0;
                        handleChoiceChange(index, 'revenue_effect', isNegative ? -value : value);
                      }}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-r-md text-sm focus:outline-none focus:ring-2 text-gray-700 bg-white ${
                        choice.revenue_effect < 0 
                          ? 'focus:ring-red-500 border-r-red-300' 
                          : choice.revenue_effect > 0 
                            ? 'focus:ring-green-500 border-r-green-300' 
                            : 'focus:ring-blue-500'
                      }`}
                      placeholder="Amount"
                      disabled={choice.revenue_effect === 0}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {getEffectDescription(choice.revenue_effect, 'revenue')}
                    {choice.revenue_effect !== 0 && choice.duration > 1 ? ` for ${choice.duration} months` : ''}
                  </p>
                </div>
                
                {/* Expenses Effect with better UX */}
                <div className="mb-2">
                  <label className="block text-gray-700 text-sm mb-1">
                    Monthly Expenses Effect
                  </label>
                  <div className="flex items-center">
                    <select
                      value={choice.expenses_effect < 0 ? 'decrease' : choice.expenses_effect > 0 ? 'increase' : 'none'}
                      onChange={(e) => {
                        const action = e.target.value;
                        const currentValue = Math.abs(choice.expenses_effect) || 0;
                        let newValue = 0;
                        
                        if (action === 'increase') newValue = currentValue || 500;
                        else if (action === 'decrease') newValue = -(currentValue || 500);
                        
                        handleChoiceChange(index, 'expenses_effect', newValue);
                      }}
                      className="py-2 px-3 border border-gray-300 rounded-l-md text-sm text-gray-700 bg-white"
                    >
                      <option value="none">No Change</option>
                      <option value="increase">Increase Expenses</option>
                      <option value="decrease">Decrease Expenses</option>
                    </select>
                    
                    <span className="bg-gray-200 px-3 py-2 text-gray-700">$</span>
                    
                    <input
                      type="number"
                      value={Math.abs(choice.expenses_effect) || ''}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        const isNegative = choice.expenses_effect < 0;
                        handleChoiceChange(index, 'expenses_effect', isNegative ? -value : value);
                      }}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-r-md text-sm focus:outline-none focus:ring-2 text-gray-700 bg-white ${
                        choice.expenses_effect < 0 
                          ? 'focus:ring-green-500 border-r-green-300' // Note: Decreased expenses is positive
                          : choice.expenses_effect > 0 
                            ? 'focus:ring-red-500 border-r-red-300' // Increased expenses is negative
                            : 'focus:ring-blue-500'
                      }`}
                      placeholder="Amount"
                      disabled={choice.expenses_effect === 0}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {getEffectDescription(choice.expenses_effect, 'expenses')}
                    {choice.expenses_effect !== 0 && choice.duration > 1 ? ` for ${choice.duration} months` : ''}
                  </p>
                </div>
                
                <p className="text-xs bg-blue-50 p-2 rounded text-blue-700 mt-3">
                  <strong>Note:</strong> The duration applies to revenue and expenses effects. 
                  A duration of 1 means the effect only happens once, while 2+ means it continues for multiple months.
                </p>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                <div className="flex items-center mb-2">
                  <h5 className="text-sm font-medium text-gray-700">Delayed Cash Payment</h5>
                  <span className="ml-2 text-xs bg-yellow-200 px-2 py-0.5 rounded-full text-yellow-800">Optional</span>
                </div>
                
                <p className="text-xs text-yellow-800 mb-3">
                  Use this for effects like B2B payments that come in after a delay.
                  Currently only supports delayed cash payments.
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-700 text-sm mb-1">
                      Payment Amount
                    </label>
                    <div className="flex">
                      <span className="bg-gray-200 px-3 py-2 text-gray-700 rounded-l-md">$</span>
                      <input
                        type="number"
                        value={choice.delayed_cash_value || ''}
                        onChange={(e) => handleChoiceChange(
                          index, 
                          'delayed_cash_value', 
                          e.target.value ? parseInt(e.target.value) : null
                        )}
                        className="w-full px-3 py-2 border border-gray-300 rounded-r-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 bg-white"
                        placeholder="Amount (e.g. 12000)"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm mb-1">
                      Months Until Payment
                    </label>
                    <input
                      type="number"
                      value={choice.delayed_cash_months || ''}
                      onChange={(e) => handleChoiceChange(
                        index, 
                        'delayed_cash_months', 
                        e.target.value ? parseInt(e.target.value) : null
                      )}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 bg-white"
                      min="1"
                      placeholder="Months (e.g. 3)"
                    />
                  </div>
                </div>
                
                {choice.delayed_cash_value && choice.delayed_cash_months && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ Will receive ${choice.delayed_cash_value.toLocaleString()} after {choice.delayed_cash_months} month{choice.delayed_cash_months !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => router.push('/admin')}
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