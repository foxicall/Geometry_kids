import { describe, expect, it } from 'vitest';
import { elapsedTime, gameReducer, initialGame, nextDifficulty, ROUND_LENGTH } from '../src/lib/game';
import { createQuestion } from '../src/lib/questions';

const start = () => gameReducer(initialGame, { type: 'start', question: createQuestion('easy', 'q1'), adaptive: true, now: 1000, sessionId: 'session-1' });
describe('作答狀態與計時', () => {
  it('未選答案無法提交，重複提交與回饋期間選擇皆無效', () => {
    const state = start();
    expect(gameReducer(state, { type: 'confirm', now: 2000 })).toBe(state);
    expect(gameReducer(state, { type: 'select', id: 'invalid' })).toBe(state);
    const selected = gameReducer(state, { type: 'select', id: state.question!.correctOptionId });
    const submitted = gameReducer(selected, { type: 'confirm', now: 3000 });
    expect(submitted.answers).toHaveLength(1);
    expect(submitted.answers[0].correct).toBe(true);
    expect(gameReducer(submitted, { type: 'confirm', now: 4000 })).toBe(submitted);
    expect(gameReducer(submitted, { type: 'select', id: state.question!.options[0].id })).toBe(submitted);
  });
  it('只計算思考時間，重新開始與離開清除累積狀態', () => {
    let state = start();
    expect(elapsedTime(state, 4000)).toBe(3000);
    state = gameReducer(state, { type: 'select', id: state.question!.correctOptionId });
    state = gameReducer(state, { type: 'confirm', now: 4000 });
    expect(elapsedTime(state, 9000)).toBe(3000);
    expect(gameReducer(state, { type: 'reset' })).toEqual(initialGame);
    expect(start().elapsedMs).toBe(0);
    expect(start().answers).toHaveLength(0);
  });
  it('同級連對兩題升級，答錯降級，完成八題停止計時', () => {
    let state = start();
    for (let index = 0; index < ROUND_LENGTH; index++) {
      state = gameReducer(state, { type: 'select', id: state.question!.correctOptionId });
      state = gameReducer(state, { type: 'confirm', now: (index + 2) * 1000 });
      if (index === 1) expect(nextDifficulty(state)).toBe('medium');
      const next = createQuestion(nextDifficulty(state), `q${index + 2}`);
      state = gameReducer(state, { type: 'next', question: next, now: (index + 2) * 1000 });
    }
    expect(state.phase).toBe('complete');
    expect(state.answers).toHaveLength(8);
    expect(elapsedTime(state, 999999)).toBe(8000);
    expect(gameReducer(state, { type: 'next', question: null, now: 999999 })).toBe(state);
    const hard = gameReducer(initialGame, { type: 'start', question: createQuestion('hard', 'hard'), adaptive: true, now: 0, sessionId: 'hard' });
    const selected = gameReducer(hard, { type: 'select', id: hard.question!.options.find((option) => option.id !== hard.question!.correctOptionId)!.id });
    const wrong = gameReducer(selected, { type: 'confirm', now: 1000 });
    expect(nextDifficulty(wrong)).toBe('medium');
    expect(nextDifficulty({ ...wrong, adaptive: false })).toBe('hard');
  });
});
