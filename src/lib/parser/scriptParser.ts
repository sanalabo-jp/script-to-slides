import type { ScriptLine, ParseError, ParseResult } from '$lib/types';

/**
 * Script format regex:
 * name[role]: (description) dialogue
 *
 * Examples:
 *   jane[teacher]: (놀란 목소리로) 존 거기서 뭐하니!
 *   john[student]: 안녕하세요 선생님
 *   anchor[news]: (심각한 표정으로) 오늘의 뉴스를 전해드리겠습니다
 */
const SCRIPT_LINE_REGEX = /^(\S+)\[([^\]]+)\]:\s*(?:\(([^)]*)\)\s*)?(.+)$/;

const SUPPORTED_EXTENSIONS = ['.txt', '.md', '.text', '.script'];

const VALIDATION_THRESHOLD = 0.6; // 60% of lines must match format

export function isSuportedExtension(filename: string): boolean {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return SUPPORTED_EXTENSIONS.includes(ext);
}

export function parseLine(raw: string, lineNumber: number): ScriptLine | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;

  const match = trimmed.match(SCRIPT_LINE_REGEX);
  if (!match) return null;

  const [, speaker, role, description, dialogue] = match;

  return {
    speaker: speaker.trim(),
    role: role.trim(),
    description: description?.trim() || undefined,
    dialogue: dialogue.trim(),
    lineNumber,
  };
}

export function parseScript(content: string): ParseResult {
  const rawLines = content.split('\n');
  const lines: ScriptLine[] = [];
  const errors: ParseError[] = [];
  let nonEmptyCount = 0;

  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i].trim();

    // Skip empty lines and comments
    if (!raw || raw.startsWith('#')) continue;

    nonEmptyCount++;
    const parsed = parseLine(raw, i + 1);

    if (parsed) {
      lines.push(parsed);
    } else {
      errors.push({
        line: i + 1,
        content: raw,
        message: 'Format mismatch: expected "name[role]: (description) dialogue"',
      });
    }
  }

  const validRatio = nonEmptyCount > 0 ? lines.length / nonEmptyCount : 0;
  const isValid = validRatio >= VALIDATION_THRESHOLD && lines.length > 0;

  const speakers = [...new Set(lines.map((l) => l.speaker))];
  const roles = [...new Set(lines.map((l) => l.role))];

  return {
    lines,
    isValid,
    errors,
    metadata: {
      speakers,
      roles,
      totalLines: nonEmptyCount,
      validLines: lines.length,
    },
  };
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
