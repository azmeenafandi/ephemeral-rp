import type { Character } from '../types/character';
import { buildSystemPromptFromParts } from '../utils/promptBuilder';
import { parseTemplate, type TemplateData } from '../utils/templateParser';

// Import all template files at build time
const templateModules = import.meta.glob('./templates/*.md', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>;

export async function loadBuiltInCharacters(): Promise<Character[]> {
  const characters: Character[] = [];

  // Sort entries by path for deterministic order
  const sorted = Object.entries(templateModules).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  for (const [path, loader] of sorted) {
    const raw = await loader();
    const data = parseTemplate(raw);

    // Generate a stable ID from the filename
    const filename = path.split('/').pop()?.replace('.md', '') ?? 'character';
    const id = `builtin-${filename}`;

    // Build system prompt from parts (same as custom character flow)
    const systemPrompt = buildSystemPromptFromParts(
      data.name,
      data.description,
      data.personality,
      data.scenario,
      data.voiceHints,
      data.rules,
    );

    characters.push({
      id,
      name: data.name,
      description: data.description,
      personality: data.personality,
      scenario: data.scenario,
      systemPrompt,
      greeting: data.greeting,
      isBuiltIn: true,
    });
  }

  return characters;
}
