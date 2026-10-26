import { COUNTS, FILLS, ROTATIONS, SHAPES } from '../../src/types/matrix';
import type { Difficulty } from '../../src/types/matrix';

/** Gemini 的結構輸出使用簡潔 enum，避免數字 literal 被轉成大量 anyOf/const。 */
export function responseSchema(count: number, difficulty: Difficulty) {
  const size = difficulty === 'easy' ? 2 : 3;
  const ruleCount = { easy: 1, medium: 2, hard: 3 }[difficulty];
  const cell = {
    type: 'object',
    properties: {
      shape: { type: 'string', enum: [...SHAPES] },
      rotation: { type: 'integer', enum: [...ROTATIONS] },
      fill: { type: 'string', enum: [...FILLS] },
      count: { type: 'integer', enum: [...COUNTS] },
    },
    required: ['shape', 'rotation', 'fill', 'count'],
    additionalProperties: false,
  };
  return {
    type: 'object',
    properties: {
      version: { type: 'integer', enum: [1] },
      questions: {
        type: 'array', minItems: count, maxItems: count,
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            size: { type: 'integer', enum: [size] },
            difficulty: { type: 'string', enum: [difficulty] },
            grid: { type: 'array', minItems: size, maxItems: size, items: { type: 'array', minItems: size, maxItems: size, items: { ...cell, type: ['object', 'null'] } } },
            options: { type: 'array', minItems: 5, maxItems: 7, items: { type: 'object', properties: { id: { type: 'string' }, cell }, required: ['id', 'cell'], additionalProperties: false } },
            correctOptionId: { type: 'string' },
            rules: { type: 'array', minItems: ruleCount, maxItems: ruleCount, items: { type: 'object', properties: { attribute: { type: 'string', enum: ['shape', 'rotation', 'fill', 'count'] }, direction: { type: 'string', enum: ['row', 'column'] }, step: { type: 'integer', enum: [1, 2, 3] } }, required: ['attribute', 'direction', 'step'], additionalProperties: false } },
            explanation: { type: 'string' },
            source: { type: 'string', enum: ['gemini'] },
          },
          required: ['id', 'size', 'difficulty', 'grid', 'options', 'correctOptionId', 'rules', 'explanation', 'source'],
          additionalProperties: false,
        },
      },
    },
    required: ['version', 'questions'],
    additionalProperties: false,
  };
}
