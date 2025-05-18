// app/page.js
import { getIndustries } from '@/lib/game-data/data-service';
import IndustrySelector from '@/components/home/IndustrySelector';

export default async function HomePage() {
  const industries = await getIndustries();

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <div className="w-full max-w-md mx-auto p-4">
        <div className="bg-slate-800 rounded-xl shadow-xl overflow-hidden border border-slate-700">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-center">
            <h1 className="text-3xl font-bold mb-2">Business Simulator</h1>
            <p className="text-indigo-200">Choose your industry and build your empire</p>
          </div>
          
          <div className="p-6">
            <IndustrySelector industries={industries} />
          </div>
        </div>
      </div>
    </div>
  );
}