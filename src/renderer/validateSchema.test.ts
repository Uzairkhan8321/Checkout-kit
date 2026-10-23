import { describe, expect, it } from 'vitest';
import { cardCheckout, upiCheckout } from '../demo/schemas';
import { validateSchema } from './validateSchema';

describe('validateSchema', () => {
  it('accepts the bundled demo schemas', () => {
    expect(validateSchema(cardCheckout).valid).toBe(true);
    expect(validateSchema(upiCheckout).valid).toBe(true);
  });

  it('rejects non-objects', () => {
    expect(validateSchema(null).valid).toBe(false);
    expect(validateSchema('nope').valid).toBe(false);
    expect(validateSchema([]).valid).toBe(false);
  });

  it('requires version 1 and a root', () => {
    const result = validateSchema({ version: 2 });
    expect(result.errors).toContain('version must be 1');
    expect(result.errors).toContain('root is required');
  });

  it('reports unknown node types with their path', () => {
    const result = validateSchema({
      version: 1,
      root: { id: 'page', type: 'stack', children: [{ id: 'x', type: 'carousel' }] },
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(['root.children[0].type "carousel" is not a known node type']);
  });

  it('rejects duplicate ids, since ids are field names', () => {
    const result = validateSchema({
      version: 1,
      root: {
        id: 'page',
        type: 'stack',
        children: [
          { id: 'dup', type: 'cardNumber' },
          { id: 'dup', type: 'expiry' },
        ],
      },
    });
    expect(result.errors).toEqual(['root.children[1].id "dup" is used more than once']);
  });

  it('checks required props per node type', () => {
    const result = validateSchema({
      version: 1,
      root: {
        id: 'page',
        type: 'stack',
        children: [
          { id: 'h', type: 'heading' },
          { id: 'b', type: 'button', label: 'Pay', action: 'explode' },
          { id: 't', type: 'textField' },
          { id: 's', type: 'summary', rows: [{ label: 'Total' }] },
        ],
      },
    });
    expect(result.errors).toEqual([
      'root.children[0].text must be a non-empty string',
      'root.children[1].action must be "submit" or "reset"',
      'root.children[2].label must be a non-empty string',
      'root.children[3].rows[0].value must be a non-empty string',
    ]);
  });

  it('validates enum props', () => {
    const result = validateSchema({
      version: 1,
      root: { id: 'page', type: 'stack', gap: 'huge', children: [] },
    });
    expect(result.errors).toEqual(['root.gap must be one of: sm, md, lg']);
  });

  it('stops at a maximum nesting depth', () => {
    let node: Record<string, unknown> = { id: 'leaf', type: 'text', text: 'hi' };
    for (let i = 0; i < 20; i++) node = { id: `s${i}`, type: 'stack', children: [node] };
    const result = validateSchema({ version: 1, root: node });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('nested deeper'))).toBe(true);
  });
});
