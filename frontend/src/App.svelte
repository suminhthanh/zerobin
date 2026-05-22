<script lang="ts">
  import { appState, initFromUrl } from "./stores/app";
  import Toolbar from "./components/Toolbar.svelte";
  import Editor from "./components/Editor.svelte";
  import Viewer from "./components/Viewer.svelte";
  import SharePanel from "./components/SharePanel.svelte";
  import ErrorState from "./components/ErrorState.svelte";
  import DeletedState from "./components/DeletedState.svelte";
  import PasswordModal from "./components/PasswordModal.svelte";
  import BurnModal from "./components/BurnModal.svelte";
  import Footer from "./components/Footer.svelte";

  initFromUrl();
</script>

<div class="flex flex-col h-full min-h-screen">
  <Toolbar />

  <main class="flex-1 flex flex-col">
    {#if $appState.view === "editor"}
      <Editor />
    {:else if $appState.view === "created"}
      <SharePanel />
    {:else if $appState.view === "viewing"}
      <Viewer />
    {:else if $appState.view === "deleted"}
      <DeletedState />
    {:else if $appState.view === "error"}
      <ErrorState />
    {/if}
  </main>

  <Footer />

  {#if $appState.showPasswordModal}
    <PasswordModal />
  {/if}

  {#if $appState.showBurnModal}
    <BurnModal />
  {/if}
</div>
