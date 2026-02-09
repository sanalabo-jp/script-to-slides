import type { ScriptLine } from '$lib/types';

export function buildAnalysisPrompt(lines: ScriptLine[]): string {
  const scriptText = lines
    .map((l) => {
      const desc = l.description ? `(${l.description}) ` : '';
      return `${l.speaker}[${l.role}]: ${desc}${l.dialogue}`;
    })
    .join('\n');

  const roles = [...new Set(lines.map((l) => l.role))];
  const speakers = [...new Set(lines.map((l) => l.speaker))];

  return `You are a presentation design expert. Analyze the following lecture/broadcast script and generate a structured JSON response for creating PowerPoint slides.

## Script Information
- Speakers: ${speakers.join(', ')}
- Roles: ${roles.join(', ')}
- Total lines: ${lines.length}

## Script Content
${scriptText}

## Your Task

For each role, design a slide theme (colors, font style, mood).
For each line, analyze the description (scene direction) to suggest visual elements, and determine if the dialogue needs supplementary explanation.

## Response Format (strict JSON)

{
  "themes": {
    "<role>": {
      "backgroundColor": "#hex",
      "primaryColor": "#hex (text/heading color)",
      "accentColor": "#hex (decorative elements)",
      "fontFamily": "font name (use web-safe fonts: Arial, Georgia, Verdana, Trebuchet MS, Courier New)",
      "mood": "professional | casual | dramatic | warm | serious | playful"
    }
  },
  "slides": [
    {
      "lineNumber": <original line number>,
      "visual": {
        "shapeType": "rectangle | circle | arrow | star | diamond | triangle | cloud | heart | none",
        "shapeColor": "#hex",
        "position": "background | top-right | bottom-left | center-back | left-side | right-side",
        "emoji": "<single emoji representing the mood, optional>",
        "backgroundGradient": {
          "from": "#hex",
          "to": "#hex"
        }
      },
      "supplementary": {
        "text": "<brief explanation to help understand the dialogue content, 1-2 sentences max>",
        "keywords": ["keyword1", "keyword2"]
      }
    }
  ]
}

## Rules
1. Theme colors should reflect the role's personality (e.g., teacher = calm blues, anchor = formal darks).
2. Visual elements should reflect the DESCRIPTION (scene direction), not the dialogue content.
3. Supplementary text is OPTIONAL — only include it when the dialogue contains technical terms, specific information, or complex concepts that benefit from brief explanation. For simple greetings or casual dialogue, omit the "supplementary" field entirely.
4. Use harmonious color palettes. Background and text colors must have sufficient contrast.
5. Return ONLY valid JSON, no markdown, no explanation.`;
}
