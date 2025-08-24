# Payloads de Teste - Schema V2

## Payload Completo (V2)

```json
{
  "schemaVersion": "v2",
  "pontuacaoGeral": 8.5,
  "objetivoInferido": "Conversão para cadastro de usuário",
  "avaliacaoDoObjetivo": {
    "atingeObjetivo": true,
    "justificativa": "A tela apresenta fluxo claro de cadastro com campos bem definidos e CTA destacado",
    "principaisEvidencias": [
      "Formulário estruturado e intuitivo",
      "Botão de ação primário bem posicionado",
      "Informações de segurança visíveis"
    ]
  },
  "hierarquiaEMensagens": {
    "pontuacao": 7.5,
    "feedback": "Hierarquia visual clara com título principal bem destacado e elementos secundários organizados adequadamente"
  },
  "estrategiaDeCTA": {
    "ctaPrincipal": "Criar conta",
    "clareza": 8.0,
    "comentario": "CTA claro e direto, posicionamento adequado no final do formulário"
  },
  "tomDeVozEBranding": {
    "pontuacao": 9.0,
    "observacoes": "Tom de voz consistente com a marca, linguagem acessível e inclusiva",
    "correcoesSugeridas": [
      "Substituir 'você' por 'a gente' para maior proximidade",
      "Ajustar capitalização do CTA"
    ],
    "checagensRapidas": {
      "meutudoMinusculo": true,
      "usaA_gente": false,
      "evitaGerundio": true,
      "ctaPrimeiraPalavraMaiuscula": true
    }
  },
  "analiseDesignEUsabilidade": {
    "pontuacao": 8.0,
    "feedback": "Design limpo e moderno, boa utilização de espaçamento e contraste adequado para leitura"
  },
  "analiseAcessibilidade": {
    "pontuacao": 7.0,
    "feedback": "Boa estrutura semântica, mas pode melhorar indicações de campos obrigatórios e descrições de erro"
  },
  "pontosPositivos": [
    "Layout responsivo bem executado",
    "Fluxo de cadastro intuitivo",
    "Feedback visual adequado para estados de erro",
    "Uso consistente da identidade visual"
  ],
  "sugestoesDeMelhoria": [
    {
      "area": "tom_de_voz",
      "sugestao": "Utilizar 'a gente' ao invés de 'você' para criar maior proximidade",
      "impacto": 3,
      "esforco": 1
    },
    {
      "area": "acessibilidade",
      "sugestao": "Adicionar labels mais descritivos aos campos de entrada",
      "impacto": 4,
      "esforco": 2
    },
    {
      "area": "cta",
      "sugestao": "Testar variação 'Começar agora' para o botão principal",
      "impacto": 3,
      "esforco": 1
    },
    {
      "area": "usabilidade_design",
      "sugestao": "Melhorar feedback visual durante validação de campos",
      "impacto": 4,
      "esforco": 3
    }
  ],
  "findings": [
    {
      "categoria": "tom_de_voz",
      "titulo": "Inconsistência no uso de pronomes pessoais",
      "evidencia": {
        "trechoTexto": "Digite seu email para continuar",
        "selector": ".form-field-email label",
        "bbox": [120, 150, 300, 170],
        "contexto": "Label do campo de email no formulário de cadastro"
      },
      "regraOuHeuristica": [
        {
          "tipo": "voz_meutudo",
          "id": "pronome-proximidade",
          "descricao": "Usar 'a gente' para criar proximidade com o usuário"
        }
      ],
      "severidade": "media",
      "impactoNoObjetivo": 3,
      "esforcoEstimado": 1,
      "antesDepois": {
        "antes": "Digite seu email para continuar",
        "depois": "Digite o seu email para a gente continuar"
      },
      "racional": "O uso de 'a gente' cria maior sensação de parceria e proximidade, alinhado com o tom da marca",
      "metricaRecomendada": "Taxa de conversão do formulário"
    },
    {
      "categoria": "usabilidade_design",
      "titulo": "Falta de indicação visual para campos obrigatórios",
      "evidencia": {
        "trechoTexto": null,
        "selector": ".form-required-fields",
        "bbox": [100, 200, 400, 350],
        "contexto": "Conjunto de campos obrigatórios sem marcação visual clara"
      },
      "regraOuHeuristica": [
        {
          "tipo": "nielsen",
          "id": "visibility-system-status",
          "descricao": "O sistema deve manter os usuários informados sobre o que está acontecendo"
        }
      ],
      "severidade": "alta",
      "impactoNoObjetivo": 4,
      "esforcoEstimado": 2,
      "antesDepois": {
        "antes": "Campos sem indicação visual de obrigatoriedade",
        "depois": "Asterisco (*) ou label 'obrigatório' junto aos campos necessários"
      },
      "racional": "Usuários precisam saber quais informações são obrigatórias antes de tentar submeter o formulário",
      "metricaRecomendada": "Taxa de erro de validação de formulário"
    },
    {
      "categoria": "acessibilidade",
      "titulo": "Contraste insuficiente em texto secundário",
      "evidencia": {
        "trechoTexto": "Ao criar conta, você concorda com nossos termos",
        "selector": ".terms-text",
        "bbox": [100, 380, 400, 400],
        "contexto": "Texto dos termos de uso no final do formulário"
      },
      "regraOuHeuristica": [
        {
          "tipo": "wcag",
          "id": "1.4.3",
          "descricao": "Contraste mínimo AA - razão de contraste de pelo menos 4.5:1"
        }
      ],
      "severidade": "media",
      "impactoNoObjetivo": 3,
      "esforcoEstimado": 1,
      "antesDepois": {
        "antes": "Texto cinza claro (#999999) sobre fundo branco",
        "depois": "Texto cinza escuro (#666666) ou preto (#333333) para melhor contraste"
      },
      "racional": "Garantir legibilidade para usuários com deficiência visual ou em condições de baixa luminosidade",
      "metricaRecomendada": "Pontuação de acessibilidade (Lighthouse)"
    }
  ],
  "variantesOuFluxo": [],
  "insightsGerais": [
    "O formulário segue boas práticas de UX, mas pode se beneficiar de testes A/B no CTA",
    "A marca está bem representada visualmente, alinhamento com guideline de tom de voz precisa de ajustes pontuais",
    "Potencial para melhorar conversão com otimizações de acessibilidade"
  ]
}
```

