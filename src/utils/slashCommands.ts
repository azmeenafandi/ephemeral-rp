export type SlashCommand =
  | { type: 'ooc-add'; text: string }
  | { type: 'ooc-panel' }
  | { type: 'ooc-error'; message: string }
  | null;

/**
 * Shown when an input looks like an `/ooc` directive attempt but does not match
 * any supported form. This must never be silently sent as a normal chat message.
 */
export const OOC_PARSE_ERROR_MESSAGE =
  'Could not parse that OOC command. Use "/ooc <text>" to add a directive or "/ooc" to open the OOC panel. Directives must fit on a single line.';

export function parseSlashCommand(input: string): SlashCommand {
  const trimmed = input.trim();

  // Exact match: "/ooc" alone (any case) — open panel.
  if (trimmed.toLowerCase() === '/ooc') return { type: 'ooc-panel' };

  // "/ooc <text>" or "/ooc: <text>" (any case) — add directive.
  // The text is deliberately single-line: `.` does not match `\n`, and the
  // separator only accepts spaces/tabs, so multi-line input falls through to
  // the error branch below rather than being partially parsed.
  const oocMatch = trimmed.match(/^\/ooc:?[ \t]+(.+)$/i);
  if (oocMatch) return { type: 'ooc-add', text: oocMatch[1].trim() };

  // Backward compat: "OOC: <text>" — treat as /ooc add.
  const legacyMatch = trimmed.match(/^OOC:\s*(.+)$/i);
  if (legacyMatch) return { type: 'ooc-add', text: legacyMatch[1].trim() };

  // Near-miss: anything starting with "/ooc" (any case) that did not match
  // above must fail loudly instead of being sent as a normal chat message.
  if (trimmed.toLowerCase().startsWith('/ooc')) {
    return { type: 'ooc-error', message: OOC_PARSE_ERROR_MESSAGE };
  }

  return null;
}
