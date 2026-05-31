import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmptyState from '../EmptyState';

describe('EmptyState', () => {
  it('renders the app title', () => {
    render(<EmptyState />);
    expect(screen.getByText('Private AI Roleplay')).toBeDefined();
  });

  it('shows privacy features', () => {
    render(<EmptyState />);
    expect(screen.getByText(/No server storage/)).toBeDefined();
    expect(screen.getByText(/Your API key, your control/)).toBeDefined();
    expect(screen.getByText(/Export your sessions/)).toBeDefined();
    expect(screen.getByText(/Dark mode always/)).toBeDefined();
  });
});
