import { Switch } from "@heroui/switch";
import { useEffect, useState } from "react";

import MermaidViewer from "@/components/MermaidViewer";

export default function App() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;

    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [dark]);

  // Update document title based on theme for better UX
  useEffect(() => {
    document.title = `Mermaid Diagram Editor Online - Free Flowchart & Sequence Diagram Maker${dark ? " (Dark Mode)" : ""}`;
  }, [dark]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* SEO-friendly header with proper semantic structure */}
      <header className="border-b border-divider bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-7xl mx-auto p-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Mermaid Diagram Editor
            </h1>
            <p className="text-sm text-foreground-500 mt-1">
              Create beautiful diagrams with live preview
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-foreground-600">Dark Mode</span>
            <Switch
              aria-label="Toggle dark mode"
              isSelected={dark}
              size="sm"
              onValueChange={setDark}
            />
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="max-w-7xl mx-auto p-6">
        {/* SEO content section - visible to search engines */}
        <section className="mb-6 text-center">
          <h2 className="sr-only">About Mermaid Diagram Editor</h2>
          <p className="text-foreground-600 max-w-3xl mx-auto">
            Create flowcharts, sequence diagrams, class diagrams, Gantt charts,
            and more with our free online Mermaid diagram editor. Features live
            preview, export to SVG/PNG, shareable URLs, and Monaco editor with
            syntax highlighting.
          </p>
        </section>

        {/* Main editor component */}
        <MermaidViewer dark={dark} />

        {/* SEO footer content */}
        <footer className="mt-12 pt-8 border-t border-divider">
          <div className="text-center text-sm text-foreground-500">
            <h3 className="font-medium mb-2">Supported Diagram Types</h3>
            <p className="max-w-4xl mx-auto">
              Flowcharts, Sequence Diagrams, Class Diagrams, State Diagrams,
              Gantt Charts, Pie Charts, User Journey Maps, Git Graphs, Mindmaps,
              Timeline Charts, Quadrant Charts, ER Diagrams, Architecture
              Diagrams, Kanban Boards, and more.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
