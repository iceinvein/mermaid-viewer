import { Button, ButtonGroup } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/dropdown";
import { Kbd } from "@heroui/kbd";
import { Link } from "@heroui/link";
import { Slider } from "@heroui/slider";

import { Switch } from "@heroui/switch";
import Editor from "@monaco-editor/react";

import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import mermaid from "mermaid";
import { useEffect, useId, useRef, useState } from "react";

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
  Kanban: `kanban\n  todo[Todo]\n    t1[Write spec] @{assigned: "Alice", ticket: "ABC-123"}\n    t2[Design UI]\n  doing[In Progress]\n    t3[Implement]\n  done[Done]\n    t4[Test] @{assigned: "Bob", priority: "High"}`,
  Architecture: `architecture-beta\n  group web(cloud)[Web]\n  service api(server)[API] in web\n  service db(database)[DB]\n  api:R --> L:db`,
};

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
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [pngScale, setPngScale] = useState<number>(2);
  const [fitWidth, setFitWidth] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const codeId = useId();
  const monacoRef = useRef<any>(null);
  const editorRef = useRef<any>(null);
  const shareInputRef = useRef<HTMLInputElement | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  const layoutRef = useRef<HTMLDivElement | null>(null);
  const [split, setSplit] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const v = parseFloat(localStorage.getItem("viewerSplit") || "");
      if (!Number.isNaN(v) && v > 0.2 && v < 0.8) return v;
    }
    return 0.5;
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

  const handleBeforeMount = (monaco: any) => {
    if (HAS_REGISTERED_MERMAID_LANG) return;
    HAS_REGISTERED_MERMAID_LANG = true;

    monaco.languages.register({ id: "mermaid" });
    monaco.languages.setMonarchTokensProvider("mermaid", {
      ignoreCase: true,
      tokenizer: {
        root: [
          [/%%\{.*\}%%/, "meta"],
          [/%%.*$/, "comment"],
          [/"([^"\\]|\\.)*"/, "string"],
          [/'([^'\\]|\\.)*'/, "string"],
          [/\b\d+(\.\d+)?\b/, "number"],
          [/(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|stateDiagram-v2|gantt|pie|journey|gitGraph|mindmap|timeline|quadrantChart|erDiagram|requirementDiagram|c4context|c4container|c4component|c4deployment|c4dynamic|c4relationship|info|kanban|architecture-beta|xychart-beta|treemap-beta)\b/, "keyword"],
          [/(subgraph|end|direction|linkStyle|style|click|classDef|class|accTitle|accDescr|accTitle:|accDescr:|alt|opt|loop|par|rect|else|and|note|activate|deactivate|participant|actor|state|section|title|dateFormat|axisFormat|interpolate)\b/, "keyword"],
          [/\b(TD|LR|RL|BT)\b/, "keyword"],
          [/(-->|--x|--o|==>|-\.\->|\.-\->|==x|==o|===|--)/, "operator"],
          [/\[|\]|\{|\}|\(|\)/, "delimiter"],
          [/[_A-Za-z][_A-Za-z0-9-]*/, "identifier"],
        ],
      },
    });
  };


  const theme = dark ? "dark" : "neutral";

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme });
  }, [theme]);

  // Render Mermaid to SVG string (independent of the DOM container)
  useEffect(() => {
    let cancelled = false;
    async function render() {
      try {
        setError(null);
        const { svg } = await mermaid.render(
          `mmd-${Math.random().toString(36).slice(2)}`,
          code,
        );
        if (cancelled) return;
        setSvg(svg);
      } catch (e) {
        if (!cancelled) {
          setSvg("");
          setError((e as Error).message);
        }
      }
    }
    render();
    return () => { cancelled = true; };
  }, [code, theme]);

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
    const monaco = monacoRef.current;
    const editor = editorRef.current;
    if (!monaco || !editor) return;
    const model = editor.getModel?.();
    if (!model) return;

    const markers: any[] = [];
    if (error) {
      let line = 1;
      const m = /line\s+(\d+)/i.exec(error);
      if (m) line = Math.max(1, parseInt(m[1], 10));
      markers.push({
        startLineNumber: line,
        startColumn: 1,
        endLineNumber: line,
        endColumn: 1000,
        message: error,
        severity: monaco.MarkerSeverity.Error,
      });
    }
    monaco.editor.setModelMarkers(model, "mermaid", markers);
  }, [error]);


  function loadExample(name: keyof typeof EXAMPLES) {
    setCode(EXAMPLES[name]);
  }

  function download(filename: string, blob: Blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportSVG() {
    if (!svg) return;
    download("diagram.svg", new Blob([svg], { type: "image/svg+xml" }));
  }

  function getSvgSize(svgText: string): { width: number; height: number } {
    try {
      const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
      const el = doc.documentElement as unknown as SVGElement;
      const parseLen = (v: string | null): number | null => {
        if (!v) return null;
        const m = /([0-9]*\.?[0-9]+)/.exec(v);
        return m ? parseFloat(m[1]) : null;
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
    if (!svg) return;
    const { width: baseW, height: baseH } = getSvgSize(svg);
    const img = new Image();
    const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (e) => reject(e);
      img.src = url;
    });
    const width = Math.max(1, Math.round(baseW * scale));
    const height = Math.max(1, Math.round(baseH * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let bg = getComputedStyle(document.documentElement).getPropertyValue("--background").trim();
    if (!bg) bg = "#ffffff";
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    URL.revokeObjectURL(url);
    const blob: Blob | null = await new Promise((r) => canvas.toBlob((b) => r(b), "image/png"));
    if (blob) download("diagram.png", blob);
  }

  async function copySVG() {
    if (!svg) return;
    await navigator.clipboard.writeText(svg);
  }

  async function copyPNG() {
    if (!svg) return;
    const { width: baseW, height: baseH } = getSvgSize(svg);
    const img = new Image();
    const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (e) => reject(e);
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    const width = Math.max(1, Math.round(baseW));
    const height = Math.max(1, Math.round(baseH));
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let bg = getComputedStyle(document.documentElement).getPropertyValue("--background").trim();
    if (!bg) bg = "#ffffff";
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    URL.revokeObjectURL(url);
    const blob: Blob | null = await new Promise((r) => canvas.toBlob((b) => r(b), "image/png"));
    if (!blob) return;
    if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
      try {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        return;
      } catch {}
    }
    download("diagram.png", blob);
  }

  function copyCode() {
    navigator.clipboard.writeText(code);
  }

  function saveMmd() {
    download("diagram.mmd", new Blob([code], { type: "text/plain" }));
  }

  function shareLink() {
    const u = new URL(window.location.href);
    u.hash = `code=${compressToEncodedURIComponent(code)}`;
    const url = u.toString();
    setShareUrl(url);
    navigator.clipboard.writeText(url);
  }
  function copyShareUrl() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setShareCopied(true);
    window.setTimeout(() => setShareCopied(false), 1500);
  }


  return (
    <div
      ref={layoutRef}
      className={`flex flex-col md:flex-row gap-6 ${dragging ? "select-none" : ""}`}
    >
      <div className="min-w-0" style={{ width: isMd ? `${Math.round(split * 100)}%` : "100%" }}>
        <Card className="border-1 border-default-200 bg-content1">
          <CardHeader className="py-3">
            <label htmlFor={codeId} className="text-sm font-semibold">Editor</label>
          </CardHeader>
          <CardBody className="gap-3">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Dropdown>
                <DropdownTrigger>
                  <Button size="sm" variant="light">Examples</Button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Example diagrams"
                  selectionMode="single"
                  onAction={(key) => loadExample(String(key) as keyof typeof EXAMPLES)}
                >
                  {Object.keys(EXAMPLES).map((k) => (
                    <DropdownItem key={k}>{k}</DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>
              <ButtonGroup size="sm" variant="flat">
                <Button onPress={copyCode}>Copy <Kbd className="ml-1" keys={["command"]}>C</Kbd></Button>
                <Button onPress={saveMmd}>Save .mmd <Kbd className="ml-1" keys={["command"]}>S</Kbd></Button>
                <Button onPress={shareLink}>Share</Button>
              </ButtonGroup>
              <Link isExternal href="https://mermaid.js.org/intro/">Docs</Link>
              {error ? (
                <Chip size="sm" color="danger" variant="faded">Error</Chip>
              ) : (
                <Chip size="sm" color="success" variant="faded">Valid</Chip>
              )}
            </div>
            {shareUrl ? (
              <div className="flex items-center gap-2 mb-1">
                <input
                  ref={shareInputRef}
                  type="text"
                  readOnly
                  value={shareUrl}
                  aria-label="Share URL"
                  placeholder="Share URL"
                  onFocus={(e) => e.currentTarget.select()}
                  className="flex-1 w-0 max-w-full px-3 py-2 text-sm rounded-medium border-1 border-default-200 bg-content2 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary font-mono truncate overflow-hidden whitespace-nowrap"
                />
                <Button
                  isIconOnly
                  size="sm"
                  variant="flat"
                  aria-label="Copy share URL"
                  onPress={copyShareUrl}
                >
                  {shareCopied ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-5">
                      <path fillRule="evenodd" d="M9 12.75 11.25 15l3.75-4.5a.75.75 0 1 1 1.2.9l-4.5 5.4a.75.75 0 0 1-1.125.075l-2.25-2.25a.75.75 0 1 1 1.06-1.06z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" className="size-5">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth="1.5"></rect>
                      <rect x="3" y="3" width="13" height="13" rx="2" ry="2" strokeWidth="1.5"></rect>
                    </svg>
                  )}
                </Button>
              </div>
            ) : null}
            <div className="w-full rounded-medium border-1 border-default-200 bg-content2">
              <Editor
                value={code}
                onChange={(v) => setCode(v ?? "")}
                theme={dark ? "vs-dark" : "vs-light"}
                language="mermaid"
                beforeMount={handleBeforeMount}
                options={{
                      fixedOverflowWidgets: true,

                  wordWrap: "on",
                  minimap: { enabled: false },
                  padding: { top: 24, bottom: 16 },
                  fontSize: 13,
                  lineHeight: 20,
                  fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
                height="32rem"
                onMount={(editor, monaco) => {
                  editorRef.current = editor;
                  monacoRef.current = monaco;
                }}
              />
            </div>
          </CardBody>
        </Card>
      </div>
      <div
        className="hidden md:block w-1 rounded bg-default-200 hover:bg-default-300 active:bg-primary cursor-col-resize"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panels"
        onMouseDown={onSplitDragStart}
      />

      <div className="min-w-0" style={{ width: isMd ? `${Math.round((1 - split) * 100)}%` : "100%" }}>
        <Card className="border-1 border-default-200 bg-content1">
          <CardHeader className="py-3">
            <span className="text-sm font-semibold">Preview</span>
          </CardHeader>
          <CardBody>
            <div className="flex gap-2 flex-wrap items-center mb-2">
              <Switch size="sm" isSelected={fitWidth} onValueChange={setFitWidth}>Fit width</Switch>

              <Slider
                size="sm"
                aria-label="Zoom"
                minValue={0.5}
                maxValue={3}
                step={0.25}
                value={pngScale}
                onChange={(v) => setPngScale(Array.isArray(v) ? v[0] : (v as number))}
                isDisabled={fitWidth}
                className="max-w-xs"
              />
              <Chip size="sm" variant="faded">
                {fitWidth ? "Auto" : `${Math.round(pngScale * 100)}%`}
              </Chip>
              <ButtonGroup size="sm" variant="flat">
                <Button onPress={() => exportSVG()}>Export SVG</Button>
                <Button onPress={() => exportPNG()}>Export PNG</Button>
                <Button onPress={copySVG}>Copy SVG</Button>
                <Button onPress={copyPNG}>Copy PNG</Button>
              </ButtonGroup>
            </div>
            <div
              ref={containerRef}
              role="img"
              aria-label="Mermaid preview"
              className="w-full min-h-80 md:min-h-[32rem] rounded-medium border-1 border-default-200 bg-content2 p-3 overflow-auto"
            />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

