// components/game/Dashboard.jsx
export default function Dashboard({ gameState }) {
    if (!gameState) return null;
    
    const profit = gameState.revenue - gameState.expenses;
    const isProfit = profit >= 0;
    
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-500">Day</div>
            <div className="text-xl font-semibold">{gameState.day}/30</div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-500">Month</div>
            <div className="text-xl font-semibold">{gameState.month}</div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-500">Cash</div>
            <div className="text-xl font-semibold">${gameState.cash.toLocaleString()}</div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-500">Monthly Revenue</div>
            <div className="text-xl font-semibold text-green-600">
              ${gameState.revenue.toLocaleString()}
            </div>
          </div>
          
          
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-500">Monthly Expenses</div>
            <div className="text-xl font-semibold text-red-600">
              ${gameState.expenses.toLocaleString()}
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-3 rounded bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">Monthly Profit</div>
            <div className={`text-xl font-semibold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
              {isProfit ? '+' : '-'}${Math.abs(profit).toLocaleString()}
            </div>
          </div>
        </div>
        
        {gameState.temporaryEffects && gameState.temporaryEffects.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold mb-2">Active Effects</h3>
            <div className="space-y-2">
              {gameState.temporaryEffects.map((effect, index) => (
                <div key={index} className="bg-blue-50 p-2 rounded text-sm flex justify-between">
                  <span>{effect.name || 'Business Effect'}</span>
                  <div>
                    {effect.revenue > 0 && <span className="text-green-600 mr-2">+${effect.revenue}</span>}
                    {effect.revenue < 0 && <span className="text-red-600 mr-2">-${Math.abs(effect.revenue)}</span>}
                    {effect.expenses > 0 && <span className="text-red-600">+${effect.expenses}</span>}
                    {effect.expenses < 0 && <span className="text-green-600">-${Math.abs(effect.expenses)}</span>}
                    <span className="ml-2 text-gray-500">{effect.monthsRemaining} month{effect.monthsRemaining !== 1 ? 's' : ''} left</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }