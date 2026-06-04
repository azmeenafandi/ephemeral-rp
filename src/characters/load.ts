import type { Character } from '../types/character';
import { buildSystemPromptFromParts } from '../utils/promptBuilder';

interface TemplateData {
  name: string;
  description: string;
  personality: string;
  scenario: string;
  greeting: string;
  voiceHints: string[];
  rules: string[];
}

function parseTemplate(markdown: string): TemplateData {
  // Split by ## headings
  const sections = markdown.split(/^## /m);

  // First section (before any ##) is the title + description
  const titleBlock = sections[0].trim();
  const titleMatch = titleBlock.match(/^# (.+)/);
  const name = titleMatch ? titleMatch[1].trim() : 'Unknown';
  const description = titleBlock.replace(/^# .+\n*/, '').trim();

  const result: Record<string, string> = {
    name,
    description,
    personality: '',
    scenario: '',
    greeting: '',
  };

  const voiceHints: string[] = [];
  const rules: string[] = [];

  for (let i = 1; i < sections.length; i++) {
    const block = sections[i];
    const newlineIdx = block.indexOf('\n');
    const heading = block.slice(0, newlineIdx).trim().toLowerCase();
    const content = block.slice(newlineIdx + 1).trim();

    if (heading === 'personality') {
      result.personality = content;
    } else if (heading === 'scenario') {
      result.scenario = content;
    } else if (heading === 'greeting') {
      result.greeting = content;
    } else if (heading === 'voice hints') {
      // Extract bullet points
      for (const line of content.split('\n')) {
        const trimmed = line.replace(/^[-*]\s*/, '').trim();
        if (trimmed) voiceHints.push(trimmed);
      }
    } else if (heading === 'rules') {
      for (const line of content.split('\n')) {
        const trimmed = line.replace(/^[-*]\s*/, '').trim();
        if (trimmed) rules.push(trimmed);
      }
    }
  }

  return {
    name: result.name,
    description: result.description,
    personality: result.personality,
    scenario: result.scenario,
    greeting: result.greeting,
    voiceHints,
    rules,
  };
}

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
