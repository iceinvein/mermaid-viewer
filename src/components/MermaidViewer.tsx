import {
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownTrigger,
} from "@heroui/dropdown";
import { Kbd } from "@heroui/kbd";
import { Slider } from "@heroui/slider";
import { Switch } from "@heroui/switch";
import Editor from "@monaco-editor/react";
import * as htmlToImage from "html-to-image";
import {
	compressToEncodedURIComponent,
	decompressFromEncodedURIComponent,
} from "lz-string";
import mermaid from "mermaid";
import type * as monaco from "monaco-editor";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { Brandmark } from "@/components/Brandmark";
import {
	mermaidThemeFor,
	WORKSHOP_DARK,
	WORKSHOP_LIGHT,
} from "@/config/workshop-tokens";
import { generateDiagramSEO, updateSEO } from "@/utils/seo";

let HAS_REGISTERED_MERMAID_LANG = false;

const EXAMPLES: Record<string, string> = {
	Flowchart: `flowchart TD\n  A[Start] --> B{Is it working?}\n  B -- Yes --> C[Ship it]\n  B -- No  --> D[Fix it]\n  D --> B`,
	Sequence: `sequenceDiagram\n  Alice->>John: Hello John, how are you?\n  John-->>Alice: Great!`,
	Class: `classDiagram\n  class Animal{\n    +int age\n    +String gender\n    +isMammal() boolean\n  }\n  class Duck{\n    +String beakColor\n    +swim() void\n  }\n  Animal <|-- Duck`,
	Gantt: `gantt\n  title Project Timeline\n  dateFormat YYYY-MM-DD\n  section Planning\n  Spec :done, 2024-01-01, 3d\n  Design :active, 2024-01-04, 4d\n  section Implementation\n  Feature A : 2024-01-08, 5d\n  Testing : 2024-01-13, 3d`,
	Pie: `pie showData\n  title Pets adopted by year\n  "Dogs" : 386\n  "Cats" : 85\n  "Rats" : 15`,
	"User Journey": `journey\n  title User journey for checkout\n  section Browse\n    Visitor: 5: Explore products\n  section Checkout\n    Visitor: 3: Fill cart\n    Visitor: 2: Pay`,
	Git: `gitGraph\n  commit\n  branch feature\n  checkout feature\n  commit\n  checkout main\n  merge feature`,
	ERD: `erDiagram\n  CUSTOMER ||--o{ ORDER : places\n  ORDER ||--|{ LINE_ITEM : contains\n  CUSTOMER {\n    string name\n    string email\n  }`,
	XY: `xychart-beta\n  title "Monthly Revenue"\n  x-axis [Jan, Feb, Mar, Apr]\n  y-axis "USD"\n  line [1.2, 2.3, 1.8, 3.2]\n  bar [1, 2, 3, 4]`,
	Treemap: `treemap-beta\n"Fruits"\n  "Citrus"\n    "Orange": 6\n    "Lemon": 4\n  "Berries"\n    "Strawberry": 5\n"Vegetables"\n  "Leafy"\n    "Spinach": 3`,
	Kanban: `kanban\n  todo[Todo]\n    t1[Write spec]\n    t2[Design UI]\n    t3[Research]\n  doing[In Progress]\n    t4[Implement feature]\n    t5[Code review]\n  done[Done]\n    t6[Deploy]\n    t7[Test]`,
	Architecture: `architecture-beta\n  group web(cloud)[Web]\n  service api(server)[API] in web\n  service db(database)[DB]\n  api:R --> L:db`,
};

type ToastTone = "info" | "ok" | "warn" | "error";
type Toast = {
	id: number;
	message: string;
	tone: ToastTone;
	action?: { label: string; onPress: () => void };
};

const EXAMPLE_NAMES = Object.keys(EXAMPLES) as (keyof typeof EXAMPLES)[];

const EXAMPLE_DESCRIPTIONS: Record<string, string> = {
	Flowchart: "Boxes and arrows",
	Sequence: "Actor messages over time",
	Class: "Object relationships",
	Gantt: "Scheduled tasks",
	Pie: "Single-value distribution",
	"User Journey": "Experience scoring",
	Git: "Branch history",
	ERD: "Entities and keys",
	XY: "Numeric series",
	Treemap: "Nested proportions",
	Kanban: "Columns of cards",
	Architecture: "System components",
};

/**
 * Mini-glyphs next to each example name in the dropdown. Hand-drawn
 * strokes in the workshop voice; not pictogram icons. 32x20 viewBox.
 */
