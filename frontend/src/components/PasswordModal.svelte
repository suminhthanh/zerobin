<script lang="ts">
  import { appState, loadPaste } from "../stores/app";

  let password = $state("");

  function handleSubmit(e: Event) {
    e.preventDefault();
    if (!$appState.pasteId || !$appState.encryptionKey) return;
    appState.update((s) => ({ ...s, showPasswordModal: false }));
    loadPaste($appState.pasteId, $appState.encryptionKey, password);
  }

  function dismiss() {
    appState.update((s) => ({ ...s, showPasswordModal: false }));
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") dismiss();
  }
</script>

{#if $appState.showPasswordModal}
  <div
    class="modal-backdrop"
    role="dialog"
    aria-modal="true"
    aria-labelledby="password-modal-title"
    tabindex="-1"
    onkeydown={handleKeydown}
    onclick={dismiss}
  >
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal-card" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
      <div class="text-center mb-6">
        <div class="w-12 h-12 mx-auto rounded-full bg-cyber-purple/10 flex items-center justify-center mb-3">
          <svg class="w-6 h-6 text-cyber-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
        </div>
        <h3 id="password-modal-title" class="text-lg font-semibold text-cyber-text">Password Required</h3>
        <p class="text-sm text-cyber-muted mt-1">This document is password-protected</p>
      </div>

      <form onsubmit={handleSubmit} class="space-y-4">
        <label for="decrypt-password" class="sr-only">Decryption password</label>
        <input
          id="decrypt-password"
          type="password"
          bind:value={password}
          placeholder="Enter password"
          class="input-field"
        />
        <button type="submit" class="btn-primary w-full">
          Decrypt
        </button>
      </form>
    </div>
  </div>
{/if}
