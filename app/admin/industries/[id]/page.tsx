import { notFound } from 'next/navigation';
import { getIndustry } from '@/lib/game-data/data-service';
import IndustryForm from '@/components/admin/IndustryForm';

export default async function EditIndustryPage({ params }: { params: { id: string } }) {
  const { id } = params;
  
  // For new industries
  if (id === 'new') {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Create New Industry</h1>
        <IndustryForm />
      </div>
    );
  }
  
  // For existing industries
  const industry = await getIndustry(id);
  
  if (!industry) {
    return notFound();
  }
  
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Edit Industry</h1>
      <IndustryForm industry={industry} />
    </div>
  );
}