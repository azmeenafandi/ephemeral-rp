export interface Character {
  id: string;
  name: string;
  description: string;
  personality: string;
  scenario: string;
  systemPrompt: string;
  greeting: string;
  isBuiltIn?: boolean;
}
