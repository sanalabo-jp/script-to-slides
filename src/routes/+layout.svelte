<script lang="ts">
  import '../app.css';

  let { children } = $props();
</script>

<div class="min-h-screen bg-gray-50">
  <header class="bg-white border-b border-gray-200 px-6 py-4">
    <div class="max-w-4xl mx-auto flex items-center gap-3">
      <div class="text-2xl">🎬</div>
      <div>
        <h1 class="text-xl font-bold text-gray-900">Script to Slides</h1>
        <p class="text-sm text-gray-500">Transform your script into a presentation</p>
      </div>
    </div>
  </header>

  <main class="max-w-4xl mx-auto px-6 py-8">
    {@render children()}
  </main>

  <footer class="text-center py-6 text-sm text-gray-400">
    Powered by Gemini AI + pptxgenjs
  </footer>
</div>