## Payload Mínimo (V2)

```json
{
  "schemaVersion": "v2",
  "pontuacaoGeral": 6.0,
  "objetivoInferido": "Informar sobre produto",
  "avaliacaoDoObjetivo": {
    "atingeObjetivo": false,
    "justificativa": "Layout básico sem otimizações claras para conversão"
  },
  "hierarquiaEMensagens": {
    "pontuacao": 5.0,
    "feedback": "Hierarquia visual precisa de melhorias"
  },
  "estrategiaDeCTA": {
    "ctaPrincipal": null,
    "clareza": 3.0,
    "comentario": "CTA pouco claro ou ausente"
  },
  "tomDeVozEBranding": {
    "pontuacao": 4.0,
    "observacoes": "Tom genérico, sem personalidade da marca"
  },
  "analiseDesignEUsabilidade": {
    "pontuacao": 5.0,
    "feedback": "Design funcional mas sem otimizações"
  },
  "analiseAcessibilidade": {
    "pontuacao": 6.0,
    "feedback": "Estrutura básica adequada"
  },
  "pontosPositivos": [
    "Estrutura HTML semântica",
    "Layout responsivo básico"
  ],
  "sugestoesDeMelhoria": [
    {
      "area": "hierarquia",
      "sugestao": "Melhorar contraste entre título e subtítulo"
    },
    {
      "area": "cta",
      "sugestao": "Adicionar call-to-action principal bem posicionado"
    },
    {
      "area": "tom_de_voz",
      "sugestao": "Aplicar guidelines de linguagem da marca"
    }
  ],
  "findings": [
    {
      "categoria": "usabilidade_design",
      "titulo": "Ausência de hierarquia visual clara",
      "severidade": "alta",
      "impactoNoObjetivo": 4,
      "antesDepois": {
        "depois": "Definir níveis claros de hierarquia tipográfica"
      }
    },
    {
      "categoria": "tom_de_voz",
      "titulo": "Linguagem muito formal para o público-alvo",
      "severidade": "media",
      "impactoNoObjetivo": 3,
      "antesDepois": {
        "depois": "Adotar tom mais próximo e acessível"
      }
    },
    {
      "categoria": "acessibilidade",
      "titulo": "Falta de textos alternativos em imagens",
      "severidade": "media",
      "impactoNoObjetivo": 2,
      "antesDepois": {
        "depois": "Incluir alt text descritivo para todas as imagens"
      }
    }
  ]
}
```

## Payload de Erro (Schema Violation)

```json
{
  "error": "Erro de validação do schema",
  "code": "LLM_SCHEMA_VIOLATION", 
  "details": {
    "errors": [
      {
        "message": "Missing required field: pontuacaoGeral",
        "path": "root.pontuacaoGeral"
      },
      {
        "message": "Array must have at least 3 items at root.findings",
        "path": "root.findings"
      },
      {
        "message": "Expected one of types: string,null at root.estrategiaDeCTA.ctaPrincipal",
        "path": "root.estrategiaDeCTA.ctaPrincipal"
      }
    ]
  },
  "schema_version": "v2",
  "status": 422
}
```

## Payload V1 (Fallback quando feature flag = false)

```json
{
  "pontuacaoGeral": 7.5,
  "objetivoInferido": "Apresentar produto para conversão",
  "avaliacaoDoObjetivo": {
    "atingeObjetivo": true,
    "justificativa": "Estrutura adequada para apresentação do produto",
    "principaisEvidencias": [
      "Informações claras sobre benefícios",
      "CTA bem posicionado"
    ]
  },
  "hierarquiaEMensagens": {
    "pontuacao": 8.0,
    "feedback": "Boa organização visual das informações"
  },
  "estrategiaDeCTA": {
    "ctaPrincipal": "Saiba mais",
    "clareza": 7.0,
    "comentario": "CTA funcional mas pode ser mais direto"
  },
  "tomDeVozEBranding": {
    "pontuacao": 8.0,
    "observacoes": "Tom alinhado com a marca",
    "correcoesSugeridas": ["Usar 'a gente' consistentemente"],
    "checagensRapidas": {
      "meutudoMinusculo": true,
      "usaA_gente": false,
      "evitaGerundio": true
    }
  },
  "analiseDesignEUsabilidade": {
    "pontuacao": 7.5,
    "feedback": "Design limpo e funcional"
  },
  "analiseAcessibilidade": {
    "pontuacao": 7.0,
    "feedback": "Estrutura acessível com pequenos ajustes necessários"
  },
  "pontosPositivos": [
    "Layout responsivo",
    "Informações bem organizadas"
  ],
  "sugestoesDeMelhoria": [
    {
      "area": "CTA",
      "sugestao": "Tornar call-to-action mais específico"
    }
  ],
  "variantesOuFluxo": [],
  "insightsGerais": [
    "Boa base para otimizações futuras"
  ]
}
```