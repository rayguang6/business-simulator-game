import GameRunnerScene from './GameRunnerScene';

interface GameScreenProps {
  industry: Industry; 
  cards: Card[]; 
}

const GameScreen: React.FC<GameScreenProps> = ({ industry, cards }) => {

  return (
    <div>
      <GameRunnerScene isPaused={false} />
    </div>
  );
};

export default GameScreen; 