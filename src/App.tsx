import { createSignal, Show } from "solid-js";
import { Title } from "@solidjs/meta";
import OKRTree from "./components/OKRTree";
import OKRTreeD3 from "./components/OKRTreeD3";

function App() {
  const [isDarkMode, setIsDarkMode] = createSignal(false);
  const [viewMode, setViewMode] = createSignal<"tree" | "d3">("tree");

  return (
    <div class={`min-h-screen ${isDarkMode() ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <Title>OKR Visualisierung - Thinkport</Title>
      <div class="container mx-auto px-4 py-8">
        <header class="flex justify-between items-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">OKR Dashboard</h1>
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-2 bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode("tree")}
                class={`px-3 py-1 rounded-md transition-colors ${
                  viewMode() === "tree"
                    ? "bg-white dark:bg-gray-600 shadow"
                    : "text-gray-600 dark:text-gray-300"
                }`}
              >
                Baum
              </button>
              <button
                onClick={() => setViewMode("d3")}
                class={`px-3 py-1 rounded-md transition-colors ${
                  viewMode() === "d3"
                    ? "bg-white dark:bg-gray-600 shadow"
                    : "text-gray-600 dark:text-gray-300"
                }`}
              >
                D3
              </button>
            </div>
            <button
              onClick={() => setIsDarkMode(!isDarkMode())}
              class="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            >
              {isDarkMode() ? '🌞' : '🌙'}
            </button>
          </div>
        </header>
        <main>
          <Show when={viewMode() === "tree"} fallback={<OKRTreeD3 />}>
            <OKRTree />
          </Show>
        </main>
      </div>
    </div>
  );
}

export default App;
