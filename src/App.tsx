import { Switch } from "@heroui/switch";
import MermaidViewer from "@/components/MermaidViewer";
import { useEffect, useState } from "react";

export default function App() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [dark]);

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <header className="flex items-center justify-between max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold">Mermaid Viewer</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm">Dark</span>
          <Switch isSelected={dark} onValueChange={setDark} size="sm" />
        </div>
      </header>
      <main className="max-w-7xl mx-auto mt-6">
        <MermaidViewer dark={dark} />
      </main>
    </div>
  );
}
