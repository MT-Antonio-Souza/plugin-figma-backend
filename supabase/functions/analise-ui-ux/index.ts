/*
 * FUNÇÃO SUPABASE EDGE: ANÁLISE DE UI/UX COM STREAMING
 * 
 * Arquitetura modular com separação de responsabilidades:
 * - types.ts: Definições de tipos TypeScript
 * - schemas.ts: Schemas JSON para validação  
 * - validation.ts: Utilitários de validação e normalização
 * - openai-service.ts: Serviço de integração com OpenAI
 * - sse-utils.ts: Utilitários para Server-Sent Events
 * - index.ts: Handler principal orquestrando os módulos
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Module imports
import type { RequestBody, AIConfig, BrandManual, AnalysisMetadata } from './types.ts';
import { ANALYSIS_SCHEMA } from './schemas.ts';
import { validateJsonSchema, normalizeV6Data } from './validation.ts';
import { OpenAIService } from './openai-service.ts';
import { 
  createSSEResponse, 
  sendErrorResponse, 
  sendProgressUpdate, 
  sendResult, 
  closeWriter 
} from './sse-utils.ts';

// Configuration - V6 Schema (no feature flags needed)

// Database service
class DatabaseService {
  constructor(private supabase: any) {}

  async getAIConfig(): Promise<{ data: AIConfig | null; error: any }> {
    return await this.supabase
      .from('ai_configs')
      .select('system_prompt, prompt_template, api_parameters')
      .single();
  }

  async getBrandManual(): Promise<{ data: BrandManual | null; error: any }> {
    return await this.supabase
      .from('brand_manuals')
      .select('voice_principles, rules')
      .single();
  }
}

// Analysis service that orchestrates the entire flow
class AnalysisService {
  constructor(
    private db: DatabaseService,
    private openai: OpenAIService,
    private writer: WritableStreamDefaultWriter
  ) {}

  async processAnalysis(requestBody: RequestBody): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Step 1: Load configurations
      await sendProgressUpdate(this.writer, 'configuracao', 'Carregando configurações...');
      const { data: aiConfig, error: aiConfigError } = await this.db.getAIConfig();
      
      if (aiConfigError || !aiConfig) {
        throw new Error('Configurações da IA não encontradas');
      }

      // Step 2: Load brand manual  
      await sendProgressUpdate(this.writer, 'manual', 'Carregando manual da marca...');
      const { data: brandManual, error: brandError } = await this.db.getBrandManual();
      
      if (brandError || !brandManual) {
        throw new Error('Manual da marca não encontrado');
      }

      // Step 3: Prepare analysis
      await sendProgressUpdate(this.writer, 'prompt', 'Preparando análise...');
      const finalPrompt = this.buildPrompt(aiConfig, brandManual, requestBody);
      const imageContent = this.openai.prepareImageContent(requestBody.image, requestBody.imageType);

      // Step 4: Use V6 schema (always)
      console.log('Using schema: V6');

      // Step 5: Call OpenAI
      await sendProgressUpdate(this.writer, 'api', 'Analisando com IA...');
      const completionParams = this.openai.buildCompletionParams(
        ANALYSIS_SCHEMA,
        aiConfig.system_prompt,
        finalPrompt, 
        imageContent, 
        aiConfig.api_parameters
      );

      const completion = await this.openai.createCompletion(completionParams);

      // Step 6: Process result
      await sendProgressUpdate(this.writer, 'processando', 'Processando resultado...');
      const analysisResult = this.openai.extractAnalysisResult(completion);
      
      if (!analysisResult) {
        throw new Error('Resposta vazia da IA');
      }

      // Step 7: Validate and normalize
      let parsedResult = JSON.parse(analysisResult);
      
      const normalizedData = normalizeV6Data(parsedResult);
      const validation = validateJsonSchema(normalizedData, ANALYSIS_SCHEMA);
      
      if (!validation.valid) {
        await sendErrorResponse(this.writer, {
          error: "Erro de validação do schema",
          code: "LLM_SCHEMA_VIOLATION",
          details: { errors: validation.errors },
          schema_version: "v6"
        });
        return;
      }
      
      parsedResult = normalizedData;

      // Step 8: Log observability data
      const processingTime = Date.now() - startTime;
      this.logAnalysisMetadata({
        model_used: completionParams.model,
        schema_version: 'v6',
        processing_time: processingTime,
        payload_size: JSON.stringify(parsedResult).length,
        findings_by_category: undefined // V6 doesn't have findings field
      });

      // Step 9: Send final result
      await sendResult(this.writer, parsedResult);

    } catch (error: any) {
      console.error('Analysis error:', error);
      await sendErrorResponse(this.writer, {
        error: "Erro na análise",
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  private buildPrompt(aiConfig: AIConfig, brandManual: BrandManual, requestBody: RequestBody): string {
    return aiConfig.prompt_template
      .replace('{{CONTEXT}}', requestBody.context)
      .replace('{{JTBD}}', requestBody.jtbd)
      .replace('{{VOICE_PRINCIPLES}}', brandManual.voice_principles)
      .replace('{{RULES}}', brandManual.rules);
  }

  // Removed countFindingsByCategory - not needed for V6 schema

  private logAnalysisMetadata(metadata: AnalysisMetadata): void {
    console.log('=== OBSERVABILIDADE ===');
    console.log('Schema:', metadata.schema_version);
    console.log('Model:', metadata.model_used);
    console.log('Processing time:', metadata.processing_time + 'ms');
    console.log('Payload size:', metadata.payload_size, 'bytes');
    
    if (metadata.findings_by_category) {
      console.log('Findings by category:', metadata.findings_by_category);
    }
  }
}

// Request handler
class RequestHandler {
  async handleRequest(req: Request): Promise<Response> {
    // Handle CORS
    if (req.method === 'OPTIONS') {
      return this.createCORSResponse();
    }

    if (req.method !== 'POST') {
      return this.createErrorResponse('Método não permitido', 405);
    }

    // Create SSE response
    const { response, writer } = createSSEResponse();

    // Process request asynchronously
    this.processRequest(req, writer);

    return response;
  }

  private async processRequest(req: Request, writer: WritableStreamDefaultWriter): Promise<void> {
    try {
      await sendProgressUpdate(writer, 'inicializando', 'Iniciando análise...');

      // Initialize services
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const openaiService = new OpenAIService(Deno.env.get('OPENAI_API_KEY') ?? '');
      const dbService = new DatabaseService(supabase);
      const analysisService = new AnalysisService(dbService, openaiService, writer);

      // Validate request body
      const requestBody: RequestBody = await req.json();
      if (!requestBody.context || !requestBody.jtbd || !requestBody.image) {
        await sendErrorResponse(writer, {
          error: "Parâmetros obrigatórios ausentes",
          message: "Os campos 'context', 'jtbd' e 'image' são obrigatórios"
        });
        return;
      }

      // Process analysis
      await analysisService.processAnalysis(requestBody);

    } catch (error: any) {
      console.error('Request processing error:', error);
      await sendErrorResponse(writer, {
        error: "Erro interno do servidor",
        message: error.message || "Erro desconhecido",
        timestamp: new Date().toISOString()
      });
    } finally {
      await closeWriter(writer);
    }
  }

  private createCORSResponse(): Response {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  private createErrorResponse(message: string, status: number): Response {
    return new Response(JSON.stringify({
      error: message,
      message: "Esta API aceita apenas requisições POST"
    }), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

// Main entry point
serve(async (req: Request) => {
  const handler = new RequestHandler();
  return await handler.handleRequest(req);
});