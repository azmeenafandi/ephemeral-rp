import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StreamingMessage from '../StreamingMessage';

describe('StreamingMessage thinking indicator', () => {
  it('shows an explicit thinking indicator while no content has arrived', () => {
    render(<StreamingMessage content="" />);

    expect(screen.getByText(/thinking/i)).toBeInTheDocument();
  });

  it('transitions from the thinking indicator to streamed content', () => {
    const { rerender } = render(<StreamingMessage content="" />);
    expect(screen.getByText(/thinking/i)).toBeInTheDocument();

    rerender(<StreamingMessage content="Hello there" />);
    expect(screen.queryByText(/thinking/i)).toBeNull();
    expect(screen.getByText('Hello there')).toBeInTheDocument();
  });

  it('renders content without the thinking indicator once a delta arrives', () => {
    render(<StreamingMessage content="Partial answer" />);

    expect(screen.queryByText(/thinking/i)).toBeNull();
    expect(screen.getByText('Partial answer')).toBeInTheDocument();
  });
});
