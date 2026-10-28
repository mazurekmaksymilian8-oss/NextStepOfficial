import type { Answer, AnswerStep, QuickActionId } from '@/types';

/**
 * Mock AI provider.
 *
 * This is a clearly-labelled simulation — it does NOT call any real model.
 * The shapes returned here match what a future local Ollama integration
 * would emit, so the UI layer can be wired to a real provider with minimal
 * changes. See `RealAiProvider` notes below.
 */

const MOCK_DELAY = 1400;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const loremSteps: AnswerStep[] = [
  {
    title: 'Open Settings',
    explanation:
      'Press Win + I, or click the gear icon in the Start menu to open the relevant settings panel.',
  },
  {
    title: 'Find the problem',
    explanation:
      'Navigate to the section shown in your screenshot and locate the option flagged with a warning.',
  },
  {
    title: 'Apply the fix',
    explanation: 'Toggle the recommended option on, then save your changes.',
    code: {
      language: 'powershell',
      snippet: '# Verify the new setting took effect\nGet-ItemProperty -Path "HKCU:\\Software\\NextStep" | Select-Object Enabled',
    },
  },
  {
    title: 'Verify',
    explanation:
      'Restart the affected app and confirm the issue no longer appears.',
  },
];

const errorSteps: AnswerStep[] = [
  {
    title: 'Read the error carefully',
    explanation:
      'The message usually points at the exact file or module that failed. Note the highlighted path.',
  },
  {
    title: 'Check the logs',
    explanation:
      'Open the developer console or the log file referenced in the error for the full stack trace.',
    code: {
      language: 'bash',
      snippet: 'tail -n 50 ~/.nextstep/logs/app.log',
    },
  },
  {
    title: 'Reproduce in isolation',
    explanation:
      'Run the failing command on its own to confirm it is not caused by surrounding code.',
  },
  {
    title: 'Apply the fix',
    explanation:
      'Correct the referenced line, then re-run to confirm the error is gone.',
  },
];

const unstuckSteps: AnswerStep[] = [
  {
    title: 'Describe the goal',
    explanation:
      'In one sentence, write what a successful result looks like. This re-centres the problem.',
  },
  {
    title: 'Find the smallest next move',
    explanation:
      'Identify the single smallest action that makes progress — not the full solution.',
  },
  {
    title: 'Try it, then inspect',
    explanation:
      'Run that one action and look at the result before deciding the next step.',
  },
  {
    title: 'Loop or escalate',
    explanation:
      'If it worked, repeat. If not, share what you saw and I will help you adjust course.',
  },
];

const actionMap: Record<QuickActionId, { intro: string; steps: AnswerStep[] }> = {
  understand: {
    intro: "Here's what I see on your screen.",
    steps: loremSteps,
  },
  error: {
    intro: "Here's how to fix that error.",
    steps: errorSteps,
  },
  unstuck: {
    intro: "Let's get you moving again.",
    steps: unstuckSteps,
  },
};

function guessFromText(text: string): { intro: string; steps: AnswerStep[] } {
  const lower = text.toLowerCase();
  if (lower.includes('error') || lower.includes('fail') || lower.includes('bug')) {
    return actionMap.error;
  }
  if (lower.includes('stuck') || lower.includes('how do i') || lower.includes('help')) {
    return actionMap.unstuck;
  }
  return actionMap.understand;
}

export interface AskParams {
  prompt: string;
  hasAttachment: boolean;
  quickAction?: QuickActionId;
}

export async function mockAsk(params: AskParams): Promise<Answer> {
  await delay(MOCK_DELAY);

  const base =
    params.quickAction != null
      ? actionMap[params.quickAction]
      : guessFromText(params.prompt);

  return {
    id: crypto.randomUUID(),
    prompt: params.prompt.trim(),
    intro: base.intro,
    steps: base.steps,
    hasAttachment: params.hasAttachment,
    createdAt: Date.now(),
    feedback: null,
  };
}

/**
 * Future local Ollama integration sketch (NOT implemented — no network calls):
 *
 *   const res = await fetch(`${OLLAMA_URL}/api/chat`, {
 *     method: 'POST',
 *     body: JSON.stringify({ model, messages, stream: false }),
 *   });
 *   const data = await res.json();
 *   return parseAnswer(data.message.content);
 *
 * The URL and model would be read from app preferences and never hardcoded.
 */
