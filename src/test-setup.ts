import '@testing-library/jest-dom';
import { beforeEach, vi } from 'vitest';

// `characterStore` starts a one-time asynchronous load of the built-in
// characters at module-import time and writes the result back into the store.
// That pending write can land *after* a test's own `beforeEach` has installed
// its store fixtures, silently clobbering them (for example, CharacterSelector
// installs `selectedCharacter: charA` but the bootstrap would replace it with
// the real built-ins, so selecting `charB` no longer looks like a switch).
//
// Wait for that bootstrap to settle before every test so per-test state is
// established only after the store has stopped mutating itself. Because the
// hook is registered in a setup file it runs before any test-file hooks, so a
// test's fixtures can no longer be overwritten mid-test regardless of file or
// test order.
//
// The import is dynamic on purpose: importing the store eagerly here would
// instantiate it (and its real `characters/load` dependency) before a test
// file's `vi.mock` is registered, which would break test-level mocking.
beforeEach(async () => {
  const { useCharacterStore } = await import('./stores/characterStore');
  if (!useCharacterStore.getState().isLoading) return;
  await vi.waitFor(
    () => {
      if (useCharacterStore.getState().isLoading) {
        throw new Error('character store has not finished loading');
      }
    },
    { timeout: 10_000, interval: 10 },
  );
});
