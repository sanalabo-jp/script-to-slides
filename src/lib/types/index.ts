// === Script Parser Types ===

export interface ScriptLine {
  speaker: string;
  role: string;
  description?: string;
  dialogue: string;
  lineNumber: number;
}

export interface ParseError {
  line: number;
  content: string;
  message: string;
}

export interface ParseResult {
  lines: ScriptLine[];
  isValid: boolean;
  errors: ParseError[];
  metadata: {
    speakers: string[];
    roles: string[];
    totalLines: number;
    validLines: number;
  };
}

// === Gemini AI Analysis Types ===

export interface SlideTheme {
  backgroundColor: string;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  mood: string;
}

export interface SlideVisual {
  shapeType: string;
  shapeColor: string;
  position: string;
  emoji?: string;
  backgroundGradient?: {
    from: string;
    to: string;
  };
}

export interface SlideSupplementary {
  text: string;
  keywords: string[];
}

export interface SlideAnalysis {
  lineNumber: number;
  visual: SlideVisual;
  supplementary?: SlideSupplementary;
}

export interface GeminiAnalysisResult {
  themes: Record<string, SlideTheme>;
  slides: SlideAnalysis[];
}

// === Slide Generator Types ===

export interface GeneratedSlide {
  speaker: string;
  role: string;
  description?: string;
  dialogue: string;
  theme: SlideTheme;
  visual: SlideVisual;
  supplementary?: SlideSupplementary;
}

export interface GenerationRequest {
  parsedScript: ParseResult;
  analysis: GeminiAnalysisResult;
  format: 'pptx' | 'pdf';
}

// === App State Types ===

export type AppStep = 'upload' | 'preview' | 'analyzing' | 'ready' | 'generating' | 'done' | 'error';

export interface AppState {
  step: AppStep;
  file: File | null;
  parseResult: ParseResult | null;
  analysis: GeminiAnalysisResult | null;
  outputFormat: 'pptx' | 'pdf';
  error: string | null;
}
