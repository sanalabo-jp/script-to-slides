// === Script Format Type Enum ===

export enum ScriptType {
	General = 0,
	Drama = 1,
	Lecture = 2,
	News = 3,
	Interview = 4
}

// === Script Parser Types (v2) ===

export type Speaker = {
	name: string;
	role: string;
};

export interface ScriptFrontMatter {
	type: ScriptType;
	topic: string;
	categories: string[];
}

export interface SlideData {
	speaker: Speaker;
	context: string;
	metadata: Record<string, string>;
	visualHint: string | null;
	summary: string | null;
	image: string | null;
	detail: string | null;
	lineNumber: number;
}

export interface ParseError {
	line: number;
	content: string;
	message: string;
}

export interface ParseResult {
	frontMatter: ScriptFrontMatter;
	slides: SlideData[];
	isValid: boolean;
	errors: ParseError[];
	metadata: {
		speakers: Speaker[];
		totalLines: number;
		validLines: number;
	};
}

// === Slide Template Types ===

export interface ElementStyle {
	fontFamily: string;
	fontSize: number;
	fontColor: string;
	fontWeight: number;
}

export interface SlideTemplate {
	id: string;
	name: string;
	description: string;
	thumbnail: string;
	background: {
		color: string;
	};
	styles: {
		callout1Label: ElementStyle;
		callout2Label: ElementStyle;
		titleLabel: ElementStyle;
		bodyLabel: ElementStyle;
		captionLabel: ElementStyle;
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
	backgroundGradient?: { from: string; to: string };
}

/**
 * Legacy v1 script line type.
 * Retained for AI analysis module compatibility (Phase 4).
 * @deprecated Use SlideData for v2 pipeline.
 */
export interface ScriptLine {
	speaker: string;
	role: string;
	dialogue: string;
	description?: string;
	lineNumber: number;
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

// === Chat Input Types ===

export interface ChatMessage {
	id: string;
	speakerId: string;
	dialogue: string;
	visualHint: string;
	metadata: Record<string, string>;
	timestamp: number;
	isEditing: boolean;
	isEdited: boolean;
}

export interface SpeakerProfile {
	id: string;
	name: string;
	role: string;
	color: string;
	isDefault: boolean;
}

// === App State Types ===

export type AppStep =
	| 'upload'
	| 'preview'
	| 'template'
	| 'analyzing'
	| 'ready'
	| 'generating'
	| 'done'
	| 'error';

export interface AppState {
	step: AppStep;
	file: File | null;
	parseResult: ParseResult | null;
	analysis: GeminiAnalysisResult | null;
	selectedTemplate: SlideTemplate | null;
	outputFormat: 'pptx' | 'pdf';
	error: string | null;
}
