<script lang="ts">
  import { appState, resetToEditor } from "../stores/app";
</script>

<div class="flex-1 flex items-center justify-center px-4">
  <div class="glass rounded-2xl p-8 w-full max-w-md text-center space-y-6">
    <div class="w-16 h-16 mx-auto rounded-full bg-cyber-green/10 flex items-center justify-center">
      <svg class="w-8 h-8 text-cyber-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
    </div>

    <div>
      <h2 class="text-xl font-semibold text-cyber-text mb-2">Deleted</h2>
      <p class="text-sm text-cyber-muted">{$appState.statusMessage}</p>
    </div>

    <button onclick={resetToEditor} class="btn-primary">
      <span class="flex items-center justify-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Create New Paste
      </span>
    </button>
  </div>
</div>
