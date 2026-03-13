import { createContext, useContext, useState, useCallback } from 'react';
import { PracticeSessionSheet } from './PracticeSessionSheet';

interface TaskForSession {
  id: string;
  name: string;
  subSkillId: string;
}

interface PracticeSessionContextValue {
  openSession: (task: TaskForSession, occurrenceDate: Date) => void;
  closeSession: () => void;
}

const PracticeSessionContext = createContext<PracticeSessionContextValue | null>(null);

interface PracticeSessionProviderProps {
  children: React.ReactNode;
}

export function PracticeSessionProvider({
  children,
}: PracticeSessionProviderProps): React.ReactElement {
  const [sessionState, setSessionState] = useState<{
    task: TaskForSession | null;
    occurrenceDate: Date | null;
  }>({ task: null, occurrenceDate: null });

  const openSession = useCallback(
    (task: TaskForSession, occurrenceDate: Date): void => {
      setSessionState({ task, occurrenceDate });
    },
    [],
  );

  const closeSession = useCallback((): void => {
    setSessionState({ task: null, occurrenceDate: null });
  }, []);

  return (
    <PracticeSessionContext.Provider value={{ openSession, closeSession }}>
      {children}
      <PracticeSessionSheet
        task={sessionState.task}
        occurrenceDate={sessionState.occurrenceDate}
        onClose={closeSession}
      />
    </PracticeSessionContext.Provider>
  );
}

export function usePracticeSession(): PracticeSessionContextValue {
  const context = useContext(PracticeSessionContext);
  if (!context) {
    throw new Error('usePracticeSession must be used within PracticeSessionProvider');
  }
  return context;
}
