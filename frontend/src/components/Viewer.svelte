<script lang="ts">
  import { createComment } from "../lib/api";
  import { decodeKey, encryptComment } from "../lib/crypto";
  import { appState, loadPaste } from "../stores/app";
  import { marked } from "marked";
  import DOMPurify from "dompurify";

  let copied = $state(false);
  let comment = $state("");
  let nickname = $state("");
  let postingComment = $state(false);
  let commentError = $state("");
  let hljsModule: typeof import("highlight.js") | null = $state(null);

  $effect(() => {
    const v = $appState.viewing;
    if (v && v.formatter === "syntaxhighlighting" && !hljsModule) {
      import("highlight.js/lib/core").then(async (core) => {
        const [js, ts, py, bash, json, css, html, sql, go, rust, java, cpp, yaml, md] = await Promise.all([
          import("highlight.js/lib/languages/javascript"),
          import("highlight.js/lib/languages/typescript"),
          import("highlight.js/lib/languages/python"),
          import("highlight.js/lib/languages/bash"),
          import("highlight.js/lib/languages/json"),
          import("highlight.js/lib/languages/css"),
          import("highlight.js/lib/languages/xml"),
          import("highlight.js/lib/languages/sql"),
          import("highlight.js/lib/languages/go"),
          import("highlight.js/lib/languages/rust"),
          import("highlight.js/lib/languages/java"),
          import("highlight.js/lib/languages/cpp"),
          import("highlight.js/lib/languages/yaml"),
          import("highlight.js/lib/languages/markdown"),
        ]);
        core.default.registerLanguage("javascript", js.default);
        core.default.registerLanguage("typescript", ts.default);
        core.default.registerLanguage("python", py.default);
        core.default.registerLanguage("bash", bash.default);
        core.default.registerLanguage("json", json.default);
        core.default.registerLanguage("css", css.default);
        core.default.registerLanguage("xml", html.default);
        core.default.registerLanguage("sql", sql.default);
        core.default.registerLanguage("go", go.default);
        core.default.registerLanguage("rust", rust.default);
        core.default.registerLanguage("java", java.default);
        core.default.registerLanguage("cpp", cpp.default);
        core.default.registerLanguage("yaml", yaml.default);
        core.default.registerLanguage("markdown", md.default);
        hljsModule = core;
      });
    }
  });

  function isSafeAttachmentUrl(url: string): boolean {
    if (!url.startsWith("data:")) return false;
    const mime = url.split(";")[0].slice(5).toLowerCase();
    const allowed = [
      "image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml",
      "text/plain", "application/pdf", "application/zip",
      "application/octet-stream",
    ];
    return allowed.includes(mime);
  }

  function copyContent() {
    if (!$appState.viewing) return;
    navigator.clipboard.writeText($appState.viewing.content);
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }

  function downloadContent() {
    if (!$appState.viewing) return;
    const blob = new Blob([$appState.viewing.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zerobin-${$appState.viewing.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function formatTimeToLive(seconds: number): string {
    if (seconds <= 0) return "Expired";
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  }

  function renderContent(content: string, formatter: string): string {
    if (formatter === "markdown") {
      return DOMPurify.sanitize(marked.parse(content) as string);
    }
    return "";
  }

  async function submitComment() {
    const body = comment.trim();
    const viewingPaste = $appState.viewing;
    const encodedKey = $appState.encryptionKey;
    const decryptionPassword = $appState.decryptionPassword;

    if (!body || !viewingPaste || !encodedKey || postingComment) return;

    postingComment = true;
    commentError = "";

    try {
      const key = decodeKey(encodedKey);
      const payload = JSON.stringify({ comment: body, nickname: nickname.trim() || "Anonymous" });
      const encrypted = await encryptComment(payload, key, decryptionPassword);
      const resp = await createComment({
        v: 2,
        ct: encrypted.ct,
        adata: encrypted.adata,
        pasteid: viewingPaste.id,
        parentid: viewingPaste.id,
      });

      if (resp.status !== 0) {
        commentError = resp.message || "Failed to post comment.";
        return;
      }

      if ($appState.viewing?.id !== viewingPaste.id || $appState.encryptionKey !== encodedKey) return;
      comment = "";
      await loadPaste(viewingPaste.id, encodedKey, decryptionPassword);
    } catch {
      commentError = "Failed to post comment.";
    } finally {
      postingComment = false;
    }
  }

  const viewing = $derived($appState.viewing);
</script>

{#if $appState.loading}
  <div class="flex-1 flex items-center justify-center">
    <div class="flex items-center gap-3 text-cyber-muted">
      <svg class="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
      <span>Decrypting...</span>
    </div>
  </div>
{:else if viewing}
  <div class="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 py-4 gap-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button onclick={copyContent} class="btn-secondary text-sm flex items-center gap-1.5">
          {#if copied}
            <svg class="w-4 h-4 text-cyber-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            Copied
          {:else}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            Copy
          {/if}
        </button>
        <button onclick={downloadContent} class="btn-secondary text-sm flex items-center gap-1.5">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          Download
        </button>
      </div>

      {#if viewing.timeToLive !== null}
        <div class="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border border-cyber-border text-cyber-muted">
          <svg class="w-3 h-3 text-cyber-yellow" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z"/></svg>
          Expires in {formatTimeToLive(viewing.timeToLive)}
        </div>
      {/if}
    </div>

    <div class="flex-1 glass rounded-xl overflow-hidden">
      {#if viewing.formatter === "markdown"}
        <div class="p-6 prose prose-invert max-w-prose mx-auto">
          {@html renderContent(viewing.content, "markdown")}
        </div>
      {:else if viewing.formatter === "syntaxhighlighting"}
        {#if hljsModule}
          <pre class="p-6 overflow-auto h-full"><code class="hljs text-sm">{@html DOMPurify.sanitize(hljsModule.default.highlightAuto(viewing.content).value)}</code></pre>
        {:else}
          <pre class="p-6 font-mono text-sm text-cyber-text overflow-auto h-full whitespace-pre-wrap break-words">{viewing.content}</pre>
        {/if}
      {:else}
        <pre class="p-6 font-mono text-sm text-cyber-text overflow-auto h-full whitespace-pre-wrap break-words">{viewing.content}</pre>
      {/if}
    </div>

    {#if viewing.attachments.length > 0}
      <div class="glass rounded-xl p-4 space-y-2">
        <h3 class="text-sm font-medium text-cyber-muted">Attachments</h3>
        {#each viewing.attachments as attachment}
          {#if isSafeAttachmentUrl(attachment.data)}
            <a href={attachment.data} download={attachment.name} class="flex items-center gap-2 text-sm text-cyber-cyan hover:underline">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              {attachment.name}
            </a>
          {:else}
            <span class="flex items-center gap-2 text-sm text-cyber-muted">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              {attachment.name} (unsupported format)
            </span>
          {/if}
        {/each}
      </div>
    {/if}

    {#if viewing.openDiscussion}
      <div class="glass rounded-xl p-4 space-y-4">
        <h3 class="text-sm font-medium text-cyber-text flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
          Discussion ({viewing.comments.length})
        </h3>
        {#each viewing.comments as existingComment}
          <div class="pl-4 border-l-2 border-cyber-border space-y-1">
            <div class="flex items-center gap-2 text-xs text-cyber-muted">
              <span class="text-cyber-purple font-medium">{existingComment.nickname}</span>
            </div>
            <p class="text-sm text-cyber-text">{existingComment.content}</p>
          </div>
        {:else}
          <p class="text-sm text-cyber-muted">No comments yet.</p>
        {/each}

        <form
          class="pt-4 border-t border-cyber-border space-y-3"
          onsubmit={(event) => {
            event.preventDefault();
            submitComment();
          }}
        >
          <input
            bind:value={nickname}
            class="input-field text-sm"
            maxlength="80"
            placeholder="Nickname (optional)"
          />
          <textarea
            bind:value={comment}
            class="input-field min-h-28 resize-y text-sm"
            maxlength="10000"
            placeholder="Add a comment..."
          ></textarea>
          {#if commentError}
            <p class="text-sm text-cyber-red">{commentError}</p>
          {/if}
          <div class="flex justify-end">
            <button
              type="submit"
              class="btn-primary text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              disabled={!comment.trim() || postingComment}
            >
              {#if postingComment}
                <span class="flex items-center gap-2">
                  <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Posting...
                </span>
              {:else}
                Post Comment
              {/if}
            </button>
          </div>
        </form>
      </div>
    {/if}
  </div>
{/if}
