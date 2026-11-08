/// <reference types="node" />
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { policyMarkdown, PRIVACY_POLICY } from './privacy-policy';

const docPath = join(__dirname, '../../../../../docs/PRIVACY_POLICY.md');

describe('privacy policy', () => {
  it('matches the public web version in docs/PRIVACY_POLICY.md', () => {
    if (process.env.WRITE_POLICY) writeFileSync(docPath, policyMarkdown());
    expect(readFileSync(docPath, 'utf8')).toBe(policyMarkdown());
  });

  it('has no empty sections', () => {
    for (const s of PRIVACY_POLICY) {
      expect((s.paragraphs?.length ?? 0) + (s.bullets?.length ?? 0)).toBeGreaterThan(0);
    }
  });
});
