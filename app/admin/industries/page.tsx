import Link from 'next/link';
import { getIndustries } from '@/lib/game-data/data-service';
import IndustryList from '@/components/admin/IndustryList';

export default async function IndustriesPage() {
  const industries = await getIndustries();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Industries</h1>
        <Link
          href="/admin/industries/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Add Industry
        </Link>
      </div>
      
      <IndustryList initialIndustries={industries} />
    </div>
  );
}