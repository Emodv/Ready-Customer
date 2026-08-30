import test from 'node:test';
import assert from 'node:assert/strict';
import { validEmail, validPhone, normalizeLead, scoreLead, qualifyLead } from '../lib/validate.js';
import { parseCad } from '../lib/money.js';

test('validates contact details', () => {
  assert.equal(validEmail('buyer@example.ca'), true);
  assert.equal(validPhone('416-555-1234'), true);
});

test('parseCad accepts common CAD inputs', () => {
  assert.equal(parseCad('$8,000'), 8000);
  assert.equal(parseCad('8k'), 8000);
  assert.equal(parseCad('8000'), 8000);
  assert.equal(parseCad('8,000 CAD'), 8000);
});

test('strong flooring GTA immediate $8k lead scores >= 70 and qualifies', () => {
  const lead = normalizeLead({ name:'A', email:'a@example.ca', phone:'4165551234', service:'Flooring', location:'Markham, ON', timeline:'Immediately', budget_cad:8000, details:'Need about 900 square feet of engineered hardwood installed in our main floor this month.', consent:true });
  assert.ok(scoreLead(lead) >= 70);
  const result = qualifyLead(lead);
  assert.equal(result.qualified, true);
});

test('researching with no budget does not qualify', () => {
  const lead = normalizeLead({ name:'A', email:'a@example.ca', phone:'4165551234', service:'Flooring', location:'Toronto', timeline:'Just researching', details:'We may replace our flooring later this year and are currently exploring options.', consent:true });
  const result = qualifyLead(lead);
  assert.equal(result.qualified, false);
  assert.equal(result.disqualify_reason, 'timeline_too_far');
});
