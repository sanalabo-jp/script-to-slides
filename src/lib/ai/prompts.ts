import type { ScriptLine } from '$lib/types';

export function buildAnalysisPrompt(lines: ScriptLine[]): string {
  const scriptText = lines
    .map((l) => {
      const desc = l.description ? `(${l.description}) ` : '';
      return `[Line ${l.lineNumber}] ${l.speaker}[${l.role}]: ${desc}${l.dialogue}`;
    })
    .join('\n');

  const roles = [...new Set(lines.map((l) => l.role))];
  const speakers = [...new Set(lines.map((l) => l.speaker))];
  const speakerRoleMap = speakers
    .map((s) => {
      const line = lines.find((l) => l.speaker === s);
      return `"${s}": role="${line?.role}"`;
    })
    .join(', ');

  return `You are a professional presentation designer. Your job is to analyze a lecture/broadcast script and output a STRICT JSON object that will be used to auto-generate PowerPoint slides.

## Context
This script has ${lines.length} lines from ${speakers.length} speakers.
Speakers: ${speakerRoleMap}
Each line in the script becomes exactly ONE slide in the presentation.

## Script
${scriptText}

## Instructions

### 1. Themes (one per speaker)
Design a unique visual theme for EACH SPEAKER (not each role).
The theme key MUST be the speaker's name exactly as written above.
Consider the speaker's role and personality when choosing colors and mood.

Theme requirements:
- backgroundColor: a hex color for the slide background (light/pastel tones recommended for readability)
- primaryColor: hex color for main text (must contrast well against backgroundColor)
- accentColor: hex color for decorative elements and highlights
- fontFamily: one of "Arial", "Georgia", "Verdana", "Trebuchet MS", "Courier New"
- mood: one of "professional", "casual", "dramatic", "warm", "serious", "playful"

### 2. Slides (one per script line, MUST match lineNumber exactly)
For EVERY line in the script, create a slide entry. You MUST create exactly ${lines.length} slide entries with lineNumber values from 1 to ${lines.length}.

For each slide:

**visual** (required): Derive visual elements from the DESCRIPTION (stage direction in parentheses), NOT from the dialogue.
- shapeType: "rectangle" | "circle" | "arrow" | "star" | "diamond" | "triangle" | "cloud" | "heart" | "none"
- shapeColor: hex color that complements the speaker's theme
- position: "background" | "top-right" | "bottom-left" | "center-back" | "left-side" | "right-side"
- emoji: a single emoji that represents the scene mood (e.g., "🎬" for studio, "📊" for graph)
- backgroundGradient: optional, { "from": "#hex", "to": "#hex" } for atmospheric scenes

**supplementary** (optional): ONLY include when the dialogue contains technical terms, statistics, or complex concepts.
- text: a brief 1-2 sentence explanation in the SAME LANGUAGE as the dialogue
- keywords: array of 2-4 key terms from the dialogue

Do NOT add supplementary for simple greetings, transitions, or casual speech.

## Required Output Format

Return ONLY this JSON structure with no extra text, no markdown fences, no explanation:

{
  "themes": {
    "${speakers[0]}": {
      "backgroundColor": "#hex",
      "primaryColor": "#hex",
      "accentColor": "#hex",
      "fontFamily": "Arial",
      "mood": "professional"
    }${speakers.length > 1 ? `,\n    "${speakers[1]}": { ... }` : ''}
  },
  "slides": [
    {
      "lineNumber": 1,
      "visual": {
        "shapeType": "rectangle",
        "shapeColor": "#hex",
        "position": "top-right",
        "emoji": "🎬",
        "backgroundGradient": { "from": "#hex", "to": "#hex" }
      },
      "supplementary": {
        "text": "Explanation text in same language as dialogue",
        "keywords": ["keyword1", "keyword2"]
      }
    },
    {
      "lineNumber": 2,
      "visual": { "shapeType": "circle", "shapeColor": "#hex", "position": "background", "emoji": "😊" }
    }
  ]
}

## Critical Rules
1. Theme keys MUST be speaker names: ${speakers.map((s) => `"${s}"`).join(', ')}
2. You MUST output exactly ${lines.length} slide entries in the "slides" array (lineNumber 1 through ${lines.length}).
3. Every slide MUST have a "visual" object. "supplementary" is optional.
4. Colors must provide good contrast (dark text on light background or vice versa).
5. Return ONLY valid JSON. No markdown, no comments, no explanation before or after the JSON.`;
}
