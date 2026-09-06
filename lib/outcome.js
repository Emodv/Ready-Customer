export const OUTCOMES = ['won', 'lost'];

export function validateOutcome(input = {}) {
  const outcome = String(input.outcome || '').trim().toLowerCase();
  if (!OUTCOMES.includes(outcome)) return { ok: false, error: 'outcome must be won or lost' };

  const money = (value, field) => {
    if (value === undefined || value === null || value === '') return { value: null };
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return { error: `${field} must be a non-negative number` };
    return { value: Math.round(parsed * 100) / 100 };
  };

  const quoted = money(input.quoted_value, 'quoted_value');
  if (quoted.error) return { ok: false, error: quoted.error };
  const closed = money(input.closed_value, 'closed_value');
  if (closed.error) return { ok: false, error: closed.error };
  if (outcome === 'won' && (!closed.value || closed.value <= 0)) return { ok: false, error: 'closed_value is required for won outcomes' };

  const reason = input.reason ? String(input.reason).trim().slice(0, 500) : null;
  return { ok: true, outcome, quoted_value: quoted.value, closed_value: closed.value, reason };
}
