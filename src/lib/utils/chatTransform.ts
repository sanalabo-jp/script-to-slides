import type { ChatMessage, SpeakerProfile } from '$lib/types';
import type { ParseResult, ScriptFrontMatter, SlideData, Speaker } from '$lib/types';

/**
 * Converts chat messages + front matter into a ParseResult
 * compatible with the existing preview/generation pipeline.
 */
export function buildParseResult(
  frontMatter: ScriptFrontMatter,
  messages: ChatMessage[],
  speakers: SpeakerProfile[]
): ParseResult {
  const speakerMap = new Map<string, Speaker>();

  const slides: SlideData[] = messages.map((msg, idx) => {
    const profile = speakers.find((s) => s.id === msg.speakerId);
    const speaker: Speaker = profile
      ? { name: profile.name, role: profile.role }
      : { name: 'Unknown', role: 'Unknown' };

    const key = `${speaker.name}[${speaker.role}]`;
    if (!speakerMap.has(key)) {
      speakerMap.set(key, speaker);
    }

    return {
      speaker,
      context: msg.dialogue,
      metadata: { ...msg.metadata },
      visualHint: msg.visualHint || null,
      summary: null,
      image: null,
      detail: null,
      lineNumber: idx + 1,
    };
  });

  return {
    frontMatter,
    slides,
    isValid: slides.length > 0,
    errors: [],
    metadata: {
      speakers: [...speakerMap.values()],
      totalLines: messages.length,
      validLines: messages.length,
    },
  };
}
