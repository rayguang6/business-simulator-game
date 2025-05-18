// app/[industry]/page.js
import { getCardsByIndustry, getIndustry } from '@/lib/game-data/data-service';
import IndustryGame from '@/components/game/IndustryGame';
import { redirect } from 'next/navigation';

export default async function IndustryPage({ params }: { params: { industry: string } }) {
  const { industry } = await params;
  
  // Fetch cards and industry in parallel
  const [cards, industryData] = await Promise.all([
    getCardsByIndustry(industry),
    getIndustry(industry)
  ]);
  
  if (!industryData || !industryData.isAvailable) {
    return redirect('/');
  }
  
  return (
    <IndustryGame 
      industryData={industryData} 
      initialCards={cards} 
      industryId={industry}
    />
  );
}