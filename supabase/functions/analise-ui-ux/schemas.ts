// JSON Schema Definition for UI/UX Analysis V6

export const ANALYSIS_SCHEMA = {
  "type": "object",
  "properties": {
    "schemaVersion": {
      "type": "string",
      "enum": ["v6"]
    },
    "pontuacaoGeral": {
      "type": "number",
      "minimum": 0,
      "maximum": 10
    },
    "objetivoInferido": {
      "type": "string"
    },
    "jobToBeDone": {
      "type": "object",
      "properties": {
        "placeholderExemplo": {
          "type": "string"
        },
        "avaliacao": {
          "type": "object",
          "properties": {
            "atinge": {
              "type": "boolean"
            },
            "justificativa": {
              "type": "string"
            },
            "sugestoes": {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          },
          "required": ["atinge", "justificativa"]
        }
      },
      "required": ["placeholderExemplo", "avaliacao"]
    },
    "tomDeVoz": {
      "type": "object",
      "properties": {
        "nota": {
          "type": "number",
          "minimum": 0,
          "maximum": 10
        },
        "manter": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "elemento": {
                "type": "string"
              },
              "motivo": {
                "type": "string"
              }
            },
            "required": ["elemento", "motivo"]
          }
        },
        "mudar": {
          "type": "array",
          "description": "Mudanças concretas: Mude X → Y porque Z.",
          "items": {
            "type": "object",
            "properties": {
              "elemento": {
                "type": "string"
              },
              "antes": {
                "type": ["string", "null"]
              },
              "depois": {
                "type": "string"
              },
              "porque": {
                "type": "string"
              }
            },
            "required": ["elemento", "depois", "porque"]
          }
        }
      },
      "required": ["nota"]
    },
    "experiencia": {
      "type": "object",
      "description": "Usabilidade + Visual + Acessibilidade (mesma aba).",
      "properties": {
        "nota": {
          "type": "number",
          "minimum": 0,
          "maximum": 10
        },
        "usabilidade": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "elemento": {
                "type": "string"
              },
              "antes": {
                "type": ["string", "null"]
              },
              "depois": {
                "type": "string"
              },
              "porque": {
                "type": "string"
              }
            },
            "required": ["elemento", "depois", "porque"]
          }
        },
        "visual": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "elemento": {
                "type": "string"
              },
              "antes": {
                "type": ["string", "null"]
              },
              "depois": {
                "type": "string"
              },
              "porque": {
                "type": "string"
              }
            },
            "required": ["elemento", "depois", "porque"]
          }
        },
        "acessibilidade": {
          "type": "array",
          "description": "Cite WCAG quando possível (ex.: 1.4.3).",
          "items": {
            "type": "object",
            "properties": {
              "elemento": {
                "type": "string"
              },
              "wcag": {
                "type": ["string", "null"]
              },
              "antes": {
                "type": ["string", "null"]
              },
              "depois": {
                "type": "string"
              },
              "porque": {
                "type": "string"
              }
            },
            "required": ["elemento", "depois", "porque"]
          }
        },
        "cta": {
          "type": "object",
          "properties": {
            "principal": {
              "type": ["string", "null"]
            },
            "clareza": {
              "type": "number",
              "minimum": 0,
              "maximum": 10
            },
            "recomendacao": {
              "type": "string"
            }
          },
          "required": ["clareza", "recomendacao"]
        }
      },
      "required": ["nota"]
    },
    "prioridadesTop3": {
      "type": "array",
      "minItems": 1,
      "maxItems": 3,
      "items": {
        "type": "object",
        "properties": {
          "resumo": {
            "type": "string"
          },
          "motivo": {
            "type": "string"
          }
        },
        "required": ["resumo", "motivo"]
      }
    }
  },
  "required": [
    "schemaVersion",
    "pontuacaoGeral", 
    "jobToBeDone",
    "tomDeVoz",
    "experiencia",
    "prioridadesTop3"
  ],
  "additionalProperties": false
};