function ExampleGlyph({ kind }: { kind: string }) {
	const p = {
		fill: "none" as const,
		stroke: "currentColor",
		strokeWidth: 1.5,
		strokeLinecap: "round" as const,
		strokeLinejoin: "round" as const,
	};
	switch (kind) {
		case "Flowchart":
			return (
				<svg viewBox="0 0 32 20">
					<rect x="2" y="2" width="9" height="5" rx="1" {...p} />
					<rect x="21" y="2" width="9" height="5" rx="1" {...p} />
					<rect x="11" y="13" width="10" height="5" rx="1" {...p} />
					<path d="M11 4.5h10M6.5 7v4h9.5M25.5 7v4H21" {...p} />
				</svg>
			);
		case "Sequence":
			return (
				<svg viewBox="0 0 32 20">
					<path d="M6 2v16M26 2v16" {...p} />
					<path d="M6 7l20 2M26 13l-20 2" {...p} />
				</svg>
			);
		case "Class":
			return (
				<svg viewBox="0 0 32 20">
					<rect x="3" y="2" width="11" height="16" rx="1" {...p} />
					<rect x="18" y="2" width="11" height="16" rx="1" {...p} />
					<path d="M3 6h11M18 6h11M14 10h4" {...p} />
				</svg>
			);
		case "Gantt":
			return (
				<svg viewBox="0 0 32 20">
					<path
						d="M2 4h8M6 10h14M14 16h14"
						stroke="currentColor"
						strokeWidth="3"
						strokeLinecap="round"
						fill="none"
					/>
				</svg>
			);
		case "Pie":
			return (
				<svg viewBox="0 0 32 20">
					<circle cx="16" cy="10" r="7" {...p} />
					<path d="M16 3v7l6 3.5" {...p} />
				</svg>
			);
		case "User Journey":
			return (
				<svg viewBox="0 0 32 20">
					<path d="M2 15c3-10 7-10 10 0s7 6 10-2 5-10 8-4" {...p} />
					<circle cx="5" cy="10" r="1" fill="currentColor" />
					<circle cx="16" cy="12" r="1" fill="currentColor" />
					<circle cx="27" cy="8" r="1" fill="currentColor" />
				</svg>
			);
		case "Git":
			return (
				<svg viewBox="0 0 32 20">
					<path d="M4 15h24M12 5v10M22 5v10" {...p} />
					<circle cx="4" cy="15" r="1.4" fill="currentColor" />
					<circle cx="28" cy="15" r="1.4" fill="currentColor" />
					<circle cx="12" cy="5" r="1.4" fill="currentColor" />
					<circle cx="22" cy="5" r="1.4" fill="currentColor" />
				</svg>
			);
		case "ERD":
			return (
				<svg viewBox="0 0 32 20">
					<rect x="2" y="5" width="10" height="10" rx="1" {...p} />
					<rect x="20" y="5" width="10" height="10" rx="1" {...p} />
					<path d="M12 10h2M18 10h2M14 8v4M18 9v2" {...p} />
				</svg>
			);
		case "XY":
			return (
				<svg viewBox="0 0 32 20">
					<path d="M3 2v16h26" {...p} />
					<path d="M6 15l6-5 5 3 10-8" {...p} />
				</svg>
			);
		case "Treemap":
			return (
				<svg viewBox="0 0 32 20">
					<rect x="2" y="2" width="17" height="10" {...p} />
					<rect x="2" y="12" width="9" height="6" {...p} />
					<rect x="11" y="12" width="8" height="6" {...p} />
					<rect x="19" y="2" width="11" height="16" {...p} />
				</svg>
			);
		case "Kanban":
			return (
				<svg viewBox="0 0 32 20">
					<rect x="2" y="2" width="8" height="16" {...p} />
					<rect x="12" y="2" width="8" height="16" {...p} />
					<rect x="22" y="2" width="8" height="16" {...p} />
					<path d="M2 7h8M12 7h8M22 7h8" {...p} />
				</svg>
			);
		case "Architecture":
			return (
				<svg viewBox="0 0 32 20">
					<rect x="2" y="2" width="12" height="16" rx="1" {...p} />
					<rect x="18" y="2" width="12" height="6" rx="1" {...p} />
					<rect x="18" y="12" width="12" height="6" rx="1" {...p} />
					<path d="M14 10h4" {...p} />
				</svg>
			);
		default:
			return (
				<svg viewBox="0 0 32 20">
					<circle cx="16" cy="10" r="5" {...p} />
				</svg>
			);
	}
}

