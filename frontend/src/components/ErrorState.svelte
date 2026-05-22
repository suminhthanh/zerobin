<script lang="ts">
  import { appState, resetToEditor } from "../stores/app";
</script>

<div class="flex-1 flex items-center justify-center px-4">
  <div class="glass rounded-2xl p-8 w-full max-w-md text-center space-y-6">
    <div class="w-16 h-16 mx-auto rounded-full bg-cyber-red/10 flex items-center justify-center">
      <svg class="w-8 h-8 text-cyber-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>

    <div>
      <h2 class="text-xl font-semibold text-cyber-text mb-2">Not Found</h2>
      <p class="text-sm text-cyber-muted">{$appState.error}</p>
    </div>

    <button onclick={resetToEditor} class="btn-primary">
      <span class="flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Create New Paste
      </span>
    </button>
  </div>
</div>
