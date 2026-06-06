import { useState, useEffect, useMemo } from 'react';
import { useCharacterStore } from '../stores/characterStore';
import { useUIStore } from '../stores/uiStore';
import { useApiKeyStore } from '../stores/apiKeyStore';
import { buildSystemPromptFromParts } from '../utils/promptBuilder';
import { parseTemplate } from '../utils/templateParser';
import { API_BASE_URL } from '../config';
import type { Character } from '../types/character';

const emptyChar = {
  name: '',
  description: '',
  personality: '',
  scenario: '',
  greeting: '',
  voiceHints: [] as string[],
  rules: [] as string[],
};

async function autoGenerateFields(
  name: string,
  description: string,
  apiKey: string,
): Promise<Partial<typeof emptyChar>> {
  const prompt = `You are a character designer. Given a character name and description, output a complete character definition in exactly this Markdown format:

# Character Name
Brief description paragraph.

## Personality
Detailed personality traits.

## Scenario
The setting and context.

## Greeting
The character's opening line, 1-3 sentences.

## Voice Hints
- Speaks in a particular style
- Uses specific mannerisms
- Never does X or Y

## Rules
- Always remain in character
- Maintain continuity
- Stay within the scenario

Character to create:
Name: ${name}
Description: ${description}`;

  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    }),
  });

  if (!response.ok) throw new Error('Auto-generation failed');

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('No content in response');

  const parsed = parseTemplate(content);
  return {
    personality: parsed.personality,
    scenario: parsed.scenario,
    greeting: parsed.greeting,
    voiceHints: parsed.voiceHints,
    rules: parsed.rules,
  };
}

export default function CharacterEditor() {
  const isOpen = useUIStore((s) => s.characterEditorOpen);
  const editingId = useUIStore((s) => s.editingCharacterId);
  const closeEditor = useUIStore((s) => s.closeCharacterEditor);
  const createCharacter = useCharacterStore((s) => s.createCharacter);
  const editCharacter = useCharacterStore((s) => s.editCharacter);
  const deleteCharacter = useCharacterStore((s) => s.deleteCharacter);
  const customCharacters = useCharacterStore((s) => s.customCharacters);
  const selectedCharacter = useCharacterStore((s) => s.selectedCharacter);

  const existingChar = editingId ? customCharacters.find((c) => c.id === editingId) : null;
  const [form, setForm] = useState(emptyChar);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingChar) {
      // Try to recover voiceHints/rules from the existing systemPrompt
      // For legacy characters, these will be empty arrays
      setForm({
        name: existingChar.name,
        description: existingChar.description,
        personality: existingChar.personality,
        scenario: existingChar.scenario,
        greeting: existingChar.greeting,
        voiceHints: [],
        rules: [],
      });
    } else {
      setForm(emptyChar);
    }
    setError(null);
    setGenerating(false);
  }, [existingChar, isOpen]);

  const needsGeneration = useMemo(() => {
    return (
      !form.personality.trim() ||
      !form.scenario.trim() ||
      !form.greeting.trim() ||
      form.voiceHints.length === 0 ||
      form.rules.length === 0
    );
  }, [form.personality, form.scenario, form.greeting, form.voiceHints, form.rules]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!form.name.trim() || !form.description.trim() || !form.greeting.trim()) return;

    // Auto-generate missing fields if needed
    if (needsGeneration) {
      setGenerating(true);
      setError(null);
      try {
        const apiKey = useApiKeyStore.getState().apiKey;
        if (!apiKey) {
          setError('No API key configured. Please set your API key first.');
          setGenerating(false);
          return;
        }
        const generated = await autoGenerateFields(form.name.trim(), form.description.trim(), apiKey);
        setForm((prev) => ({
          ...prev,
          personality: prev.personality.trim() || generated.personality || '',
          scenario: prev.scenario.trim() || generated.scenario || '',
          greeting: prev.greeting.trim() || generated.greeting || '',
          voiceHints: prev.voiceHints.length > 0 ? prev.voiceHints : generated.voiceHints || [],
          rules: prev.rules.length > 0 ? prev.rules : generated.rules || [],
        }));
        // After generation, user reviews and clicks again to save
        setGenerating(false);
        return;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Auto-generation failed');
        setGenerating(false);
        return;
      }
    }

    // Build system prompt from structured fields (always)
    const systemPrompt = buildSystemPromptFromParts(
      form.name.trim(),
      form.description.trim(),
      form.personality.trim(),
      form.scenario.trim(),
      form.voiceHints.length > 0 ? form.voiceHints : undefined,
      form.rules.length > 0 ? form.rules : undefined,
    );

    const char: Omit<Character, 'id' | 'isBuiltIn'> = {
      name: form.name.trim(),
      description: form.description.trim(),
      personality: form.personality.trim(),
      scenario: form.scenario.trim(),
      systemPrompt,
      greeting: form.greeting.trim(),
    };

    if (editingId) {
      editCharacter(editingId, char);
    } else {
      createCharacter(char);
    }
    closeEditor();
  };

  const handleDelete = () => {
    if (editingId && selectedCharacter?.id !== editingId) {
      deleteCharacter(editingId);
      closeEditor();
    }
  };

  const canSave = form.name.trim() && form.description.trim() && form.greeting.trim();

  const buttonText = generating
    ? 'Generating...'
    : needsGeneration
      ? 'Generate'
      : 'Save';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={closeEditor}>
      <div
        className="card w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4">
          {editingId ? 'Edit Character' : 'Create Custom Character'}
        </h2>

        {error && (
          <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <input placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input-field" />
          <input placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input-field" />
          <input placeholder="Personality (auto-generated if empty)" value={form.personality} onChange={(e) => setForm((f) => ({ ...f, personality: e.target.value }))} className="input-field" />
          <input placeholder="Scenario (auto-generated if empty)" value={form.scenario} onChange={(e) => setForm((f) => ({ ...f, scenario: e.target.value }))} className="input-field" />
          <input placeholder="Greeting (auto-generated if empty)" value={form.greeting} onChange={(e) => setForm((f) => ({ ...f, greeting: e.target.value }))} className="input-field" />
          <textarea
            placeholder="Voice Hints (auto-generated if empty, one per line)"
            value={form.voiceHints.join('\n')}
            onChange={(e) => setForm((f) => ({ ...f, voiceHints: e.target.value.split('\n').filter((l) => l.trim()) }))}
            rows={3}
            className="input-field resize-none"
          />
          <textarea
            placeholder="Rules (auto-generated if empty, one per line)"
            value={form.rules.join('\n')}
            onChange={(e) => setForm((f) => ({ ...f, rules: e.target.value.split('\n').filter((l) => l.trim()) }))}
            rows={3}
            className="input-field resize-none"
          />
        </div>

        <div className="flex justify-between mt-6">
          <div>
            {editingId && selectedCharacter?.id !== editingId && (
              <button onClick={handleDelete} className="text-red-400 hover:text-red-300 text-sm">
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={closeEditor} className="btn-secondary text-sm">Cancel</button>
            <button
              onClick={handleSave}
              disabled={!canSave || generating}
              className="btn-primary text-sm"
            >
              {generating ? (
                <>
                  <svg className="w-4 h-4 animate-spin mr-1 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating...
                </>
              ) : (
                buttonText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
