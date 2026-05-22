<script lang="ts">
  import { appState, loadPaste } from "../stores/app";

  function confirmBurn() {
    if (!$appState.pasteId || !$appState.encryptionKey) return;
    appState.update((s) => ({ ...s, showBurnModal: false, view: "viewing" }));
    loadPaste($appState.pasteId, $appState.encryptionKey);
  }

  function cancel() {
    appState.update((s) => ({ ...s, showBurnModal: false, view: "editor" }));
    window.history.pushState(null, "", "/");
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") cancel();
  }
</script>

{#if $appState.showBurnModal}
  <div
    class="modal-backdrop"
    role="alertdialog"
    aria-modal="true"
    aria-labelledby="burn-modal-title"
    aria-describedby="burn-modal-desc"
    tabindex="-1"
    onkeydown={handleKeydown}
    onclick={cancel}
  >
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal-card" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
      <div class="text-center mb-6">
        <div class="w-12 h-12 mx-auto rounded-full bg-cyber-yellow/10 flex items-center justify-center mb-3">
          <svg class="w-6 h-6 text-cyber-yellow" fill="currentColor" viewBox="0 0 24 24"><path d="M12 23c-3.6 0-8-3.1-8-8.5C4 9.5 12 1 12 1s8 8.5 8 13.5c0 5.4-4.4 8.5-8 8.5z"/></svg>
        </div>
        <h3 id="burn-modal-title" class="text-lg font-semibold text-cyber-text">Burn After Reading</h3>
        <p id="burn-modal-desc" class="text-sm text-cyber-muted mt-1">This message can only be displayed <strong class="text-cyber-yellow">once</strong>. After viewing, it will be permanently deleted.</p>
      </div>

      <div class="flex gap-3">
        <button onclick={cancel} class="btn-secondary flex-1">Cancel</button>
        <button onclick={confirmBurn} class="btn-primary flex-1">
          <span class="flex items-center justify-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            View Message
          </span>
        </button>
      </div>
    </div>
  </div>
{/if}
