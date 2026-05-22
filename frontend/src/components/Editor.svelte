<script lang="ts">
  import { appState } from "../stores/app";
  import { encryptPaste, generateKey, encodeKey } from "../lib/crypto";
  import { createPaste } from "../lib/api";
  import Options from "./Options.svelte";

  let content = $state("");
  let sending = $state(false);

  async function handleSubmit() {
    if (!content.trim() || sending) return;
    sending = true;

    try {
      const key = generateKey();
      const opts = $appState.options;

      const payload = JSON.stringify({ paste: content });
      const { ct, adata } = await encryptPaste(
        payload,
        key,
        opts.password,
        opts.formatter,
        opts.openDiscussion,
        opts.burnAfterReading
      );

      const resp = await createPaste({
        v: 2,
        ct,
        adata,
        meta: { expire: opts.expire },
      });

      if (resp.status === 0 && resp.id) {
        const fullUrl = `${window.location.origin}/?${resp.id}#${encodeKey(key)}`;
        appState.update((s) => ({
          ...s,
          view: "created",
          created: {
            id: resp.id!,
            url: resp.url!,
            deleteToken: resp.deletetoken!,
            fullUrl,
          },
        }));
        window.history.pushState(null, "", `/?${resp.id}#${encodeKey(key)}`);
      } else {
        appState.update((s) => ({ ...s, error: resp.message || "Failed to create paste." }));
      }
    } catch (err) {
      appState.update((s) => ({ ...s, error: "Network error. Please try again." }));
    } finally {
      sending = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  }
</script>

<div class="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 py-4 gap-4">
  <Options />

  <div class="flex-1 relative">
    <textarea
      bind:value={content}
      onkeydown={handleKeydown}
      placeholder="Paste your text here... (Ctrl+Enter to encrypt & send)"
      aria-label="Paste content"
      class="input-field w-full h-full min-h-[400px] resize-none font-mono text-sm leading-relaxed p-4"
      spellcheck="false"
    ></textarea>

    {#if $appState.error}
      <div class="absolute bottom-4 left-4 right-4 bg-cyber-red/10 border border-cyber-red rounded-lg px-4 py-2 text-sm text-cyber-red">
        {$appState.error}
      </div>
    {/if}
  </div>

  <div class="flex justify-end">
    <button
      onclick={handleSubmit}
      disabled={!content.trim() || sending}
      class="btn-primary text-base px-6 py-3 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
    >
      {#if sending}
        <span class="flex items-center gap-2">
          <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          Encrypting...
        </span>
      {:else}
        <span class="flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          Encrypt &amp; Send
        </span>
      {/if}
    </button>
  </div>
</div>