export default function MermaidViewer({ dark = false }: { dark?: boolean }) {
	const [code, setCode] = useState<string>(() => {
		const u = new URL(window.location.href);
		const c = u.hash.startsWith("#code=")
			? decompressFromEncodedURIComponent(u.hash.slice("#code=".length))
			: null;

		return c || EXAMPLES.Flowchart;
	});
	const [svg, setSvg] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [rendering, setRendering] = useState<boolean>(false);
	const [pngScale, setPngScale] = useState<number>(2);
	const [fitWidth, setFitWidth] = useState<boolean>(true);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const monacoRef = useRef<typeof monaco | null>(null);
	const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

	const [toasts, setToasts] = useState<Toast[]>([]);
	const toastSeqRef = useRef(0);
	const pushToast = useCallback(
		(
			message: string,
			tone: ToastTone = "info",
			action?: { label: string; onPress: () => void },
		) => {
			const id = ++toastSeqRef.current;
			setToasts((cur) => [...cur, { id, message, tone, action }]);
			window.setTimeout(
				() => {
					setToasts((cur) => cur.filter((t) => t.id !== id));
				},
				action ? 5200 : 3200,
			);
		},
		[],
	);

	// Examples undo: stash the last overwritten buffer so the user can
	// restore via a toast action. Not a full undo-stack; one step is enough.
	const previousCodeRef = useRef<string | null>(null);

	// First-run primer: shown above the editor until the user dismisses it.
	const [primerOpen, setPrimerOpen] = useState<boolean>(() => {
		if (typeof window === "undefined") return false;
		return localStorage.getItem("viewerPrimerDismissed") !== "1";
	});
	function dismissPrimer() {
		setPrimerOpen(false);
		localStorage.setItem("viewerPrimerDismissed", "1");
	}

	const layoutRef = useRef<HTMLDivElement | null>(null);
	// Asymmetric default: preview is the hero. 42 / 58 favouring preview.
	const [split, setSplit] = useState<number>(() => {
		if (typeof window !== "undefined") {
			const v = parseFloat(localStorage.getItem("viewerSplit") || "");

			if (!Number.isNaN(v) && v > 0.2 && v < 0.8) return v;
		}

		return 0.42;
	});
	const [dragging, setDragging] = useState(false);
	const [isMd, setIsMd] = useState<boolean>(() =>
		typeof window !== "undefined"
			? window.matchMedia("(min-width: 768px)").matches
			: false,
	);

	useEffect(() => {
		const mq = window.matchMedia("(min-width: 768px)");
		const onChange = () => setIsMd(mq.matches);

		onChange();
		mq.addEventListener?.("change", onChange);

		return () => mq.removeEventListener?.("change", onChange);
	}, []);
	const onSplitDragStart = () => {
		if (!layoutRef.current) return;
		setDragging(true);
		const el = layoutRef.current;
		const rect = el.getBoundingClientRect();
		let lastRatio = split;
		const onMove = (ev: MouseEvent) => {
			const x = ev.clientX - rect.left;
			const ratio = Math.min(0.8, Math.max(0.2, x / rect.width));

			lastRatio = ratio;
			setSplit(ratio);
		};
		const onUp = () => {
			setDragging(false);
			localStorage.setItem("viewerSplit", String(lastRatio));
			window.removeEventListener("mousemove", onMove);
			window.removeEventListener("mouseup", onUp);
		};

		window.addEventListener("mousemove", onMove);
		window.addEventListener("mouseup", onUp);
	};

	// Keyboard resize: arrow keys move the split, shift = larger step,
	// Home resets to default. Makes the separator fully accessible.
	const onSplitKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
		const step = e.shiftKey ? 0.05 : 0.02;
		if (e.key === "ArrowLeft") {
			e.preventDefault();
			setSplit((s) => {
				const next = Math.max(0.2, s - step);
				localStorage.setItem("viewerSplit", String(next));
				return next;
			});
		} else if (e.key === "ArrowRight") {
			e.preventDefault();
			setSplit((s) => {
				const next = Math.min(0.8, s + step);
				localStorage.setItem("viewerSplit", String(next));
				return next;
			});
		} else if (e.key === "Home") {
			e.preventDefault();
			setSplit(0.42);
			localStorage.setItem("viewerSplit", "0.42");
		}
	};

	const handleBeforeMount = (monacoInstance: typeof monaco) => {
		if (HAS_REGISTERED_MERMAID_LANG) return;
		HAS_REGISTERED_MERMAID_LANG = true;

		monacoInstance.languages.register({ id: "mermaid" });
		monacoInstance.languages.setMonarchTokensProvider("mermaid", {
			ignoreCase: true,
			tokenizer: {
				root: [
					[/%%\{.*\}%%/, "meta"],
					[/%%.*$/, "comment"],
					[/"([^"\\]|\\.)*"/, "string"],
					[/'([^'\\]|\\.)*'/, "string"],
					[/\b\d+(\.\d+)?\b/, "number"],
					[
						/(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|stateDiagram-v2|gantt|pie|journey|gitGraph|mindmap|timeline|quadrantChart|erDiagram|requirementDiagram|c4context|c4container|c4component|c4deployment|c4dynamic|c4relationship|info|kanban|architecture-beta|xychart-beta|treemap-beta)\b/,
						"keyword",
					],
					[
						/(subgraph|end|direction|linkStyle|style|click|classDef|class|accTitle|accDescr|accTitle:|accDescr:|alt|opt|loop|par|rect|else|and|note|activate|deactivate|participant|actor|state|section|title|dateFormat|axisFormat|interpolate)\b/,
						"keyword",
					],
					[/\b(TD|LR|RL|BT)\b/, "keyword"],
					[/(-->|--x|--o|==>|-\.->|\.-->|==x|==o|===|--)/, "operator"],
					[/\[|\]|\{|\}|\(|\)/, "delimiter"],
					[/[_A-Za-z][_A-Za-z0-9-]*/, "identifier"],
				],
			},
		});

		// Register workshop-palette Monaco themes so the editor sits on the
		// same surface as the rest of the chrome rather than generic VS Code.
		const lt = WORKSHOP_LIGHT;
		monacoInstance.editor.defineTheme("workshop-light", {
			base: "vs",
			inherit: false,
			rules: [
				{ token: "", foreground: lt.ink.slice(1) },
				{
					token: "keyword",
					foreground: lt.copperPress.slice(1),
					fontStyle: "bold",
				},
				{ token: "string", foreground: lt.moss.slice(1) },
				{
					token: "comment",
					foreground: lt.pencil.slice(1),
					fontStyle: "italic",
				},
				{ token: "number", foreground: lt.graphite.slice(1) },
				{ token: "operator", foreground: lt.graphite.slice(1) },
				{ token: "delimiter", foreground: lt.pencil.slice(1) },
				{ token: "identifier", foreground: lt.ink.slice(1) },
				{ token: "meta", foreground: lt.pencil.slice(1), fontStyle: "italic" },
			],
			colors: {
				"editor.background": lt.workbenchInset,
				"editor.foreground": lt.ink,
				"editor.lineHighlightBackground": lt.workbench,
				"editor.selectionBackground": "#b4561e30",
				"editor.inactiveSelectionBackground": "#b4561e18",
				"editorLineNumber.foreground": lt.pencil,
				"editorLineNumber.activeForeground": lt.graphite,
				"editorCursor.foreground": lt.copper,
				"editorIndentGuide.background": lt.rule,
				"scrollbarSlider.background": "#85807230",
				"scrollbarSlider.hoverBackground": "#85807250",
			},
		});
		const dk = WORKSHOP_DARK;
		monacoInstance.editor.defineTheme("workshop-dark", {
			base: "vs-dark",
			inherit: false,
			rules: [
				{ token: "", foreground: dk.ink.slice(1) },
				{
					token: "keyword",
					foreground: dk.copperPress.slice(1),
					fontStyle: "bold",
				},
				{ token: "string", foreground: dk.moss.slice(1) },
				{
					token: "comment",
					foreground: dk.pencil.slice(1),
					fontStyle: "italic",
				},
				{ token: "number", foreground: dk.graphite.slice(1) },
				{ token: "operator", foreground: dk.graphite.slice(1) },
				{ token: "delimiter", foreground: dk.pencil.slice(1) },
				{ token: "identifier", foreground: dk.ink.slice(1) },
				{ token: "meta", foreground: dk.pencil.slice(1), fontStyle: "italic" },
			],
			colors: {
				"editor.background": dk.workbenchInset,
				"editor.foreground": dk.ink,
				"editor.lineHighlightBackground": dk.workbench,
				"editor.selectionBackground": "#d6815240",
				"editor.inactiveSelectionBackground": "#d6815220",
				"editorLineNumber.foreground": dk.pencil,
				"editorLineNumber.activeForeground": dk.graphite,
				"editorCursor.foreground": dk.copper,
				"editorIndentGuide.background": dk.rule,
				"scrollbarSlider.background": "#9b928630",
				"scrollbarSlider.hoverBackground": "#9b928650",
			},
		});
	};

	// Mermaid theme: wire to workshop palette via the shared tokens module
	// so the hex values can't drift from globals.css or tailwind.config.js.
	useEffect(() => {
		mermaid.initialize({
			startOnLoad: false,
			theme: "base",
			themeVariables: mermaidThemeFor(dark ? "dark" : "light"),
		});
	}, [dark]);

	// Update SEO based on diagram type
	useEffect(() => {
		const detectDiagramType = (code: string): string => {
			const firstLine = code.trim().split("\n")[0].toLowerCase();

			if (firstLine.includes("flowchart") || firstLine.includes("graph"))
				return "flowchart";
			if (firstLine.includes("sequencediagram")) return "sequence";
			if (firstLine.includes("classdiagram")) return "class";
			if (firstLine.includes("gantt")) return "gantt";
			if (firstLine.includes("pie")) return "pie";
			if (firstLine.includes("journey")) return "journey";
			if (firstLine.includes("gitgraph")) return "git";
			if (firstLine.includes("erdiagram")) return "er";
			if (firstLine.includes("kanban")) return "kanban";
			if (firstLine.includes("architecture")) return "architecture";
			if (firstLine.includes("treemap")) return "treemap";
			if (firstLine.includes("statediagram")) return "state";
			if (firstLine.includes("mindmap")) return "mindmap";
			if (firstLine.includes("timeline")) return "timeline";
			if (firstLine.includes("quadrant")) return "quadrant";
			if (firstLine.includes("xychart")) return "xy";

			return "flowchart"; // default
		};

		const diagramType = detectDiagramType(code);
		const seoData = generateDiagramSEO(diagramType);

		updateSEO(seoData);
	}, [code]);

	// Render Mermaid to SVG string (independent of the DOM container)
	useEffect(() => {
		let cancelled = false;
		setRendering(true);
		async function render() {
			try {
				setError(null);
				const result = await mermaid.render(
					`mmd-${Math.random().toString(36).slice(2)}`,
					code,
				);

				if (cancelled) return;
				setSvg(result.svg);
			} catch (e) {
				if (!cancelled) {
					setSvg("");
					setError((e as Error).message);
				}
			} finally {
				if (!cancelled) setRendering(false);
			}
		}
		render();

		return () => {
			cancelled = true;
		};
	}, [code]);

	// Inject SVG into container and apply sizing/zoom when it changes
	useEffect(() => {
		const el = containerRef.current;

		if (!el) return;
		el.innerHTML = svg || "";
		const svgEl = el.querySelector("svg") as SVGElement | null;

		if (!svgEl) return;
		if (fitWidth) {
			svgEl.removeAttribute("width");
			svgEl.removeAttribute("height");
			svgEl.style.maxWidth = "100%";
			svgEl.style.height = "auto";
			svgEl.style.transform = "";
			svgEl.style.transformOrigin = "";
		} else {
			svgEl.style.maxWidth = "none";
			svgEl.style.height = "auto";
			svgEl.style.transform = `scale(${pngScale})`;
			svgEl.style.transformOrigin = "top left";
		}
	}, [svg, fitWidth, pngScale]);
	// Monaco markers for mermaid parse errors
	useEffect(() => {
		const m = monacoRef.current;
		const editor = editorRef.current;

		if (!m || !editor) return;
		const model = editor.getModel?.();

		if (!model) return;

		const markers: monaco.editor.IMarkerData[] = [];

		if (error) {
			let line = 1;
			const matched = error.match(/line\s+(\d+)/i);

			if (matched) line = Math.max(1, parseInt(matched[1], 10));
			markers.push({
				startLineNumber: line,
				startColumn: 1,
				endLineNumber: line,
				endColumn: 1000,
				message: error,
				severity: m.MarkerSeverity.Error,
			});
		}
		m.editor.setModelMarkers(model, "mermaid", markers);
	}, [error]);

	function loadExample(name: keyof typeof EXAMPLES) {
		// Stash the current buffer so Restore can revive it in one click.
		previousCodeRef.current = code;
		setCode(EXAMPLES[name]);
		pushToast(`Loaded ${String(name)}`, "info", {
			label: "Restore previous",
			onPress: () => {
				const prev = previousCodeRef.current;
				if (prev != null) {
					setCode(prev);
					previousCodeRef.current = null;
					pushToast("Restored your previous source", "ok");
				}
			},
		});
	}

	function download(filename: string, blob: Blob) {
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");

		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	}

	function sanitizeSvgForExport(svgString: string): string {
		try {
			// Simple string-based sanitization to convert HTML to XHTML
			// This is more reliable than DOM parsing for mixed HTML/SVG content
			let sanitized = svgString;

			// Convert common self-closing HTML tags to XML format
			sanitized = sanitized
				.replace(/<br\s*>/gi, "<br/>")
				.replace(/<hr\s*>/gi, "<hr/>")
				.replace(/<img(\s[^>]*)?>/gi, "<img$1/>")
				.replace(/<input(\s[^>]*)?>/gi, "<input$1/>")
				.replace(/<area(\s[^>]*)?>/gi, "<area$1/>")
				.replace(/<base(\s[^>]*)?>/gi, "<base$1/>")
				.replace(/<col(\s[^>]*)?>/gi, "<col$1/>")
				.replace(/<embed(\s[^>]*)?>/gi, "<embed$1/>")
				.replace(/<link(\s[^>]*)?>/gi, "<link$1/>")
				.replace(/<meta(\s[^>]*)?>/gi, "<meta$1/>")
				.replace(/<param(\s[^>]*)?>/gi, "<param$1/>")
				.replace(/<source(\s[^>]*)?>/gi, "<source$1/>")
				.replace(/<track(\s[^>]*)?>/gi, "<track$1/>")
				.replace(/<wbr\s*>/gi, "<wbr/>");

			return sanitized;
		} catch (error) {
			console.error("Error sanitizing SVG:", error);
			// Fallback to original string if sanitization fails
			return svgString;
		}
	}

	async function exportSVG() {
		if (!svg) {
			pushToast("Nothing to export yet.", "warn");
			return;
		}
		const sanitizedSvg = sanitizeSvgForExport(svg);

		download(
			"diagram.svg",
			new Blob([sanitizedSvg], { type: "image/svg+xml" }),
		);
		pushToast("Saved diagram.svg", "ok");
	}

	// Shared PNG renderer used by Export and Copy paths. Returns a Blob, or
	// null if the canvas would exceed browser limits at the requested scale.
	async function renderPNGBlob(scale: number): Promise<Blob | null> {
		const svgElement = containerRef.current?.querySelector("svg");
		if (!svgElement) {
			pushToast("Preview not ready.", "warn");
			return null;
		}
		const { width: baseW, height: baseH } = getSvgSize(svg);
		const width = Math.max(1, Math.round(baseW * scale));
		const height = Math.max(1, Math.round(baseH * scale));
		const MAX_CANVAS_SIZE = 16384;
		if (width > MAX_CANVAS_SIZE || height > MAX_CANVAS_SIZE) {
			pushToast(
				`Canvas would be ${width}×${height}px (limit ${MAX_CANVAS_SIZE}). Re-rendering at 1×.`,
				"warn",
			);
			if (scale === 1) return null;
			return renderPNGBlob(1);
		}

		const cloned = svgElement.cloneNode(true) as SVGElement;
		const foreignObjects = cloned.querySelectorAll("foreignObject");
		foreignObjects.forEach((fo) => {
			fo.querySelectorAll("div, span, p").forEach((el) => {
				(el as HTMLElement).style.color = "#000000";
			});
		});

		const dataUrl = await htmlToImage.toPng(cloned as unknown as HTMLElement, {
			width,
			height,
			backgroundColor: "#ffffff",
			pixelRatio: 1,
			cacheBust: true,
			fontEmbedCSS: "",
		});
		const response = await fetch(dataUrl);
		return await response.blob();
	}

	function getSvgSize(svgText: string): { width: number; height: number } {
		try {
			const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
			const el = doc.documentElement as unknown as SVGElement;
			const parseLen = (v: string | null): number | null => {
				if (!v) return null;
				const matched = v.match(/([0-9]*\.?[0-9]+)/);

				return matched ? parseFloat(matched[1]) : null;
			};
			const w = parseLen(el.getAttribute("width"));
			const h = parseLen(el.getAttribute("height"));

			if (w && h) return { width: w, height: h };
			const vb = el.getAttribute("viewBox");

			if (vb) {
				const p = vb.trim().split(/\s+/).map(Number);

				if (p.length === 4 && Number.isFinite(p[2]) && Number.isFinite(p[3])) {
					return { width: p[2], height: p[3] };
				}
			}
		} catch {}

		return { width: 1000, height: 600 };
	}

	async function exportPNG(scale = pngScale) {
		if (!svg) {
			pushToast("Nothing to export yet.", "warn");
			return;
		}
		try {
			const blob = await renderPNGBlob(scale);
			if (!blob) return;
			download("diagram.png", blob);
			pushToast(`Saved diagram.png (${Math.round(scale * 100)}%)`, "ok");
		} catch (err) {
			pushToast(`PNG export failed: ${(err as Error).message}`, "error");
		}
	}

	async function copySVG() {
		if (!svg) {
			pushToast("Nothing to copy yet.", "warn");
			return;
		}
		await navigator.clipboard.writeText(sanitizeSvgForExport(svg));
		pushToast("Copied SVG markup to clipboard", "ok");
	}

	async function copyPNG() {
		if (!svg) {
			pushToast("Nothing to copy yet.", "warn");
			return;
		}
		try {
			const blob = await renderPNGBlob(1);
			if (!blob) return;

			if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
				try {
					await navigator.clipboard.write([
						new ClipboardItem({ "image/png": blob }),
					]);
					pushToast("Copied PNG to clipboard", "ok");
					return;
				} catch (err) {
					console.warn("Clipboard write failed; downloading instead:", err);
				}
			}
			download("diagram.png", blob);
			pushToast("Clipboard unavailable. Saved diagram.png instead.", "warn");
		} catch (err) {
			pushToast(`PNG copy failed: ${(err as Error).message}`, "error");
		}
	}

	function copyCode() {
		navigator.clipboard.writeText(code);
		pushToast("Copied source to clipboard", "ok");
	}

	function saveMmd() {
		download("diagram.mmd", new Blob([code], { type: "text/plain" }));
		pushToast("Saved diagram.mmd", "ok");
	}

	function shareLink() {
		const u = new URL(window.location.href);
		u.hash = `code=${compressToEncodedURIComponent(code)}`;
		const url = u.toString();
		navigator.clipboard.writeText(url);
		// Keep the URL bar in sync so a refresh preserves the diagram.
		window.history.replaceState(null, "", url);
		pushToast("Share link copied to clipboard", "ok");
	}

	// Real keyboard shortcuts. Modifier+Shift combos that don't collide with
	// browser defaults (avoid plain ⌘C / ⌘S / ⌘L). Editor focus does not block.
	function clearEditor() {
		previousCodeRef.current = code;
		setCode("");
		pushToast("Cleared editor", "info", {
			label: "Restore previous",
			onPress: () => {
				const prev = previousCodeRef.current;
				if (prev != null) {
					setCode(prev);
					previousCodeRef.current = null;
					pushToast("Restored your previous source", "ok");
				}
			},
		});
	}

	// Actions are read through a ref so the listener stays stable while always
	// invoking the latest closure.
	const actionsRef = useRef({
		exportPNG,
		exportSVG,
		shareLink,
		copyPNG,
		copySVG,
		copyCode,
		saveMmd,
		clearEditor,
	});
	actionsRef.current = {
		exportPNG,
		exportSVG,
		shareLink,
		copyPNG,
		copySVG,
		copyCode,
		saveMmd,
		clearEditor,
	};

	// ⌘K command palette
	const [paletteOpen, setPaletteOpen] = useState(false);
	const [paletteQuery, setPaletteQuery] = useState("");
	const [paletteSelected, setPaletteSelected] = useState(0);
	const paletteInputRef = useRef<HTMLInputElement | null>(null);

	type PaletteEntry = {
		id: string;
		label: string;
		shortcut?: string;
		run: () => void;
	};
	// Commands rebuilt each render (cheap). All mutations go through
	// actionsRef or loadExample which already read latest state.
	const paletteCommands: PaletteEntry[] = [
		...EXAMPLE_NAMES.map(
			(k): PaletteEntry => ({
				id: `ex-${k}`,
				label: `Load example: ${k}`,
				run: () => loadExample(k),
			}),
		),
		{
			id: "export-png",
			label: "Export PNG",
			shortcut: "⌘⇧E",
			run: () => actionsRef.current.exportPNG(),
		},
		{
			id: "export-svg",
			label: "Export SVG",
			shortcut: "⌘⇧S",
			run: () => actionsRef.current.exportSVG(),
		},
		{
			id: "copy-png",
			label: "Copy PNG to clipboard",
			shortcut: "⌘⇧C",
			run: () => actionsRef.current.copyPNG(),
		},
		{
			id: "copy-svg",
			label: "Copy SVG markup",
			run: () => actionsRef.current.copySVG(),
		},
		{
			id: "copy-source",
			label: "Copy source",
			run: () => actionsRef.current.copyCode(),
		},
		{
			id: "download",
			label: "Download .mmd",
			run: () => actionsRef.current.saveMmd(),
		},
		{
			id: "share",
			label: "Share link",
			shortcut: "⌘⇧L",
			run: () => actionsRef.current.shareLink(),
		},
		{
			id: "clear",
			label: "Clear editor",
			run: () => actionsRef.current.clearEditor(),
		},
		{
			id: "primer",
			label: "Show help primer",
			run: () => {
				setPrimerOpen(true);
				localStorage.removeItem("viewerPrimerDismissed");
			},
		},
		{
			id: "syntax",
			label: "Open syntax reference",
			run: () => window.open("https://mermaid.js.org/intro/", "_blank"),
		},
	];

	const filteredPalette = paletteCommands.filter((c) =>
		c.label.toLowerCase().includes(paletteQuery.toLowerCase()),
	);

	function runPaletteItem(entry: PaletteEntry) {
		setPaletteOpen(false);
		setPaletteQuery("");
		entry.run();
	}

	useEffect(() => {
		if (paletteOpen && paletteInputRef.current) {
			paletteInputRef.current.focus();
		}
	}, [paletteOpen]);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			const meta = e.metaKey || e.ctrlKey;
			if (!meta) return;

			// ⌘K opens the palette
			if (e.key === "k" || e.key === "K") {
				if (!e.shiftKey) {
					e.preventDefault();
					setPaletteOpen((o) => !o);
					return;
				}
			}

			// Shift combos for direct actions
			if (!e.shiftKey) return;
			const k = e.key.toLowerCase();
			if (k === "e") {
				e.preventDefault();
				actionsRef.current.exportPNG();
			} else if (k === "s") {
				e.preventDefault();
				actionsRef.current.exportSVG();
			} else if (k === "l") {
				e.preventDefault();
				actionsRef.current.shareLink();
			} else if (k === "c") {
				e.preventDefault();
				actionsRef.current.copyPNG();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);

	const previewId = useId();

	const exampleItems = EXAMPLE_NAMES.map((k) => (
		<DropdownItem
			key={k}
			description={EXAMPLE_DESCRIPTIONS[k]}
			startContent={
				<span aria-hidden="true" className="example-glyph">
					<ExampleGlyph kind={k} />
				</span>
			}
		>
			{k}
		</DropdownItem>
	));

	return (
		<div className="flex flex-col gap-4">
			{/* Toolbar: tools, not toys. Pill-shaped secondary buttons read clearly
			    as interactive; copper primary dominates the cluster; status sits
			    inline as microtype. On mobile, secondary actions collapse behind
			    a "more" overflow menu so the primary action stays reachable. */}
			<div className="flex items-center gap-2 flex-wrap">
				<Dropdown placement="bottom-start">
					<DropdownTrigger>
						<button className="tool-btn" type="button">
							examples
							<span aria-hidden="true" className="opacity-70">
								▾
							</span>
						</button>
					</DropdownTrigger>
					<DropdownMenu
						aria-label="Example diagrams"
						selectionMode="single"
						onAction={(key) =>
							loadExample(String(key) as keyof typeof EXAMPLES)
						}
					>
						{exampleItems}
					</DropdownMenu>
				</Dropdown>

				{isMd ? (
					<>
						<span aria-hidden="true" className="tool-div mx-1" />
						<button className="tool-btn" type="button" onClick={copyCode}>
							copy source
						</button>
						<button className="tool-btn" type="button" onClick={saveMmd}>
							download .mmd
						</button>
						<button className="tool-btn" type="button" onClick={shareLink}>
							share link
							<Kbd
								className="!bg-transparent !text-current !shadow-none !px-1 text-[10px] opacity-70"
								keys={["command", "shift"]}
							>
								L
							</Kbd>
						</button>
					</>
				) : (
					<Dropdown placement="bottom-start">
						<DropdownTrigger>
							<button
								aria-label="More actions"
								className="tool-btn"
								type="button"
							>
								more
								<span aria-hidden="true" className="opacity-70">
									▾
								</span>
							</button>
						</DropdownTrigger>
						<DropdownMenu aria-label="More actions">
							<DropdownItem key="copy" onPress={copyCode}>
								Copy source
							</DropdownItem>
							<DropdownItem key="save" onPress={saveMmd}>
								Download .mmd
							</DropdownItem>
							<DropdownItem
								key="share"
								endContent={
									<Kbd className="text-[10px]" keys={["command", "shift"]}>
										L
									</Kbd>
								}
								onPress={shareLink}
							>
								Share link
							</DropdownItem>
						</DropdownMenu>
					</Dropdown>
				)}

				<div className="ml-auto flex items-center gap-3">
					<StatusInline error={error} rendering={rendering} />
					<div className="tool-cluster">
						<button
							className="tool-primary"
							type="button"
							onClick={() => exportPNG()}
						>
							Export PNG
							<Kbd
								className="!bg-transparent !text-current !shadow-none !px-1 text-[10px] opacity-85"
								keys={["command", "shift"]}
							>
								E
							</Kbd>
						</button>
						<Dropdown placement="bottom-end">
							<DropdownTrigger>
								<button
									aria-label="More export options"
									className="tool-primary-split"
									type="button"
								>
									▾
								</button>
							</DropdownTrigger>
							<DropdownMenu aria-label="Export options">
								<DropdownItem
									key="svg"
									description="Vector. Best for editing."
									endContent={
										<Kbd className="text-[10px]" keys={["command", "shift"]}>
											S
										</Kbd>
									}
									onPress={() => exportSVG()}
								>
									Export SVG
								</DropdownItem>
								<DropdownItem
									key="copy-png"
									description="Paste into Confluence, Notion, Slack."
									endContent={
										<Kbd className="text-[10px]" keys={["command", "shift"]}>
											C
										</Kbd>
									}
									onPress={() => copyPNG()}
								>
									Copy PNG to clipboard
								</DropdownItem>
								<DropdownItem key="copy-svg" onPress={() => copySVG()}>
									Copy SVG markup
								</DropdownItem>
							</DropdownMenu>
						</Dropdown>
					</div>
				</div>
			</div>

			{primerOpen ? (
				<div className="primer" role="note">
					<span aria-hidden="true" className="primer-mark">
						<Brandmark size={14} />
					</span>
					<div className="flex-1">
						<div className="primer-title">
							Mermaid turns text into diagrams.
						</div>
						<div className="primer-hint">
							Edit source on the left; preview updates live. Try the{" "}
							<strong className="text-[color:var(--graphite)]">examples</strong>{" "}
							menu, or{" "}
							<a
								className="text-[color:var(--copper)] underline underline-offset-2 hover:text-[color:var(--copper-press)]"
								href="https://mermaid.js.org/intro/"
								rel="noreferrer"
								target="_blank"
							>
								browse syntax
							</a>
							.
						</div>
					</div>
					<button
						aria-label="Dismiss primer"
						className="primer-dismiss"
						type="button"
						onClick={dismissPrimer}
					>
						×
					</button>
				</div>
			) : null}

			{/* Asymmetric workshop layout. Editor is left workbench (inset surface);
			    preview is paper (the hero). 42 / 58 split on desktop. On mobile
			    the preview comes first — see the diagram, reach for the editor
			    when you want to touch it. */}
			<div
				ref={layoutRef}
				className={`flex flex-col-reverse md:flex-row min-h-[40rem] border border-[color:var(--rule)] rounded-md overflow-hidden bg-[color:var(--workbench)] ${dragging ? "select-none" : ""}`}
			>
				<section
					aria-label="Mermaid source editor"
					className="min-w-0 bg-[color:var(--workbench-inset)] flex flex-col"
					style={{ width: isMd ? `${Math.round(split * 100)}%` : "100%" }}
				>
					<PaneTitle
						hint="Source"
						rightHint={`${code.length.toLocaleString()} chars`}
					/>
					<div className="flex-1 min-h-[28rem]">
						<Editor
							beforeMount={handleBeforeMount}
							height="100%"
							language="mermaid"
							options={{
								fixedOverflowWidgets: true,
								wordWrap: "on",
								minimap: { enabled: false },
								padding: { top: 18, bottom: 16 },
								fontSize: 13,
								lineHeight: 22,
								fontFamily:
									'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "JetBrains Mono", "Liberation Mono", monospace',
								lineNumbers: "on",
								scrollBeyondLastLine: false,
								automaticLayout: true,
								renderLineHighlight: "none",
								scrollbar: {
									verticalScrollbarSize: 6,
									horizontalScrollbarSize: 6,
								},
								guides: { indentation: false },
							}}
							theme={dark ? "workshop-dark" : "workshop-light"}
							value={code}
							onChange={(v) => setCode(v ?? "")}
							onMount={(editor, m) => {
								editorRef.current = editor;
								monacoRef.current = m;
							}}
						/>
					</div>
				</section>

				<div
					aria-controls={previewId}
					aria-label="Resize editor and preview panes"
					aria-orientation="vertical"
					aria-valuemax={80}
					aria-valuemin={20}
					aria-valuenow={Math.round(split * 100)}
					className="hidden md:block split-handle w-3"
					data-dragging={dragging}
					role="separator"
					tabIndex={0}
					onKeyDown={onSplitKey}
					onMouseDown={onSplitDragStart}
				/>

				<section
					aria-label="Diagram preview"
					className="min-w-0 flex flex-col paper-grain"
					id={previewId}
					style={{ width: isMd ? `${Math.round((1 - split) * 100)}%` : "100%" }}
				>
					<PaneTitle
						hint="Preview"
						rightHint={
							<div className="flex items-center gap-2">
								<label className="fit-toggle">
									<Switch
										aria-label="Fit to width"
										isSelected={fitWidth}
										size="sm"
										onValueChange={setFitWidth}
									/>
									<span className="fit-toggle-label">fit</span>
								</label>
								<Slider
									aria-label="Zoom"
									className="w-28"
									isDisabled={fitWidth}
									maxValue={3}
									minValue={0.5}
									size="sm"
									step={0.25}
									value={pngScale}
									onChange={(v) =>
										setPngScale(Array.isArray(v) ? v[0] : (v as number))
									}
								/>
								<span className="zoom-readout">
									{fitWidth ? "auto" : `${Math.round(pngScale * 100)}%`}
								</span>
							</div>
						}
					/>
					<div className="relative flex-1">
						<div
							ref={containerRef}
							aria-label="Mermaid diagram preview"
							className="w-full h-full min-h-[28rem] p-6 overflow-auto"
							role="img"
						/>
						{error ? <ErrorOverlay message={error} /> : null}
					</div>
				</section>
			</div>

			{/* ⌘K Command palette */}
			{paletteOpen ? (
				<div
					className="palette-overlay"
					onClick={(e) => {
						if (e.target === e.currentTarget) {
							setPaletteOpen(false);
							setPaletteQuery("");
						}
					}}
					onKeyDown={(e) => {
						if (e.key === "Escape") {
							setPaletteOpen(false);
							setPaletteQuery("");
						} else if (e.key === "ArrowDown") {
							e.preventDefault();
							setPaletteSelected((i) =>
								Math.min(i + 1, filteredPalette.length - 1),
							);
						} else if (e.key === "ArrowUp") {
							e.preventDefault();
							setPaletteSelected((i) => Math.max(i - 1, 0));
						} else if (e.key === "Enter") {
							e.preventDefault();
							const entry = filteredPalette[paletteSelected];
							if (entry) runPaletteItem(entry);
						}
					}}
				>
					<div
						className="palette-box"
						role="dialog"
						aria-label="Command palette"
					>
						<input
							ref={paletteInputRef}
							className="palette-input"
							placeholder="Type a command… (⌘K)"
							type="text"
							value={paletteQuery}
							onChange={(e) => {
								setPaletteQuery(e.target.value);
								setPaletteSelected(0);
							}}
						/>
						<div className="palette-list" role="listbox">
							{filteredPalette.length === 0 ? (
								<div className="palette-empty">No matching commands</div>
							) : (
								filteredPalette.map((entry, i) => (
									<div
										key={entry.id}
										className="palette-item"
										data-selected={i === paletteSelected}
										role="option"
										aria-selected={i === paletteSelected}
										onClick={() => runPaletteItem(entry)}
										onMouseEnter={() => setPaletteSelected(i)}
									>
										<span>{entry.label}</span>
										{entry.shortcut ? (
											<span className="palette-item-shortcut">
												{entry.shortcut}
											</span>
										) : null}
									</div>
								))
							)}
						</div>
					</div>
				</div>
			) : null}

			<div aria-atomic="false" aria-live="polite" className="toast-region">
				{toasts.map((t) => (
					<div
						key={t.id}
						className={`toast pointer-events-auto px-3 py-2 rounded-md border shadow-sm text-[13px] max-w-sm flex items-center ${toastClasses(t.tone)}`}
						role={t.tone === "error" ? "alert" : "status"}
					>
						<span className="flex-1">{t.message}</span>
						{t.action ? (
							<button
								className="toast-action"
								type="button"
								onClick={() => {
									t.action?.onPress();
									setToasts((cur) => cur.filter((x) => x.id !== t.id));
								}}
							>
								{t.action.label}
							</button>
						) : null}
					</div>
				))}
			</div>
		</div>
	);
}

