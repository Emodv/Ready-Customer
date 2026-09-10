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
  assert.equal(qualifyLead(lead).qualified, true);
});

test('strong commercial landscaping lead can qualify independently of flooring', () => {
  const lead = normalizeLead({ name:'A', email:'a@example.ca', phone:'4165551234', service:'Commercial landscaping', location:'Toronto', timeline:'ASAP', budget_cad:10000, details:'Need recurring grounds maintenance for a commercial property starting this month.', consent:true });
  assert.equal(lead.service_slug, 'commercial-landscaping');
  assert.equal(qualifyLead(lead).qualified, true);
});

test('strong marketing lead can qualify independently of flooring', () => {
  const lead = normalizeLead({ name:'A', email:'a@example.ca', phone:'4165551234', service:'Digital marketing', location:'Vaughan, ON', timeline:'This month', budget_cad:5000, details:'Need qualified lead generation and paid search management for our growing business.', consent:true });
  assert.equal(lead.service_slug, 'marketing');
  assert.equal(qualifyLead(lead).qualified, true);
});

test('unknown services are rejected deterministically', () => {
  const lead = normalizeLead({ name:'A', email:'a@example.ca', phone:'4165551234', service:'Underwater basket weaving', location:'Toronto', timeline:'Immediately', budget_cad:10000, details:'Need a specialist for a project with a clear scope and immediate start date.', consent:true });
  const result = qualifyLead(lead);
  assert.equal(result.qualified, false);
  assert.equal(result.disqualify_reason, 'unsupported_service');
});

test('researching with no budget does not qualify', () => {
  const lead = normalizeLead({ name:'A', email:'a@example.ca', phone:'4165551234', service:'Flooring', location:'Toronto', timeline:'Just researching', details:'We may replace our flooring later this year and are currently exploring options.', consent:true });
  const result = qualifyLead(lead);
  assert.equal(result.qualified, false);
  assert.equal(result.disqualify_reason, 'timeline_too_far');
});
