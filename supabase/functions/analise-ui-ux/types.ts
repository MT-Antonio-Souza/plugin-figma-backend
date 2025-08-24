// Types for UI/UX Analysis Function

export interface RequestBody {
  context: string;
  image: string;
  imageType?: string;
}

export interface AIConfig {
  prompt_template: string;
  api_parameters: {
    model: string;
    max_completion_tokens?: number;
    reasoning_effort?: string;
    verbosity?: string;
    temperature?: number;
  };
}

export interface BrandManual {
  voice_principles: string;
  rules: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  message: string;
  path: string;
}

export interface SSEMessage {
  type: string;
  data: any;
}

export interface ErrorResponse {
  error: string;
  message?: string;
  code?: string;
  details?: any;
  schema_version?: string;
  timestamp?: string;
}

export interface AnalysisMetadata {
  model_used: string;
  schema_version: string;
  processing_time: number;
  payload_size: number;
  findings_by_category?: Record<string, number>;
}