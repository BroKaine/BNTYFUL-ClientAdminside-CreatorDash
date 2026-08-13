import { render } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it, vi } from 'vitest';
import { ImportLanding } from './ImportLanding';

describe('ImportLanding accessibility', () => {
  it('has no automatically detectable WCAG A/AA violations', async () => {
    const { container } = render(<ImportLanding mode="creator" onModeChange={vi.fn()} onFile={vi.fn()} />);
    const result = await axe.run(container, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'], rules: { 'color-contrast': { enabled: false } } });
    expect(result.violations).toEqual([]);
  });
});
