// Validation and Normalization Utilities for V6 Schema

import type { ValidationResult } from './types.ts';

export function validateJsonSchema(data: any, schema: any): ValidationResult {
  const errors: Array<{ message: string; path: string }> = [];
  
  function validate(obj: any, objSchema: any, path: string = 'root'): void {
    if (objSchema.type === 'object') {
      if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
        errors.push({ message: `Expected object at ${path}`, path });
        return;
      }
      
      if (objSchema.required) {
        objSchema.required.forEach((field: string) => {
          if (!(field in obj)) {
            errors.push({ message: `Missing required field: ${field}`, path: `${path}.${field}` });
          }
        });
      }
      
      Object.entries(obj).forEach(([key, value]) => {
        const fieldSchema = objSchema.properties?.[key];
        if (fieldSchema) {
          validate(value, fieldSchema, `${path}.${key}`);
        }
      });
    } else if (objSchema.type === 'array') {
      if (!Array.isArray(obj)) {
        errors.push({ message: `Expected array at ${path}`, path });
        return;
      }
      
      if (objSchema.minItems && obj.length < objSchema.minItems) {
        errors.push({ message: `Array must have at least ${objSchema.minItems} items`, path });
      }
      
      if (objSchema.maxItems && obj.length > objSchema.maxItems) {
        errors.push({ message: `Array must have at most ${objSchema.maxItems} items`, path });
      }
      
      if (objSchema.items) {
        obj.forEach((item, index) => validate(item, objSchema.items, `${path}[${index}]`));
      }
    } else if (objSchema.type === 'string') {
      if (typeof obj !== 'string') {
        errors.push({ message: `Expected string at ${path}`, path });
      }
      if (objSchema.enum && !objSchema.enum.includes(obj)) {
        errors.push({ message: `Value must be one of: ${objSchema.enum.join(', ')}`, path });
      }
    } else if (objSchema.type === 'number') {
      if (typeof obj !== 'number') {
        errors.push({ message: `Expected number at ${path}`, path });
      }
      if (objSchema.minimum !== undefined && obj < objSchema.minimum) {
        errors.push({ message: `Value must be >= ${objSchema.minimum}`, path });
      }
      if (objSchema.maximum !== undefined && obj > objSchema.maximum) {
        errors.push({ message: `Value must be <= ${objSchema.maximum}`, path });
      }
    } else if (objSchema.type === 'boolean') {
      if (typeof obj !== 'boolean') {
        errors.push({ message: `Expected boolean at ${path}`, path });
      }
    } else if (Array.isArray(objSchema.type)) {
      const isValid = objSchema.type.some((type: string) => {
        switch (type) {
          case 'null': return obj === null;
          case 'string': return typeof obj === 'string';
          case 'number': return typeof obj === 'number';
          case 'boolean': return typeof obj === 'boolean';
          case 'array': return Array.isArray(obj);
          case 'object': return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
          default: return false;
        }
      });
      
      if (!isValid) {
        errors.push({ message: `Expected one of types: ${objSchema.type.join(', ')}`, path });
      }
    }
  }
  
  validate(data, schema);
  return { valid: errors.length === 0, errors };
}

export function normalizeV6Data(data: any): any {
  const normalized = { ...data };
  
  // Set schema version to V6
  normalized.schemaVersion = 'v6';
  
  // Ensure required top-level properties have defaults if missing
  if (!normalized.objetivoInferido) {
    normalized.objetivoInferido = '';
  }
  
  // Ensure jobToBeDone structure
  if (!normalized.jobToBeDone) {
    normalized.jobToBeDone = {
      placeholderExemplo: '',
      avaliacao: {
        atinge: false,
        justificativa: '',
        sugestoes: []
      }
    };
  } else {
    if (!normalized.jobToBeDone.placeholderExemplo) {
      normalized.jobToBeDone.placeholderExemplo = '';
    }
    
    if (!normalized.jobToBeDone.avaliacao) {
      normalized.jobToBeDone.avaliacao = {
        atinge: false,
        justificativa: '',
        sugestoes: []
      };
    } else {
      if (!normalized.jobToBeDone.avaliacao.sugestoes) {
        normalized.jobToBeDone.avaliacao.sugestoes = [];
      }
    }
  }
  
  // Ensure tomDeVoz structure
  if (!normalized.tomDeVoz) {
    normalized.tomDeVoz = {
      nota: 0,
      manter: [],
      mudar: []
    };
  } else {
    if (!normalized.tomDeVoz.manter) {
      normalized.tomDeVoz.manter = [];
    }
    if (!normalized.tomDeVoz.mudar) {
      normalized.tomDeVoz.mudar = [];
    }
  }
  
  // Ensure experiencia structure
  if (!normalized.experiencia) {
    normalized.experiencia = {
      nota: 0,
      usabilidade: [],
      visual: [],
      acessibilidade: [],
      cta: {
        principal: null,
        clareza: 0,
        recomendacao: ''
      }
    };
  } else {
    if (!normalized.experiencia.usabilidade) {
      normalized.experiencia.usabilidade = [];
    }
    if (!normalized.experiencia.visual) {
      normalized.experiencia.visual = [];
    }
    if (!normalized.experiencia.acessibilidade) {
      normalized.experiencia.acessibilidade = [];
    }
    if (!normalized.experiencia.cta) {
      normalized.experiencia.cta = {
        principal: null,
        clareza: 0,
        recomendacao: ''
      };
    }
  }
  
  // Ensure prioridadesTop3 has at least 1 item
  if (!normalized.prioridadesTop3 || normalized.prioridadesTop3.length === 0) {
    normalized.prioridadesTop3 = [{
      resumo: 'Prioridade não identificada',
      motivo: 'Análise incompleta ou dados insuficientes'
    }];
  }
  
  // Ensure prioridadesTop3 doesn't exceed 3 items
  if (normalized.prioridadesTop3.length > 3) {
    normalized.prioridadesTop3 = normalized.prioridadesTop3.slice(0, 3);
  }
  
  // Validate and fix numeric ranges
  if (typeof normalized.pontuacaoGeral !== 'number' || normalized.pontuacaoGeral < 0 || normalized.pontuacaoGeral > 10) {
    normalized.pontuacaoGeral = 0;
  }
  
  if (typeof normalized.tomDeVoz?.nota !== 'number' || normalized.tomDeVoz.nota < 0 || normalized.tomDeVoz.nota > 10) {
    normalized.tomDeVoz.nota = 0;
  }
  
  if (typeof normalized.experiencia?.nota !== 'number' || normalized.experiencia.nota < 0 || normalized.experiencia.nota > 10) {
    normalized.experiencia.nota = 0;
  }
  
  if (typeof normalized.experiencia?.cta?.clareza !== 'number' || normalized.experiencia.cta.clareza < 0 || normalized.experiencia.cta.clareza > 10) {
    normalized.experiencia.cta.clareza = 0;
  }
  
  return normalized;
}