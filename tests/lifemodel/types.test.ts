import { describe, it, expect } from 'vitest';
import { LIFE_AREAS, emptyLifeModel } from '@/lib/lifemodel/types';

describe('emptyLifeModel', () => {
  it('has an empty profile and all five areas', () => {
    const model = emptyLifeModel();
    expect(model.profile).toEqual({ identity: '', personality: '', coachingStyle: '' });
    expect(Object.keys(model.areas).sort()).toEqual([...LIFE_AREAS].sort());
    for (const area of LIFE_AREAS) {
      expect(model.areas[area]).toEqual({ status: '', summary: '', goals: [], threads: [] });
    }
  });

  it('returns independent copies (no shared references)', () => {
    const a = emptyLifeModel();
    const b = emptyLifeModel();
    a.areas.career.goals.push({ id: 'x', text: 'test', targetDate: null, status: 'active' });
    expect(b.areas.career.goals).toEqual([]);
  });
});
