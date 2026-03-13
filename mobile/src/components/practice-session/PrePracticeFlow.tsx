import { View, Text, ScrollView } from 'react-native';
import { Button } from '@/components/ui';
import { ConfidenceSlider } from './ConfidenceSlider';
import { MicroWinBanner } from './MicroWinBanner';
import { MomentumFrame } from './MomentumFrame';
import { StillTrueCard } from './StillTrueCard';
import type { StillTrueResponseValue } from '@willdo/shared';

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

interface ReflectionPrompt {
  key: string;
  text: string;
  category: string;
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
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 20 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Micro-win or first-session encouragement */}
      {microWin ? (
        <MicroWinBanner text={microWin} />
      ) : (
        <MomentumFrame text={momentumText} />
      )}

      {/* Both when micro-win exists */}
      {microWin ? <MomentumFrame text={momentumText} /> : null}

      {/* Still True? cards */}
      {unansweredCards.length > 0 && (
        <View className="gap-3">
          <Text className="text-sm font-medium text-gray-900 dark:text-white">
            From your past sessions:
          </Text>
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
        </View>
      )}

      {/* Confidence slider */}
      <ConfidenceSlider
        value={preConfidence}
        onChange={onConfidenceChange}
        label="How confident are you feeling?"
      />

      {/* Begin practice button */}
      <Button title="Go practice!" onPress={onBeginPractice} size="lg" />
    </ScrollView>
  );
}
