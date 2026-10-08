import { describe, it, expect } from 'vitest';
import { parseSlashCommand, OOC_PARSE_ERROR_MESSAGE } from '../slashCommands';

describe('parseSlashCommand', () => {
  describe('ooc-panel', () => {
    it('opens the panel for "/ooc"', () => {
      expect(parseSlashCommand('/ooc')).toEqual({ type: 'ooc-panel' });
    });

    it('opens the panel for "/OOC" (case-insensitive)', () => {
      expect(parseSlashCommand('/OOC')).toEqual({ type: 'ooc-panel' });
    });

    it('opens the panel for "/ooc " with trailing whitespace', () => {
      expect(parseSlashCommand('/ooc ')).toEqual({ type: 'ooc-panel' });
    });
  });

  describe('ooc-add', () => {
    it('parses "/ooc <text>"', () => {
      expect(parseSlashCommand('/ooc Be more sarcastic')).toEqual({
        type: 'ooc-add',
        text: 'Be more sarcastic',
      });
    });

    it('parses "/OOC <text>" (case-insensitive)', () => {
      expect(parseSlashCommand('/OOC Be more sarcastic')).toEqual({
        type: 'ooc-add',
        text: 'Be more sarcastic',
      });
    });

    it('parses "/Ooc <text>" (mixed case)', () => {
      expect(parseSlashCommand('/Ooc Be more sarcastic')).toEqual({
        type: 'ooc-add',
        text: 'Be more sarcastic',
      });
    });

    it('parses "/ooc: <text>" (optional colon)', () => {
      expect(parseSlashCommand('/ooc: with colon')).toEqual({
        type: 'ooc-add',
        text: 'with colon',
      });
    });

    it('parses legacy "OOC: <text>"', () => {
      expect(parseSlashCommand('OOC: legacy form')).toEqual({
        type: 'ooc-add',
        text: 'legacy form',
      });
    });

    it('trims surrounding whitespace from the directive text', () => {
      expect(parseSlashCommand('  /ooc   spaced text   ')).toEqual({
        type: 'ooc-add',
        text: 'spaced text',
      });
    });
  });

  describe('ooc-error (near-misses must fail loudly)', () => {
    const errorCases: Array<[string, string]> = [
      ['/oocno-space', 'no whitespace after /ooc'],
      ['/OOCno-space', 'no whitespace, uppercase'],
      ['/ooc:no-space', 'colon but no whitespace'],
      ['/ooc:', 'colon with no text'],
      ['/ooc line one\nline two', 'multi-line directive'],
      ['/ooc\nline two', 'newline directly after /ooc'],
      ['/oocfoo bar', 'unknown suffix'],
    ];

    it.each(errorCases)('returns ooc-error for %j (%s)', (input) => {
      const result = parseSlashCommand(input);
      expect(result).toEqual({ type: 'ooc-error', message: OOC_PARSE_ERROR_MESSAGE });
    });

    it('includes a helpful, non-empty user-facing message', () => {
      const result = parseSlashCommand('/oocno-space');
      expect(result?.type).toBe('ooc-error');
      if (result?.type === 'ooc-error') {
        expect(result.message.length).toBeGreaterThan(0);
        expect(result.message).toMatch(/\/ooc/);
      }
    });
  });

  describe('null (ordinary chat messages)', () => {
    it('returns null for an ordinary message', () => {
      expect(parseSlashCommand('Hello, how are you?')).toBeNull();
    });

    it('returns null when "/ooc" appears mid-message', () => {
      expect(parseSlashCommand('I typed /ooc in the middle')).toBeNull();
    });

    it('returns null for a different slash command', () => {
      expect(parseSlashCommand('/help')).toBeNull();
    });

    it('returns null for an empty string', () => {
      expect(parseSlashCommand('   ')).toBeNull();
    });
  });
});
