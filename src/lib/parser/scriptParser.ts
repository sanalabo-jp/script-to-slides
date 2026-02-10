import { ScriptType } from '$lib/types';
import type { Speaker, ScriptFrontMatter, SlideData, ParseError, ParseResult } from '$lib/types';

/**
 * Script v2 format parser
 *
 * Format:
 *   -type: 2
 *   -topic: 멘탈헬스 기초교육
 *   -categories: 정신건강, 직장인교육
 *
 *   ---
 *
 *   --chapter: 제1장
 *   --note: 학습목표
 *   강사[진행자]: (시각 힌트) 대사 내용
 *   강사[진행자]: 대사 내용
 */

const DIALOGUE_REGEX = /^(\S+)\[([^\]]+)\]:\s*(?:\(([^)]*)\)\s*)?(.+)$/;
const FRONT_MATTER_REGEX = /^-([^-][^:]*?):\s*(.+)$/;
const ROW_METADATA_REGEX = /^--([^:]+?):\s*(.+)$/;
const DELIMITER_REGEX = /^---\s*$/;

const SUPPORTED_EXTENSIONS = ['.txt', '.md', '.text', '.script'];

const VALIDATION_THRESHOLD = 0.5;

export function isSupportedExtension(filename: string): boolean {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return SUPPORTED_EXTENSIONS.includes(ext);
}

// Legacy alias
export const isSuportedExtension = isSupportedExtension;

function parseTypeValue(value: string): ScriptType {
  const num = parseInt(value.trim(), 10);
  if (num in ScriptType) return num as ScriptType;
  return ScriptType.General;
}

function parseCategoriesValue(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function parseFrontMatter(lines: string[]): {
  frontMatter: ScriptFrontMatter;
  bodyStartIndex: number;
  errors: ParseError[];
} {
  const frontMatter: ScriptFrontMatter = {
    type: ScriptType.General,
    topic: '',
    categories: [],
  };
  const errors: ParseError[] = [];

  // Find the --- delimiter
  let delimiterIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (DELIMITER_REGEX.test(lines[i].trim())) {
      delimiterIndex = i;
      break;
    }
  }

  if (delimiterIndex === -1) {
    // No delimiter found — entire file is body (no front matter)
    return { frontMatter, bodyStartIndex: 0, errors };
  }

  // Parse front matter lines (before delimiter)
  for (let i = 0; i < delimiterIndex; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const match = line.match(FRONT_MATTER_REGEX);
    if (match) {
      const [, key, value] = match;
      const k = key.trim().toLowerCase();
      const v = value.trim();

      switch (k) {
        case 'type':
          frontMatter.type = parseTypeValue(v);
          break;
        case 'topic':
          frontMatter.topic = v;
          break;
        case 'categories':
          frontMatter.categories = parseCategoriesValue(v);
          break;
        default:
          break;
      }
    } else {
      errors.push({
        line: i + 1,
        content: line,
        message: 'Invalid front matter format: expected "-key: value"',
      });
    }
  }

  return { frontMatter, bodyStartIndex: delimiterIndex + 1, errors };
}

interface MetadataBlock {
  metadata: Record<string, string>;
  rows: { raw: string; lineIndex: number }[];
}

function parseBody(lines: string[], startIndex: number): {
  blocks: MetadataBlock[];
  errors: ParseError[];
} {
  const errors: ParseError[] = [];
  const blocks: MetadataBlock[] = [];

  // Split body into groups separated by blank lines (double newline)
  let currentGroup: { raw: string; lineIndex: number }[] = [];
  const groups: { raw: string; lineIndex: number }[][] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    if (trimmed === '') {
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
        currentGroup = [];
      }
    } else {
      currentGroup.push({ raw: trimmed, lineIndex: i });
    }
  }
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  // Process each group
  for (const group of groups) {
    const metadata: Record<string, string> = {};
    const rows: { raw: string; lineIndex: number }[] = [];
    let metadataPhase = true;

    for (const item of group) {
      if (metadataPhase) {
        const metaMatch = item.raw.match(ROW_METADATA_REGEX);
        if (metaMatch) {
          const [, key, value] = metaMatch;
          metadata[key.trim()] = value.trim();
          continue;
        }
        metadataPhase = false;
      }

      const dialogueMatch = item.raw.match(DIALOGUE_REGEX);
      if (dialogueMatch) {
        rows.push(item);
      } else {
        const lateMetaMatch = item.raw.match(ROW_METADATA_REGEX);
        if (lateMetaMatch) {
          errors.push({
            line: item.lineIndex + 1,
            content: item.raw,
            message: 'Metadata line found after dialogue lines in the same block — ignored',
          });
        } else {
          errors.push({
            line: item.lineIndex + 1,
            content: item.raw,
            message: 'Format mismatch: expected "name[role]: (description) dialogue"',
          });
        }
      }
    }

    // Metadata without rows — discard per spec
    if (Object.keys(metadata).length > 0 && rows.length === 0) {
      for (const item of group) {
        if (item.raw.match(ROW_METADATA_REGEX)) {
          errors.push({
            line: item.lineIndex + 1,
            content: item.raw,
            message: 'Metadata block has no associated dialogue rows — discarded',
          });
        }
      }
      continue;
    }

    if (rows.length > 0) {
      blocks.push({ metadata, rows });
    }
  }

  return { blocks, errors };
}

function parseDialogueLine(
  raw: string,
  lineIndex: number,
  metadata: Record<string, string>,
): SlideData | null {
  const match = raw.match(DIALOGUE_REGEX);
  if (!match) return null;

  const [, speakerName, role, description, dialogue] = match;

  return {
    speaker: {
      name: speakerName.trim(),
      role: role.trim(),
    },
    context: dialogue.trim(),
    metadata: { ...metadata },
    visualHint: description?.trim() || null,
    summary: null,
    image: null,
    detail: null,
    lineNumber: lineIndex + 1,
  };
}

export function parseScript(content: string): ParseResult {
  const rawLines = content.split('\n');
  const allErrors: ParseError[] = [];

  const { frontMatter, bodyStartIndex, errors: fmErrors } = parseFrontMatter(rawLines);
  allErrors.push(...fmErrors);

  const { blocks, errors: bodyErrors } = parseBody(rawLines, bodyStartIndex);
  allErrors.push(...bodyErrors);

  const slides: SlideData[] = [];
  for (const block of blocks) {
    for (const row of block.rows) {
      const slide = parseDialogueLine(row.raw, row.lineIndex, block.metadata);
      if (slide) {
        slides.push(slide);
      }
    }
  }

  const speakerMap = new Map<string, Speaker>();
  for (const slide of slides) {
    const key = `${slide.speaker.name}[${slide.speaker.role}]`;
    if (!speakerMap.has(key)) {
      speakerMap.set(key, slide.speaker);
    }
  }

  const totalNonEmpty = rawLines
    .slice(bodyStartIndex)
    .filter((l) => {
      const t = l.trim();
      return t !== '' && !DELIMITER_REGEX.test(t) && !ROW_METADATA_REGEX.test(t);
    })
    .length;

  const validRatio = totalNonEmpty > 0 ? slides.length / totalNonEmpty : 0;
  const isValid = validRatio >= VALIDATION_THRESHOLD && slides.length > 0;

  return {
    frontMatter,
    slides,
    isValid,
    errors: allErrors,
    metadata: {
      speakers: [...speakerMap.values()],
      totalLines: totalNonEmpty,
      validLines: slides.length,
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
