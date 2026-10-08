import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MessageComposer from '../MessageComposer';
import { useApiKeyStore } from '../../stores/apiKeyStore';
import { useChatStore } from '../../stores/chatStore';
import { useUIStore } from '../../stores/uiStore';
import { OOC_PARSE_ERROR_MESSAGE } from '../../utils/slashCommands';

describe('MessageComposer OOC handling', () => {
  const sendMessage = vi.fn();
  const addOocInstruction = vi.fn();

  beforeEach(() => {
    sendMessage.mockClear();
    addOocInstruction.mockClear();
    useApiKeyStore.setState({ apiKey: 'sk-test' });
    useChatStore.setState({
      sendMessage,
      addOocInstruction,
      isStreaming: false,
      editingMessageId: null,
      editingContent: null,
      oocInstructions: [],
    });
    useUIStore.setState({ oocPanelOpen: false });
  });

  const getInput = () =>
    screen.getByPlaceholderText(/Type your message/) as HTMLTextAreaElement;

  it('does not send a multi-line /ooc near-miss and keeps the text in place', () => {
    render(<MessageComposer />);
    const textarea = getInput();

    fireEvent.change(textarea, { target: { value: '/ooc line one\nline two' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(sendMessage).not.toHaveBeenCalled();
    expect(addOocInstruction).not.toHaveBeenCalled();
    expect(screen.getByText(OOC_PARSE_ERROR_MESSAGE)).toBeDefined();
    expect(textarea.value).toBe('/ooc line one\nline two');
  });

  it('does not send a no-space /ooc near-miss', () => {
    render(<MessageComposer />);
    const textarea = getInput();

    fireEvent.change(textarea, { target: { value: '/oocno-space' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(sendMessage).not.toHaveBeenCalled();
    expect(addOocInstruction).not.toHaveBeenCalled();
    expect(screen.getByText(OOC_PARSE_ERROR_MESSAGE)).toBeDefined();
    expect(textarea.value).toBe('/oocno-space');
  });

  it('adds an ooc directive for a valid "/ooc x" without sending a message', () => {
    render(<MessageComposer />);
    const textarea = getInput();

    fireEvent.change(textarea, { target: { value: '/ooc x' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(addOocInstruction).toHaveBeenCalledWith('x');
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('still sends an ordinary message normally', () => {
    render(<MessageComposer />);
    const textarea = getInput();

    fireEvent.change(textarea, { target: { value: 'Hello there' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith('Hello there', 'sk-test', expect.any(String));
  });
});
