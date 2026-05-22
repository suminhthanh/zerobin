<script lang="ts">
  import { appState, resetToEditor } from "../stores/app";
</script>

<header class="glass border-b border-cyber-border sticky top-0 z-40">
  <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
    <button onclick={resetToEditor} class="flex items-center gap-2 group">
      <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-cyber-cyan to-cyber-purple flex items-center justify-center">
        <span class="text-sm font-bold text-cyber-bg">Z</span>
      </div>
      <span class="font-semibold text-lg text-cyber-text group-hover:text-cyber-cyan transition-colors">ZeroBin</span>
    </button>

    <div class="flex items-center gap-2">
      {#if $appState.view === "viewing"}
        <button onclick={resetToEditor} class="btn-secondary text-sm">
          <span class="flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            New
          </span>
        </button>
      {/if}

      <a
        href="https://github.com/suminhthanh/zerobin"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-cyber-border text-xs text-cyber-muted hover:text-cyber-cyan hover:border-cyber-cyan transition-colors"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
        <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        <span>Star</span>
      </a>

      <div class="flex items-center gap-1.5 text-xs text-cyber-muted">
        <svg class="w-3.5 h-3.5 text-cyber-green" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
        <span>E2E Encrypted</span>
      </div>
    </div>
  </div>
</header>
