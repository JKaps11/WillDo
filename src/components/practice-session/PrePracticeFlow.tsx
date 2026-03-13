import { ConfidenceSlider } from './ConfidenceSlider';
import { MicroWinBanner } from './MicroWinBanner';
import { MomentumFrame } from './MomentumFrame';
import { StillTrueCard } from './StillTrueCard';
import type { ReflectionPrompt } from '@/lib/constants/reflection-prompts';
import type { StillTrueResponseValue } from '@willdo/shared';
import { Button } from '@/components/ui/button';

interface StillTrueCardData {
  sessionId: string;
  responseId: string | null;
  text: string;
}

interface StillTrueAnswer {
  sourceSessionId: string;
  sourceResponseId: string | null;
  sourceText: string;
  response: StillTrueResponseValue;
}

interface PrePracticeFlowProps {
  microWin: string | null;
  momentumText: string;
  stillTrueCards: Array<StillTrueCardData>;
  selectedPrompts: Array<ReflectionPrompt>;
  preConfidence: number;
  onConfidenceChange: (value: number) => void;
  onStillTrueRespond: (answer: StillTrueAnswer) => void;
  answeredStillTrue: Set<string>;
  onBeginPractice: () => void;
}

export function PrePracticeFlow({
  microWin,
  momentumText,
  stillTrueCards,
  preConfidence,
  onConfidenceChange,
  onStillTrueRespond,
  answeredStillTrue,
  onBeginPractice,
}: PrePracticeFlowProps): React.ReactElement {
  const unansweredCards = stillTrueCards.filter(
    (card) => !answeredStillTrue.has(card.sessionId + (card.responseId ?? '')),
  );

  return (
    <div className="space-y-5">
      {/* Micro-win or first-session encouragement */}
      {microWin ? (
        <MicroWinBanner text={microWin} />
      ) : (
        <MomentumFrame text={momentumText} />
      )}

      {/* Momentum frame (when micro-win also present) */}
      {microWin && <MomentumFrame text={momentumText} />}

      {/* Still True? cards */}
      {unansweredCards.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">From your past sessions:</h3>
          {unansweredCards.map((card) => (
            <StillTrueCard
              key={card.sessionId + (card.responseId ?? '')}
              text={card.text}
              onRespond={(response) =>
                onStillTrueRespond({
                  sourceSessionId: card.sessionId,
                  sourceResponseId: card.responseId,
                  sourceText: card.text,
                  response,
                })
              }
            />
          ))}
        </div>
      )}

      {/* Confidence slider */}
      <ConfidenceSlider
        value={preConfidence}
        onChange={onConfidenceChange}
        label="How confident are you feeling?"
      />

      {/* Begin practice button */}
      <Button onClick={onBeginPractice} className="w-full" size="lg">
        Go practice!
      </Button>
    </div>
  );
}
