import test from 'node:test';
import assert from 'node:assert/strict';
import { matchLeadToBuyers, pickFee, pickNextBuyer } from '../lib/match.js';

test('match ranks approved GTA flooring buyer over paused/non-geo', () => {
  const lead = { service_slug:'flooring', geo_normalized:'markham', location:'Markham', budget_cad:8000 };
  const buyers = [
    { id:'paused', status:'paused', service_slug:'flooring', geo_tokens:['markham'], max_cac_cad:999, exclusive:true, priority:1 },
    { id:'wronggeo', status:'approved', service_slug:'flooring', geo_tokens:['oakville'], max_cac_cad:500, exclusive:true, priority:1 },
    { id:'good', status:'approved', service_slug:'flooring', geo_tokens:['markham'], max_cac_cad:300, max_cpl_cad:180, exclusive:true, priority:10 }
  ];
  const ranked = matchLeadToBuyers(lead, buyers);
  assert.equal(ranked[0].id, 'good');
  assert.equal(ranked.length, 1);
});

test('expiry routing picks second buyer after first was attempted', () => {
  const lead = { service_slug:'flooring', geo_normalized:'markham', location:'Markham', budget_cad:8000 };
  const buyers = [
    { id:'first', status:'approved', service_slug:'flooring', geo_tokens:['markham'], max_cpl_cad:200, exclusive:true, priority:1 },
    { id:'second', status:'approved', service_slug:'flooring', geo_tokens:['markham'], max_cpl_cad:150, exclusive:true, priority:2 }
  ];
  const ranked = matchLeadToBuyers(lead, buyers);
  assert.equal(pickNextBuyer(ranked, ['first']).id, 'second');
});

test('flooring fee is floored at 75 and capped at 250', () => {
  assert.equal(pickFee({ max_cpl_cad: 40 }, { service_slug:'flooring' }), 75);
  assert.equal(pickFee({ max_cpl_cad: 500 }, { service_slug:'flooring' }), 250);
});
