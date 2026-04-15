import { useEffect, useState } from "react";

import { Brandmark } from "@/components/Brandmark";
import MermaidViewer from "@/components/MermaidViewer";

export default function App() {
	const [dark, setDark] = useState<boolean>(() => {
		if (typeof window === "undefined") return false;
		const saved = localStorage.getItem("viewerTheme");
		if (saved === "dark") return true;
		if (saved === "light") return false;
		return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
	});

	useEffect(() => {
		const root = document.documentElement;
		if (dark) root.classList.add("dark");
		else root.classList.remove("dark");
		localStorage.setItem("viewerTheme", dark ? "dark" : "light");
	}, [dark]);

	useEffect(() => {
		document.title = "Mermaid Viewer — diagrams as a workshop tool";
	}, []);

	return (
		<div className="min-h-screen flex flex-col">
			{/* Thin brandmark: drafting-stamp wordmark, single rule below.
			    Sits flush on the page surface; no card, no shadow, no blur. */}
			<header className="border-b border-[color:var(--rule)]">
				<div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center gap-4">
					<a
						aria-label="Mermaid Viewer home"
						className="font-display text-[1.05rem] tracking-tight text-[color:var(--ink)] flex items-center gap-1.5"
						href="/"
					>
						<Brandmark className="text-[color:var(--copper)]" size={16} />
						<span>mermaid</span>
						<span className="text-[color:var(--graphite)]">.viewer</span>
					</a>
					<div className="ml-auto flex items-center gap-2">
						<a
							className="tool-btn !border-transparent hover:!border-[color:var(--chalk)]"
							href="https://mermaid.js.org/intro/"
							rel="noreferrer"
							target="_blank"
						>
							syntax ↗
						</a>
						<a
							className="tool-btn !border-transparent hover:!border-[color:var(--chalk)]"
							href="https://github.com/iceinvein/mermaid-viewer"
							rel="noreferrer"
							target="_blank"
						>
							source ↗
						</a>
						<button
							aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
							className="tool-btn"
							type="button"
							onClick={() => setDark((d) => !d)}
						>
							{dark ? "☼ light" : "☾ dark"}
						</button>
					</div>
				</div>
			</header>

			{/* Main: tool fills the page. No marketing chrome above it. */}
			<main className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-6">
				<MermaidViewer dark={dark} />
			</main>

			{/* SEO content kept visually hidden but indexable. Removed from the
			    visual surface so the tool doesn't carry marketing weight. */}
			<div className="sr-only">
				<h1>Mermaid Diagram Editor</h1>
				<p>
					Create flowcharts, sequence diagrams, class diagrams, Gantt charts,
					pie charts, user journey maps, git graphs, mindmaps, timeline charts,
					quadrant charts, ER diagrams, architecture diagrams, kanban boards,
					and more with this free online Mermaid editor. Live preview, export to
					SVG and PNG, shareable URLs, Monaco editor with syntax highlighting.
				</p>
				<h2>Supported diagram types</h2>
				<ul>
					<li>Flowchart</li>
					<li>Sequence diagram</li>
					<li>Class diagram</li>
					<li>State diagram</li>
					<li>Gantt chart</li>
					<li>Pie chart</li>
					<li>User journey</li>
					<li>Git graph</li>
					<li>ER diagram</li>
					<li>XY chart</li>
					<li>Treemap</li>
					<li>Kanban</li>
					<li>Architecture diagram</li>
				</ul>
			</div>
		</div>
	);
}
