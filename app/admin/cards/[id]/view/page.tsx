import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCardForEditing, getIndustries } from '@/lib/game-data/data-service';
import { Edit } from 'lucide-react';

export default async function ViewCardPage({ params }: { params: { id: string } }) {
  const { id } = params;
  
  // Get card data and industries
  const card = await getCardForEditing(id);
  const industries = await getIndustries();
  
  if (!card) {
    return notFound();
  }
  
  // Find industry name
  const industry = industries.find(i => i.id === card.industry_id);
  
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">View Card</h1>
        <Link
          href={`/admin/cards/${id}`}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Edit size={18} className="mr-2" /> Edit Card
        </Link>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <span className={`px-2 py-1 text-xs rounded-full inline-block mr-2 ${getCardTypeStyle(card.type)}`}>
                {card.type}
              </span>
              <span className="text-gray-500 text-sm">ID: {card.id}</span>
            </div>
            <div className="text-sm text-gray-500">
              Industry: <span className="font-medium">{industry?.name || card.industry_id}</span>
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mt-2">{card.title}</h2>
          <p className="text-gray-600 mt-1">{card.description}</p>
        </div>
        
        <div className="px-6 py-4 bg-gray-50 grid grid-cols-4 gap-4 border-b border-gray-200">
          <div>
            <div className="text-xs text-gray-500">Probability</div>
            <div className="font-medium">{card.probability || 100}%</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Stage Month</div>
            <div className="font-medium">{card.stage_month || 'Random'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Min Cash</div>
            <div className="font-medium">{card.min_cash ? `$${card.min_cash.toLocaleString()}` : 'None'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Max Cash</div>
            <div className="font-medium">{card.max_cash ? `$${card.max_cash.toLocaleString()}` : 'None'}</div>
          </div>
        </div>
        
        <div className="px-6 py-4">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Choices</h3>
          <div className="space-y-4">
            {card.choices.map((choice, index) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h4 className="font-medium text-gray-800">{choice.label}</h4>
                  <p className="text-gray-600 text-sm">{choice.description}</p>
                </div>
                
                <div className="px-4 py-3 grid grid-cols-3 gap-3">
                  <div>
                    <div className="text-xs text-gray-500">Cash Effect</div>
                    <div className="text-sm">${choice.cash_min} to ${choice.cash_max}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Revenue Effect</div>
                    <div className="text-sm">${choice.revenue_min} to ${choice.revenue_max}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Expenses Effect</div>
                    <div className="text-sm">${choice.expenses_min} to ${choice.expenses_max}</div>
                  </div>
                </div>
                
                <div className="px-4 py-3 bg-gray-50 grid grid-cols-2 gap-3 border-t border-gray-200">
                  <div>
                    <div className="text-xs text-gray-500">Customer Rating Effect</div>
                    <div className="text-sm">{choice.customer_rating_min} to {choice.customer_rating_max} stars</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Duration</div>
                    <div className="text-sm">{choice.duration} month{choice.duration !== 1 ? 's' : ''}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex justify-center">
        <Link
          href="/admin/cards"
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 bg-white"
        >
          Back to Cards
        </Link>
      </div>
    </div>
  );
}