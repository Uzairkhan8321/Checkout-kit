import axe from 'axe-core';

/**
 * Runs axe-core against a rendered container and fails with a readable
 * message listing each violation.
 *
 * Disabled rules, and why:
 * - color-contrast: jsdom has no layout/paint engine, so axe cannot compute it.
 *   Contrast is handled by the design tokens instead.
 * - region: only meaningful for full pages, not isolated components.
 */
export async function expectNoA11yViolations(container: HTMLElement): Promise<void> {
  const results = await axe.run(container, {
    rules: {
      'color-contrast': { enabled: false },
      region: { enabled: false },
    },
  });

  if (results.violations.length > 0) {
    const message = results.violations
      .map((v) => `- ${v.id}: ${v.help}\n    ${v.nodes.map((n) => n.html).join('\n    ')}`)
      .join('\n');
    throw new Error(`Found ${results.violations.length} accessibility violation(s):\n${message}`);
  }
}
