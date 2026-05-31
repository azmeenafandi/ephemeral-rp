import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Header from '../Header';
import { useApiKeyStore } from '../../stores/apiKeyStore';
import { useUIStore } from '../../stores/uiStore';

describe('Header', () => {
  it('renders the app name', () => {
    render(<Header onToggleSidebar={() => {}} />);
    expect(screen.getByText('Private AI Roleplay')).toBeDefined();
  });

  it('renders the model badge', () => {
    render(<Header onToggleSidebar={() => {}} />);
    expect(screen.getByText('deepseek-v4-flash')).toBeDefined();
  });

  it('shows "No API key" when no key is set', () => {
    useApiKeyStore.setState({ apiKey: null });
    render(<Header onToggleSidebar={() => {}} />);
    expect(screen.getByText('No API key')).toBeDefined();
  });

  it('shows "Key set" when API key is present', () => {
    useApiKeyStore.setState({ apiKey: 'sk-test-key' });
    render(<Header onToggleSidebar={() => {}} />);
    expect(screen.getByText('Key set')).toBeDefined();
  });

  it('has a settings button', () => {
    render(<Header onToggleSidebar={() => {}} />);
    expect(screen.getByLabelText('Settings')).toBeDefined();
  });

  it('has a sidebar toggle button', () => {
    render(<Header onToggleSidebar={() => {}} />);
    expect(screen.getByLabelText('Toggle sidebar')).toBeDefined();
  });
});
