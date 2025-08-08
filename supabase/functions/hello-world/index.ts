/*
 * FUNÇÃO SUPABASE EDGE: ANÁLISE DE UI COM GPT-5
 * 
 * Esta função foi atualizada para total compatibilidade com a API GPT-5 da OpenAI.
 * 
 * PRINCIPAIS MUDANÇAS PARA GPT-5:
 * - max_tokens → max_completion_tokens (novo parâmetro oficial)
 * - Adicionado reasoning_effort: controla nível de raciocínio ('minimal', 'low', 'medium', 'high')
 * - Adicionado verbosity: controla detalhamento da resposta ('low', 'medium', 'high')
 * - REMOVIDO temperature: GPT-5 só aceita valor padrão (1), controle via reasoning_effort
 * - Mantida compatibilidade com Chat Completions API (recomendada para chamadas únicas)
 * 
 * CUSTOS GPT-5 (2025):
 * - gpt-5: $1.25/1M input tokens, $10/1M output tokens
 * - gpt-5-mini: $0.25/1M input tokens, $2/1M output tokens  
 * - gpt-5-nano: $0.05/1M input tokens, $0.40/1M output tokens
 * 
 * FUNCIONALIDADE:
 * - Recebe contexto e imagem via POST
 * - Busca configurações dinâmicas no Supabase (modelo IA + prompt template + manual da marca)
 * - Envia para GPT-5 com análise de imagem
 * - Retorna análise estruturada em JSON
 */

// Importa a função serve da biblioteca padrão do Deno para criar um servidor HTTP
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Importa o cliente do Supabase para interagir com o banco de dados
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Importa a biblioteca da OpenAI para fazer chamadas à API
// ATUALIZADO: OpenAI v4+ com suporte completo aos novos parâmetros do GPT-5
import OpenAI from 'https://esm.sh/openai@4'

// Define a interface para o corpo da requisição que esperamos receber
interface RequestBody {
  context: string;        // Contexto fornecido pelo usuário
  image: string;          // Imagem em base64 ou URL da imagem
  imageType?: string;     // Tipo da imagem (opcional: 'base64' ou 'url')
}

// Define a interface para os dados da configuração da IA no banco
interface AIConfig {
  model_name: string;      // Nome do modelo da OpenAI (ex: "gpt-4o-mini")
  prompt_template: string; // Template do prompt com placeholders
}

// Define a interface para os dados do manual da marca no banco
interface BrandManual {
  voice_principles: string; // Princípios da voz da marca
  rules: string;           // Regras específicas da marca
}

