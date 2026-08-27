import test from "node:test";
import assert from "node:assert/strict";
import { validEmail, validPhone, normalizeLead, scoreLead } from "../lib/validate.js";

test("validates contact details", () => {
  assert.equal(validEmail("buyer@example.ca"), true);
  assert.equal(validPhone("416-555-1234"), true);
});

test("scores strong lead above qualification threshold", () => {
  const lead = normalizeLead({name:"A", email:"a@example.ca", phone:"4165551234", service:"Flooring", location:"Markham", timeline:"Immediately", budget:"$8,000", details:"Need 900 square feet of hardwood installed within the next few weeks.", consent:true});
  assert.ok(scoreLead(lead) >= 75);
});
