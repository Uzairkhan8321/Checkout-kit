import type { AlertTone } from '../components/Alert';

/**
 * A page is plain JSON: a tree of typed nodes. The renderer turns that tree
 * into accessible React components, so pages can be defined, validated,
 * stored and versioned as data instead of being hand-built per page.
 */

export type Gap = 'sm' | 'md' | 'lg';

interface NodeBase {
  /** Unique within the page. Also used as the form field name for fields. */
  id: string;
}

export interface StackNode extends NodeBase {
  type: 'stack';
  direction?: 'column' | 'row';
  gap?: Gap;
  children: PageNode[];
}

export interface HeadingNode extends NodeBase {
  type: 'heading';
  level?: 1 | 2 | 3;
  text: string;
}

export interface TextNode extends NodeBase {
  type: 'text';
  text: string;
  tone?: 'default' | 'muted';
}

export interface AlertNode extends NodeBase {
  type: 'alert';
  tone?: AlertTone;
  title?: string;
  text: string;
}

export interface SummaryRow {
  label: string;
  value: string;
  emphasis?: boolean;
}

export interface SummaryNode extends NodeBase {
  type: 'summary';
  rows: SummaryRow[];
}

interface FieldBase extends NodeBase {
  label?: string;
  hint?: string;
}

export interface TextFieldNode extends FieldBase {
  type: 'textField';
  label: string;
  required?: boolean;
  autoComplete?: string;
}

export interface CardNumberNode extends FieldBase {
  type: 'cardNumber';
}

export interface ExpiryNode extends FieldBase {
  type: 'expiry';
}

export interface CvvNode extends FieldBase {
  type: 'cvv';
}

export interface UpiIdNode extends FieldBase {
  type: 'upiId';
}

export interface ButtonNode extends NodeBase {
  type: 'button';
  label: string;
  variant?: 'primary' | 'secondary';
  action: 'submit' | 'reset';
  fullWidth?: boolean;
}

export type FieldNode = TextFieldNode | CardNumberNode | ExpiryNode | CvvNode | UpiIdNode;

export type PageNode =
  | StackNode
  | HeadingNode
  | TextNode
  | AlertNode
  | SummaryNode
  | FieldNode
  | ButtonNode;

export type NodeType = PageNode['type'];

export interface PageSchema {
  version: 1;
  root: PageNode;
}

export type FormValues = Record<string, string>;
export type FormErrors = Record<string, string | null>;

export const NODE_TYPES: readonly NodeType[] = [
  'stack',
  'heading',
  'text',
  'alert',
  'summary',
  'textField',
  'cardNumber',
  'expiry',
  'cvv',
  'upiId',
  'button',
];

export const FIELD_TYPES: readonly NodeType[] = [
  'textField',
  'cardNumber',
  'expiry',
  'cvv',
  'upiId',
];

export function isFieldNode(node: PageNode): node is FieldNode {
  return FIELD_TYPES.includes(node.type);
}
