import { useMemo, useState } from 'react';
import { Button } from './components';
import { presets } from './demo/schemas';
import { PageRenderer, collectFields, maskSensitive, validateSchema } from './renderer';
import type { SchemaValidation } from './renderer';

const pretty = (value: unknown) => JSON.stringify(value, null, 2);

export default function App() {
  const [text, setText] = useState(() => pretty(presets[0].schema));
  const [submitted, setSubmitted] = useState<string | null>(null);

  const parsed = useMemo<SchemaValidation>(() => {
    try {
      return validateSchema(JSON.parse(text));
    } catch (error) {
      return { valid: false, errors: [`Invalid JSON: ${(error as Error).message}`] };
    }
  }, [text]);

  const loadPreset = (index: number) => {
    setText(pretty(presets[index].schema));
    setSubmitted(null);
  };

  return (
    <main className="demo">
      <section className="demo__panel" aria-label="Rendered page">
        {parsed.valid ? (
          <PageRenderer
            // Remount when the schema changes so stale field values never leak across pages.
            key={text}
            schema={parsed.schema}
            onSubmit={async (values) => {
              // Stand-in for a real payment call.
              await new Promise((resolve) => setTimeout(resolve, 700));
              const masked = maskSensitive(collectFields(parsed.schema.root), values);
              setSubmitted(pretty(masked));
            }}
          />
        ) : (
          <div className="ck-alert ck-alert--error" role="alert">
            <p className="ck-alert__title">This schema can't be rendered yet</p>
            <ul>
              {parsed.errors.slice(0, 5).map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        {submitted ? (
          <>
            <h2>Submitted (sensitive values masked)</h2>
            <pre className="demo__output">{submitted}</pre>
          </>
        ) : null}
      </section>

      <section className="demo__panel" aria-label="Schema editor">
        <h2 className="ck-heading">Page schema (edit me)</h2>
        <p className="ck-text ck-text--muted">
          The page on the left is rendered from this JSON. Change a label, add a field or break
          something, and it updates live.
        </p>
        <div className="demo__presets">
          {presets.map((preset, index) => (
            <Button key={preset.name} variant="secondary" onClick={() => loadPreset(index)}>
              {preset.name}
            </Button>
          ))}
        </div>
        <label className="ck-sr-only" htmlFor="schema-editor">
          Page schema JSON
        </label>
        <textarea
          id="schema-editor"
          className="demo__editor"
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
        />
      </section>
    </main>
  );
}
