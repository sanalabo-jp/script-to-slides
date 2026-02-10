<script lang="ts">
  import '../app.css';

  let { children } = $props();
</script>

<div class="min-h-screen bg-white">
  <header class="border-b border-gray-200 px-6 py-3">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-sm font-mono font-semibold text-gray-900 tracking-tight">script-to-slides</h1>
    </div>
  </header>

  <main class="max-w-4xl mx-auto px-6 py-6">
    {@render children()}
  </main>

  <footer class="text-center py-4 text-xs font-mono text-gray-400 border-t border-gray-100">
    script-to-slides v0.0.1
  </footer>
</div>
