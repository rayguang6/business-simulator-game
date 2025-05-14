// app/[industry]/page.js
import { getCardsByIndustry, getIndustries } from '@/lib/game-data/data-service';
import IndustryGame from '@/components/game/IndustryGame';
import { redirect } from 'next/navigation';

export default async function IndustryPage({ params }) {
  const { industry } = params;
  const industries = await getIndustries();
  const industryData = industries.find(ind => ind.id === industry);
  
  if (!industryData) {
    return redirect('/');
  }
  
  const cards = await getCardsByIndustry(industry);
  
  return <IndustryGame industryData={industryData} initialCards={cards} />;
}