// Função principal que processa todas as requisições HTTP
serve(async (req: Request) => {
  // Tratamento de requisições OPTIONS para configurar CORS
  // CORS (Cross-Origin Resource Sharing) permite que o frontend (plugin do Figma) acesse a API
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*', // Permite acesso de qualquer origem
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE', // Métodos HTTP permitidos
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', // Cabeçalhos permitidos
      },
    })
  }

  // Bloco try...catch para tratamento de erros em toda a lógica da função
  try {
    // === INICIALIZAÇÃO DOS CLIENTES ===
    
    // Inicializa o cliente do Supabase usando as variáveis de ambiente
    // SUPABASE_URL: URL do seu projeto Supabase
    // SUPABASE_SERVICE_ROLE_KEY: Chave de serviço com permissões administrativas
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Inicializa o cliente da OpenAI usando a chave da API
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    })

    // === VALIDAÇÃO DA REQUISIÇÃO ===
    
    // Verifica se a requisição é do tipo POST (obrigatório para nossa API)
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({
          error: "Método não permitido",
          message: "Esta API aceita apenas requisições POST"
        }),
        {
          status: 405, // Status 405 = Method Not Allowed
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // Extrai e valida o corpo da requisição JSON
    const requestBody: RequestBody = await req.json()
    
    // Verifica se os campos obrigatórios estão presentes
    if (!requestBody.context || !requestBody.image) {
      return new Response(
        JSON.stringify({
          error: "Parâmetros obrigatórios ausentes",
          message: "Os campos 'context' e 'image' são obrigatórios"
        }),
        {
          status: 400, // Status 400 = Bad Request
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // === PRIMEIRA BUSCA NO BANCO: CONFIGURAÇÃO DA IA ===
    
    // Busca a configuração da IA na tabela ai_configs
    // Esta tabela contém o modelo a ser usado e o template do prompt
    const { data: aiConfigData, error: aiConfigError } = await supabase
      .from('ai_configs')
      .select('model_name, prompt_template')
      .single() // .single() porque esperamos apenas uma linha de configuração

    // Verifica se houve erro na busca da configuração
    if (aiConfigError) {
      console.error('Erro ao buscar configuração da IA:', aiConfigError)
      return new Response(
        JSON.stringify({
          error: "Erro ao acessar configuração da IA",
          message: "Não foi possível obter as configurações do modelo de IA"
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    const aiConfig: AIConfig = aiConfigData

    // === SEGUNDA BUSCA NO BANCO: MANUAL DA MARCA ===
    
    // Busca os dados do manual da marca na tabela brand_manuals
    // Esta tabela contém os princípios da voz da marca e as regras específicas
    const { data: brandManualData, error: brandManualError } = await supabase
      .from('brand_manuals')
      .select('voice_principles, rules')
      .single() // .single() porque esperamos apenas uma linha com o manual

    // Verifica se houve erro na busca do manual da marca
    if (brandManualError) {
      console.error('Erro ao buscar manual da marca:', brandManualError)
      return new Response(
        JSON.stringify({
          error: "Erro ao acessar manual da marca",
          message: "Não foi possível obter os dados do manual da marca"
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    const brandManual: BrandManual = brandManualData

    // === MONTAGEM DINÂMICA DO PROMPT ===
    
    // Substitui os placeholders no template do prompt pelos dados reais
    // Os placeholders seguem o formato {{NOME_DO_PLACEHOLDER}}
    let finalPrompt = aiConfig.prompt_template
      .replace('{{CONTEXT}}', requestBody.context)                     // Substitui o contexto fornecido
      .replace('{{VOICE_PRINCIPLES}}', brandManual.voice_principles)   // Substitui os princípios da voz
      .replace('{{RULES}}', brandManual.rules)                        // Substitui as regras da marca

    console.log('Prompt final montado:', finalPrompt.substring(0, 200) + '...')
    
    // === PREPARAÇÃO DA IMAGEM ===
    
    // Prepara o conteúdo da imagem para envio à OpenAI
    let imageContent: any
    
    console.log('Tipo de imagem recebida:', requestBody.imageType)
    console.log('Primeiros 100 caracteres da imagem:', requestBody.image.substring(0, 100))
    
    if (requestBody.imageType === 'url' || requestBody.image.startsWith('http')) {
      // Se for URL da imagem
      console.log('Processando imagem como URL')
      imageContent = {
        type: "image_url",
        image_url: {
          url: requestBody.image,
          // GPT-5: Adiciona configuração de detalhe para melhor análise de UI
          detail: "high"
        }
      }
    } else {
      // Se for base64 (padrão)
      console.log('Processando imagem como base64')
      
      // Valida e prepara o formato base64 correto
      let base64Image: string;
      
      if (requestBody.image.startsWith('data:')) {
        // Já tem o prefixo data URI
        base64Image = requestBody.image
      } else {
        // Adiciona prefixo data URI apropriado
        // GPT-5 suporta jpeg, png, gif, webp
        const imageFormat = requestBody.imageType || 'jpeg'
        base64Image = `data:image/${imageFormat};base64,${requestBody.image}`
      }
      
      console.log('Base64 formatado (primeiros 100 chars):', base64Image.substring(0, 100))
      
      imageContent = {
        type: "image_url",
        image_url: {
          url: base64Image,
          // GPT-5: Configura detalhe alto para melhor análise de UI
          detail: "high"
        }
      }
    }
    
    console.log('Estrutura final da imagem para OpenAI:', {
      type: imageContent.type,
      hasUrl: !!imageContent.image_url?.url,
      detail: imageContent.image_url?.detail,
      urlPrefix: imageContent.image_url?.url?.substring(0, 50) + '...'
    })

    // === CHAMADA À API DA OPENAI ===
    
    let completion;
    try {
      // Faz a chamada para a API da OpenAI usando as configurações obtidas do banco
      completion = await openai.chat.completions.create({
        model: aiConfig.model_name, // Usa o modelo especificado no banco (ex: "gpt-5-mini" para GPT-5)
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: finalPrompt // Envia o prompt montado dinamicamente
              },
              imageContent // Adiciona a imagem ao conteúdo da mensagem
            ]
          }
        ],
        // Força a resposta a ser em formato JSON válido
        response_format: { type: "json_object" },
        // GPT-5: temperature removido - apenas o valor padrão (1) é suportado pelo GPT-5
        // ANTERIOR: temperature: 0.7 (não suportado pelo GPT-5)
        // ATUAL: usar valor padrão do modelo (controle de determinismo agora via reasoning_effort)
        
        // === PARÂMETROS ATUALIZADOS PARA GPT-5 ===
        
        // GPT-5: Parâmetro de limite de tokens atualizado
        // ANTERIOR: max_tokens (descontinuado para GPT-5)
        // ATUAL: max_completion_tokens - controla tokens de resposta (máx: 128k para GPT-5)
        // AUMENTADO: 2048 → 4096 para permitir análises JSON completas e detalhadas
        max_completion_tokens: 8192,
        
        // GPT-5: Novo parâmetro para controle de raciocínio
        // 'minimal' = resposta rápida, pouco raciocínio (ideal para tarefas simples)
        // 'low'     = raciocínio básico (bom custo-benefício)
        // 'medium'  = raciocínio balanceado (padrão recomendado para análise de UI)
        // 'high'    = raciocínio profundo (para tarefas muito complexas)
        reasoning_effort: "medium",
        
        // GPT-5: Novo parâmetro para controle de verbosidade
        // 'low'    = respostas concisas e diretas
        // 'medium' = nível de detalhe equilibrado (padrão)
        // 'high'   = respostas detalhadas e abrangentes
        verbosity: "medium"
      })
    } catch (openaiError) {
      // === TRATAMENTO ESPECÍFICO DE ERROS DA OPENAI ===
      
      console.error('--- ERRO DETALHADO DA OPENAI ---:', openaiError)
      console.error('--- ERRO OBJETO COMPLETO ---:', JSON.stringify(openaiError, null, 2))
      console.error('--- CONFIGURAÇÃO ENVIADA ---:', {
        model: aiConfig.model_name,
        max_completion_tokens: 2048,
        reasoning_effort: "medium",
        verbosity: "medium",
        imageContentType: imageContent.type
      })
      
      return new Response(
        JSON.stringify({
          error: "A chamada para a OpenAI falhou",
          details: openaiError.message || "Erro desconhecido da OpenAI",
          openai_error_type: openaiError.type || "unknown",
          model_used: aiConfig.model_name,
          timestamp: new Date().toISOString()
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // Extrai a resposta da OpenAI
    const analysisResult = completion.choices[0]?.message?.content

    // Log da estrutura de resposta da OpenAI para debug
    console.log('--- RESPOSTA COMPLETA DA OPENAI ---:', JSON.stringify(completion, null, 2))
    console.log('--- ANÁLISE RESULT ---:', analysisResult)
    console.log('--- CHOICES DISPONÍVEIS ---:', completion.choices?.length || 0)
    console.log('--- PRIMEIRO CHOICE ---:', completion.choices[0] ? JSON.stringify(completion.choices[0], null, 2) : 'undefined')

    // Verifica se a OpenAI retornou uma resposta válida
    if (!analysisResult) {
      console.error('--- RESPOSTA VAZIA DA OPENAI ---')
      console.error('Completion object:', completion)
      console.error('Choices array:', completion.choices)
      console.error('First choice:', completion.choices?.[0])
      console.error('Message:', completion.choices?.[0]?.message)
      
      return new Response(
        JSON.stringify({
          error: "Erro na análise da IA",
          message: "A OpenAI não retornou uma resposta válida",
          details: {
            has_choices: !!completion.choices && completion.choices.length > 0,
            choices_count: completion.choices?.length || 0,
            first_choice_exists: !!completion.choices?.[0],
            message_exists: !!completion.choices?.[0]?.message,
            content_exists: !!completion.choices?.[0]?.message?.content,
            finish_reason: completion.choices?.[0]?.finish_reason || "unknown"
          },
          debug_completion: {
            id: completion.id,
            model: completion.model,
            usage: completion.usage
          }
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // === RETORNO DO RESULTADO ===
    
    // Tenta fazer o parse do JSON retornado pela OpenAI
    let parsedResult
    try {
      parsedResult = JSON.parse(analysisResult)
    } catch (parseError) {
      console.error('Erro ao fazer parse da resposta da OpenAI:', parseError)
      // Se não conseguir fazer o parse, retorna a resposta como string
      parsedResult = { analysis: analysisResult }
    }

    // Retorna o resultado da análise com status 200 (sucesso)
    return new Response(
      JSON.stringify({
        success: true,
        data: parsedResult,
        metadata: {
          model_used: aiConfig.model_name,
          timestamp: new Date().toISOString(),
          tokens_used: completion.usage?.total_tokens || 0
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      }
    )

  } catch (error) {
    // === TRATAMENTO DE ERROS GERAIS ===
    
    // Em caso de qualquer erro não tratado anteriormente
    console.error('--- ERRO GERAL NA FUNÇÃO ---:', error)
    console.error('--- STACK TRACE ---:', error.stack)
    console.error('--- ERRO TIPO ---:', typeof error)
    console.error('--- ERRO NOME ---:', error.name)
    
    // Determina se é erro de rede, parse, ou outro
    let errorType = "unknown"
    let errorDetails = error.message || "Erro desconhecido"
    
    if (error.name === 'TypeError') {
      errorType = "network_or_parse_error"
    } else if (error.message?.includes('JSON')) {
      errorType = "json_parse_error"  
    } else if (error.message?.includes('fetch')) {
      errorType = "network_error"
    }
    
    return new Response(
      JSON.stringify({
        error: "Erro interno do servidor",
        message: errorDetails,
        error_type: errorType,
        error_name: error.name,
        timestamp: new Date().toISOString(),
        // Em desenvolvimento, inclua mais detalhes
        debug_info: {
          stack: error.stack?.split('\n').slice(0, 5) // Primeiras 5 linhas do stack
        }
      }),
      {
        status: 500, // Status 500 = Erro Interno do Servidor
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})