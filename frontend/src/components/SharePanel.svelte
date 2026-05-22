<script lang="ts">
  import { appState, resetToEditor } from "../stores/app";
  import QRCode from "qrcode";

  let copied = $state(false);
  let qrDataUrl = $state("");

  $effect(() => {
    const url = $appState.created?.fullUrl;
    if (url) {
      QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      }).then((dataUrl) => {
        qrDataUrl = dataUrl;
      });
    }
  });

  function copyLink() {
    if (!$appState.created) return;
    navigator.clipboard.writeText($appState.created.fullUrl);
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }

  function handleDelete() {
    if (!$appState.created) return;
    const { id, deleteToken } = $appState.created;
    const deleteUrl = `${window.location.origin}/?pasteid=${id}&deletetoken=${deleteToken}`;
    window.open(deleteUrl, "_blank");
  }
</script>

<div class="flex-1 flex items-center justify-center px-4">
  <div class="glass rounded-2xl p-8 w-full max-w-lg text-center space-y-6">
    <div class="w-16 h-16 mx-auto rounded-full bg-cyber-green/10 flex items-center justify-center">
      <svg class="w-8 h-8 text-cyber-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
    </div>

    <div>
      <h2 class="text-xl font-semibold text-cyber-text mb-2">Paste Created</h2>
      <p class="text-sm text-cyber-muted">Share this link — the encryption key is in the URL</p>
    </div>

    <div class="bg-cyber-bg rounded-lg p-3 border border-cyber-border">
      <code class="text-xs text-cyber-cyan break-all font-mono">
        {$appState.created?.fullUrl}
      </code>
    </div>

    {#if qrDataUrl}
      <div class="flex justify-center">
        <img src={qrDataUrl} alt="QR code for paste URL" class="rounded-lg" width="200" height="200" />
      </div>
    {/if}

    <div class="flex flex-col sm:flex-row gap-3 justify-center">
      <button onclick={copyLink} class="btn-primary flex items-center justify-center gap-2">
        {#if copied}
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
          Copied!
        {:else}
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
          Copy Link
        {/if}
      </button>

      <button onclick={handleDelete} class="btn-danger flex items-center justify-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        Delete
      </button>

      <button onclick={resetToEditor} class="btn-secondary flex items-center justify-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        New Paste
      </button>
    </div>
  </div>
</div>
