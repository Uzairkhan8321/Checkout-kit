import { NODE_TYPES, type PageSchema } from './types';

export type SchemaValidation =
  | { valid: true; schema: PageSchema; errors: [] }
  | { valid: false; errors: string[] };

const MAX_DEPTH = 12;
const GAPS = ['sm', 'md', 'lg'];
const TONES = ['info', 'success', 'warning', 'error'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Checks untrusted JSON before it reaches the renderer. Every problem is
 * reported with a path (for example `root.children[1].text`) so authors can
 * fix a bad page without guessing.
 */
export function validateSchema(input: unknown): SchemaValidation {
  const errors: string[] = [];
  const ids = new Set<string>();

  const isString = (v: unknown): v is string => typeof v === 'string' && v.length > 0;

  function requireString(node: Record<string, unknown>, key: string, path: string) {
    if (!isString(node[key])) errors.push(`${path}.${key} must be a non-empty string`);
  }

  function optionalOneOf(
    node: Record<string, unknown>,
    key: string,
    allowed: readonly unknown[],
    path: string,
  ) {
    if (node[key] !== undefined && !allowed.includes(node[key])) {
      errors.push(`${path}.${key} must be one of: ${allowed.join(', ')}`);
    }
  }

  function visit(node: unknown, path: string, depth: number) {
    if (depth > MAX_DEPTH) {
      errors.push(`${path} is nested deeper than ${MAX_DEPTH} levels`);
      return;
    }
    if (!isRecord(node)) {
      errors.push(`${path} must be an object`);
      return;
    }

    if (!isString(node.id)) {
      errors.push(`${path}.id must be a non-empty string`);
    } else if (ids.has(node.id)) {
      errors.push(`${path}.id "${node.id}" is used more than once`);
    } else {
      ids.add(node.id);
    }

    const type = node.type;
    if (typeof type !== 'string' || !(NODE_TYPES as readonly string[]).includes(type)) {
      errors.push(`${path}.type "${String(type)}" is not a known node type`);
      return;
    }

    switch (type) {
      case 'stack':
        optionalOneOf(node, 'direction', ['column', 'row'], path);
        optionalOneOf(node, 'gap', GAPS, path);
        if (!Array.isArray(node.children)) {
          errors.push(`${path}.children must be an array`);
        } else {
          node.children.forEach((child, i) => visit(child, `${path}.children[${i}]`, depth + 1));
        }
        break;
      case 'heading':
        requireString(node, 'text', path);
        optionalOneOf(node, 'level', [1, 2, 3], path);
        break;
      case 'text':
        requireString(node, 'text', path);
        optionalOneOf(node, 'tone', ['default', 'muted'], path);
        break;
      case 'alert':
        requireString(node, 'text', path);
        optionalOneOf(node, 'tone', TONES, path);
        break;
      case 'summary':
        if (!Array.isArray(node.rows)) {
          errors.push(`${path}.rows must be an array`);
        } else {
          node.rows.forEach((row, i) => {
            const rowPath = `${path}.rows[${i}]`;
            if (!isRecord(row)) {
              errors.push(`${rowPath} must be an object`);
              return;
            }
            requireString(row, 'label', rowPath);
            requireString(row, 'value', rowPath);
          });
        }
        break;
      case 'textField':
        requireString(node, 'label', path);
        break;
      case 'button':
        requireString(node, 'label', path);
        if (node.action !== 'submit' && node.action !== 'reset') {
          errors.push(`${path}.action must be "submit" or "reset"`);
        }
        optionalOneOf(node, 'variant', ['primary', 'secondary'], path);
        break;
      default:
        break; // cardNumber, expiry, cvv, upiId need nothing beyond id and type
    }
  }

  if (!isRecord(input)) {
    return { valid: false, errors: ['Schema must be a JSON object'] };
  }
  if (input.version !== 1) errors.push('version must be 1');
  if (input.root === undefined) {
    errors.push('root is required');
  } else {
    visit(input.root, 'root', 0);
  }

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, schema: input as unknown as PageSchema, errors: [] };
}
