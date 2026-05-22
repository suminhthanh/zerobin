<script lang="ts">
  import { appState } from "../stores/app";

  function updateOption(key: string, value: unknown) {
    appState.update((s) => ({
      ...s,
      options: { ...s.options, [key]: value },
    }));
  }
</script>

<div class="flex flex-wrap items-center gap-3">
  <div class="flex items-center gap-2">
    <label for="expire" class="text-xs text-cyber-muted">Expires:</label>
    <select
      id="expire"
      value={$appState.options.expire}
      onchange={(e) => updateOption("expire", e.currentTarget.value)}
      class="input-field text-xs py-1 px-2 w-auto"
    >
      <option value="5min">5 min</option>
      <option value="10min">10 min</option>
      <option value="1hour">1 hour</option>
      <option value="1day">1 day</option>
      <option value="1week">1 week</option>
      <option value="1month">1 month</option>
      <option value="1year">1 year</option>
      <option value="never">Never</option>
    </select>
  </div>

  <div class="flex items-center gap-2">
    <label for="formatter" class="text-xs text-cyber-muted">Format:</label>
    <select
      id="formatter"
      value={$appState.options.formatter}
      onchange={(e) => updateOption("formatter", e.currentTarget.value)}
      class="input-field text-xs py-1 px-2 w-auto"
    >
      <option value="plaintext">Plain Text</option>
      <option value="syntaxhighlighting">Source Code</option>
      <option value="markdown">Markdown</option>
    </select>
  </div>

  <label class="flex items-center gap-1.5 text-xs text-cyber-muted cursor-pointer select-none py-1.5 px-1">
    <input
      type="checkbox"
      checked={$appState.options.burnAfterReading}
      onchange={(e) => updateOption("burnAfterReading", e.currentTarget.checked)}
      class="w-4 h-4 rounded border-cyber-border bg-cyber-bg accent-cyber-cyan"
    />
    <span class="flex items-center gap-1">
      <svg class="w-3 h-3 text-cyber-yellow" fill="currentColor" viewBox="0 0 24 24"><path d="M12 23c-3.6 0-8-3.1-8-8.5C4 9.5 12 1 12 1s8 8.5 8 13.5c0 5.4-4.4 8.5-8 8.5z"/></svg>
      Burn after reading
    </span>
  </label>

  <label class="flex items-center gap-1.5 text-xs text-cyber-muted cursor-pointer select-none py-1.5 px-1">
    <input
      type="checkbox"
      checked={$appState.options.openDiscussion}
      onchange={(e) => updateOption("openDiscussion", e.currentTarget.checked)}
      class="w-4 h-4 rounded border-cyber-border bg-cyber-bg accent-cyber-cyan"
    />
    <span>Discussion</span>
  </label>

  <div class="flex items-center gap-2">
    <label for="password-field" class="sr-only">Password</label>
    <input
      id="password-field"
      type="password"
      placeholder="Password (optional)"
      value={$appState.options.password}
      oninput={(e) => updateOption("password", e.currentTarget.value)}
      class="input-field text-xs py-1 px-2 w-36"
    />
  </div>
</div>
