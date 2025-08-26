// OpenAI Service Module

import OpenAI from 'https://esm.sh/openai@4';
import type { AIConfig } from './types.ts';

// OpenAI V2 Configuration
const V2_CONFIG = {
  MODEL: "gpt-5-mini",
  MAX_TOKENS: 6000,
  REASONING: "medium",
  VERBOSITY: "medium"
} as const;

export interface ImageContent {
  type: "image_url";
  image_url: {
    url: string;
    detail: "high";
  };
}

export interface CompletionParams {
  model: string;
  messages: Array<{
    role: string;
    content: Array<{
      type: string;
      text?: string;
    } | ImageContent>;
  }>;
  response_format?: {
    type: string;
    json_schema: {
      name: string;
      schema: any;
    };
  };
  tools?: Array<{
    type: string;
    function: {
      name: string;
      description: string;
      parameters: any;
    };
  }>;
  tool_choice?: {
    type: string;
    function: {
      name: string;
    };
  };
  max_completion_tokens?: number;
  reasoning_effort?: string;
  verbosity?: string;
  temperature?: number;
}

export class OpenAIService {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  prepareImageContent(image: string, imageType?: string): ImageContent {
    if (imageType === 'url' || image.startsWith('http')) {
      return {
        type: "image_url",
        image_url: { url: image, detail: "high" }
      };
    }
    
    const base64Image = image.startsWith('data:') 
      ? image 
      : `data:image/${imageType || 'jpeg'};base64,${image}`;
      
    return {
      type: "image_url",
      image_url: { url: base64Image, detail: "high" }
    };
  }

  buildCompletionParams(
    schema: any, 
    systemPrompt: string,
    userPrompt: string, 
    imageContent: ImageContent, 
    apiParams: AIConfig['api_parameters']
  ): CompletionParams {
    // Always use V6 configuration with JSON schema
    return {
      model: V2_CONFIG.MODEL, // Using gpt-5-mini for V6
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            imageContent
          ]
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "analise_ui_ux_v6", schema }
      },
      max_completion_tokens: V2_CONFIG.MAX_TOKENS,
      reasoning_effort: V2_CONFIG.REASONING,
      verbosity: V2_CONFIG.VERBOSITY
    };
  }

  async createCompletion(params: CompletionParams) {
    return await this.client.chat.completions.create(params);
  }

  extractAnalysisResult(completion: any): string {
    // V6 always uses JSON schema response format
    return completion.choices[0]?.message?.content || '';
  }
}