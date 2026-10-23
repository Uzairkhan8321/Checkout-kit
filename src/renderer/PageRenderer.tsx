import { Fragment, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { collectFields, pageBrand, validateFieldNode } from './fields';
import { defaultRegistry, type NodeRenderer, type Registry, type RenderContext } from './registry';
import type { FormErrors, FormValues, PageNode, PageSchema } from './types';

export interface PageRendererProps {
  schema: PageSchema;
  /** Called only when every field is valid. May be async; the submit button shows a busy state until it settles. */
  onSubmit?: (values: FormValues) => void | Promise<void>;
  /** Override or extend how individual node types are rendered. */
  registry?: Partial<Registry>;
}

export function PageRenderer({ schema, onSubmit, registry }: PageRendererProps) {
  const fields = useMemo(() => collectFields(schema.root), [schema]);
  const renderers = useMemo<Registry>(() => ({ ...defaultRegistry, ...registry }), [registry]);

  const emptyValues = useMemo<FormValues>(
    () => Object.fromEntries(fields.map((f) => [f.id, ''])),
    [fields],
  );

  const [values, setValues] = useState<FormValues>(emptyValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const brand = pageBrand(fields, values);

  const errorFor = (id: string, nextValues: FormValues): string | null => {
    const field = fields.find((f) => f.id === id);
    if (!field) return null;
    return validateFieldNode(field, nextValues[id] ?? '', pageBrand(fields, nextValues));
  };

  const ctx: RenderContext = {
    values,
    errors,
    brand,
    submitting,
    setValue: (id, value) => {
      const next = { ...values, [id]: value };
      setValues(next);
      // Once a field has shown an error, clear it as soon as the user fixes it.
      if (errors[id]) setErrors((prev) => ({ ...prev, [id]: errorFor(id, next) }));
    },
    blurField: (id) => setErrors((prev) => ({ ...prev, [id]: errorFor(id, values) })),
    reset: () => {
      setValues(emptyValues);
      setErrors({});
      setStatus('');
    },
  };

  const renderNode = (node: PageNode): ReactNode => {
    const render = renderers[node.type] as unknown as NodeRenderer<PageNode>;
    return <Fragment key={node.id}>{render(node, ctx, renderNode)}</Fragment>;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const nextErrors: FormErrors = {};
    for (const field of fields) nextErrors[field.id] = errorFor(field.id, values);
    setErrors(nextErrors);

    const invalid = fields.filter((f) => nextErrors[f.id]);
    if (invalid.length > 0) {
      setStatus(`${invalid.length} ${invalid.length === 1 ? 'field needs' : 'fields need'} attention`);
      document.getElementById(invalid[0].id)?.focus();
      return;
    }

    setStatus('');
    setSubmitting(true);
    try {
      await onSubmit?.(values);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit}>
      {renderNode(schema.root)}
      {/* Announces the failed-submit summary to screen readers. */}
      <p role="status" className="ck-sr-only">
        {status}
      </p>
    </form>
  );
}
