import test from 'node:test';
import assert from 'node:assert/strict';
import { validateOutcome } from '../lib/outcome.js';

test('won requires positive closed value and normalizes money', () => {
  assert.deepEqual(validateOutcome({ outcome: 'won', quoted_value: '7200', closed_value: '6500.129', reason: 'Installed' }), {
    ok: true, outcome: 'won', quoted_value: 7200, closed_value: 6500.13, reason: 'Installed'
  });
  assert.equal(validateOutcome({ outcome: 'won' }).ok, false);
  assert.equal(validateOutcome({ outcome: 'won', closed_value: 0 }).ok, false);
});

test('lost accepts reason without fabricated revenue', () => {
  assert.deepEqual(validateOutcome({ outcome: 'lost', quoted_value: 5000, reason: 'Customer postponed' }), {
    ok: true, outcome: 'lost', quoted_value: 5000, closed_value: null, reason: 'Customer postponed'
  });
});

test('rejects invalid outcome and negative values', () => {
  assert.equal(validateOutcome({ outcome: 'maybe' }).ok, false);
  assert.equal(validateOutcome({ outcome: 'lost', quoted_value: -1 }).ok, false);
});
