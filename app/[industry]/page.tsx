import { getCardsByIndustry, getIndustry } from '@/lib/game-data/data-service';
import { redirect } from 'next/navigation';
import GameScreen from '@/components/game/GameScreen';

export default async function IndustryPage({ params }: { params: { industry: string } }) {
  const industryId = params.industry;

  // Fetch industry and cards in parallel
  const [industryData, cards] = await Promise.all([
    getIndustry(industryId),
    getCardsByIndustry(industryId)
  ]);

  // Redirect if industry is not found or not available
  if (!industryData || !industryData.isAvailable) {
    return redirect('/');
  }

  return (
    <GameScreen
      industry={industryData}
      cards={cards}
    />
  );
}