function PaneTitle({
	hint,
	rightHint,
}: {
	hint: string;
	rightHint?: React.ReactNode;
}) {
	return (
		<div className="flex items-center justify-between px-4 h-9 border-b border-[color:var(--rule)] bg-[color:var(--workbench)]">
			<span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--pencil)]">
				{hint}
			</span>
			<div className="text-[11px] text-[color:var(--graphite)]">
				{rightHint}
			</div>
		</div>
	);
}

function StatusInline({
	rendering,
	error,
}: {
	rendering: boolean;
	error: string | null;
}) {
	const tone = error ? "error" : rendering ? "rendering" : "ok";
	const dot =
		tone === "error"
			? "var(--rust)"
			: tone === "rendering"
				? "var(--copper)"
				: "var(--moss)";
	const label =
		tone === "error"
			? "parse error"
			: tone === "rendering"
				? "rendering…"
				: "valid";
	return (
		<span
			aria-live="polite"
			className="font-mono text-[11px] uppercase tracking-[0.14em] text-[color:var(--graphite)] flex items-center gap-1.5"
		>
			<span
				aria-hidden="true"
				className="status-dot"
				style={{ background: dot }}
			/>
			{label}
		</span>
	);
}

function ErrorOverlay({ message }: { message: string }) {
	return (
		<div className="absolute left-4 right-4 bottom-4 max-w-2xl rounded-md border border-[color:var(--rust)] bg-[color:var(--paper)] p-3 shadow-sm">
			<div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--rust)] mb-1">
				parse error
			</div>
			<pre className="font-mono text-[12px] text-[color:var(--ink)] whitespace-pre-wrap break-words">
				{message}
			</pre>
		</div>
	);
}

function toastClasses(tone: ToastTone): string {
	switch (tone) {
		case "ok":
			return "bg-[color:var(--paper)] border-[color:var(--moss)] text-[color:var(--ink)]";
		case "warn":
			return "bg-[color:var(--paper)] border-[color:var(--copper)] text-[color:var(--ink)]";
		case "error":
			return "bg-[color:var(--paper)] border-[color:var(--rust)] text-[color:var(--ink)]";
		default:
			return "bg-[color:var(--paper)] border-[color:var(--rule)] text-[color:var(--ink)]";
	}
}
