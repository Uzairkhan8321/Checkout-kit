import type { ReactNode } from 'react';
import {
  Alert,
  Button,
  CardNumberField,
  CvvField,
  ExpiryField,
  TextField,
  UpiIdField,
} from '../components';
import type { CardBrand } from '../lib/validators';
import type { FormErrors, FormValues, PageNode } from './types';

/** Everything a node renderer may need from the page it lives in. */
export interface RenderContext {
  values: FormValues;
  errors: FormErrors;
  brand: CardBrand;
  submitting: boolean;
  setValue: (id: string, value: string) => void;
  blurField: (id: string) => void;
  reset: () => void;
}

export type RenderChild = (node: PageNode) => ReactNode;

export type NodeRenderer<N extends PageNode> = (
  node: N,
  ctx: RenderContext,
  renderChild: RenderChild,
) => ReactNode;

/** One renderer per node type. TypeScript enforces that none is missing. */
export type Registry = { [K in PageNode['type']]: NodeRenderer<Extract<PageNode, { type: K }>> };

function fieldProps(id: string, ctx: RenderContext, hint?: string) {
  return {
    id,
    hint,
    value: ctx.values[id] ?? '',
    error: ctx.errors[id],
    onChange: (value: string) => ctx.setValue(id, value),
    onBlur: () => ctx.blurField(id),
  };
}

export const defaultRegistry: Registry = {
  stack: (node, _ctx, renderChild) => (
    <div
      className={`ck-stack ck-stack--${node.direction ?? 'column'} ck-gap-${node.gap ?? 'md'}`}
    >
      {node.children.map(renderChild)}
    </div>
  ),

  heading: (node) => {
    const Tag = `h${node.level ?? 2}` as 'h1' | 'h2' | 'h3';
    return <Tag className="ck-heading">{node.text}</Tag>;
  },

  text: (node) => (
    <p className={`ck-text${node.tone === 'muted' ? ' ck-text--muted' : ''}`}>{node.text}</p>
  ),

  alert: (node) => (
    <Alert tone={node.tone} title={node.title}>
      {node.text}
    </Alert>
  ),

  summary: (node) => (
    <dl className="ck-summary">
      {node.rows.map((row) => (
        <div
          key={row.label}
          className={`ck-summary__row${row.emphasis ? ' ck-summary__row--emphasis' : ''}`}
        >
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  ),

  textField: (node, ctx) => (
    <TextField
      {...fieldProps(node.id, ctx, node.hint)}
      label={node.label}
      required={node.required}
      autoComplete={node.autoComplete}
    />
  ),

  cardNumber: (node, ctx) => (
    <CardNumberField {...fieldProps(node.id, ctx, node.hint)} label={node.label} />
  ),

  expiry: (node, ctx) => (
    <ExpiryField {...fieldProps(node.id, ctx, node.hint)} label={node.label} />
  ),

  cvv: (node, ctx) => (
    <CvvField {...fieldProps(node.id, ctx, node.hint)} label={node.label} brand={ctx.brand} />
  ),

  upiId: (node, ctx) => (
    <UpiIdField {...fieldProps(node.id, ctx, node.hint)} label={node.label} />
  ),

  button: (node, ctx) => (
    <Button
      variant={node.variant}
      fullWidth={node.fullWidth}
      type={node.action === 'submit' ? 'submit' : 'button'}
      loading={node.action === 'submit' && ctx.submitting}
      onClick={node.action === 'reset' ? ctx.reset : undefined}
    >
      {node.label}
    </Button>
  ),
};
