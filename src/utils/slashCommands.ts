export type SlashCommand =
  | { type: 'ooc-add'; text: string }
  | { type: 'ooc-panel' }
  | null;

export function parseSlashCommand(input: string): SlashCommand {
  const trimmed = input.trim();

  // Exact match: "/ooc" alone — open panel
  if (trimmed === '/ooc') return { type: 'ooc-panel' };

  // "/ooc <text>" — add directive
  const oocMatch = trimmed.match(/^\/ooc\s+(.+)$/);
  if (oocMatch) return { type: 'ooc-add', text: oocMatch[1].trim() };

  // Backward compat: "OOC: <text>" — treat as /ooc add
  const legacyMatch = trimmed.match(/^OOC:\s*(.+)$/i);
  if (legacyMatch) return { type: 'ooc-add', text: legacyMatch[1].trim() };

  return null;
}
