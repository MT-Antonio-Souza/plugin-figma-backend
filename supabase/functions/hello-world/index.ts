// Importa a função serve da biblioteca padrão do Deno para criar um servidor HTTP
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Importa o cliente do Supabase para interagir com o banco de dados
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Importa a biblioteca da OpenAI para fazer chamadas à API
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
    
    if (requestBody.imageType === 'url' || requestBody.image.startsWith('http')) {
      // Se for URL da imagem
      imageContent = {
        type: "image_url",
        image_url: {
          url: requestBody.image
        }
      }
    } else {
      // Se for base64 (padrão)
      const base64Image = requestBody.image.startsWith('data:') ? requestBody.image : `data:image/jpeg;base64,${requestBody.image}`
      imageContent = {
        type: "image_url",
        image_url: {
          url: base64Image
        }
      }
    }

    // === CHAMADA À API DA OPENAI ===
    
    // Faz a chamada para a API da OpenAI usando as configurações obtidas do banco
    const completion = await openai.chat.completions.create({
      model: aiConfig.model_name, // Usa o modelo especificado no banco (ex: "gpt-4o" para suporte a imagem)
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
      temperature: 0.7, // Controla a criatividade da resposta (0.0 = mais determinístico, 1.0 = mais criativo)
      max_tokens: 1500  // Limita o tamanho da resposta
    })

    // Extrai a resposta da OpenAI
    const analysisResult = completion.choices[0]?.message?.content

    // Verifica se a OpenAI retornou uma resposta válida
    if (!analysisResult) {
      return new Response(
        JSON.stringify({
          error: "Erro na análise da IA",
          message: "A OpenAI não retornou uma resposta válida"
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
    console.error('Erro geral na função:', error)
    
    return new Response(
      JSON.stringify({
        error: "Erro interno do servidor",
        message: error.message,
        timestamp: new Date().toISOString()
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