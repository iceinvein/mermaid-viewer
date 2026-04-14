/**
 * Workshop palette: hex equivalents of the OKLCH tokens defined in
 * src/styles/globals.css. Use these when a consumer (like Mermaid's
 * themeVariables or a <meta theme-color>) does not accept CSS variables.
 *
 * Single source of truth: if you change a value here, update the
 * corresponding OKLCH in globals.css AND the heroui theme config in
 * tailwind.config.js to match. All three must stay in sync.
 */

export const WORKSHOP_LIGHT = {
	paper: "#fbf9f3",
	workbench: "#f4f1e8",
	workbenchInset: "#ece8dd",
	rule: "#dcd6c8",
	ink: "#231e1a",
	graphite: "#675f55",
	pencil: "#857d72",
	copper: "#b4561e",
	copperPress: "#9a4719",
	rust: "#a13d18",
	moss: "#3d7a4a",
} as const;

export const WORKSHOP_DARK = {
	paper: "#1c1814",
	workbench: "#252019",
	workbenchInset: "#2c2620",
	rule: "#3d362c",
	ink: "#ebe6dd",
	graphite: "#b8b1a5",
	pencil: "#9b9286",
	copper: "#d68152",
	copperPress: "#c07449",
	rust: "#d56b3e",
	moss: "#7fb88a",
} as const;

export type WorkshopPalette = typeof WORKSHOP_LIGHT;

/** Build a Mermaid themeVariables object tied to the workshop palette. */
export function mermaidThemeFor(mode: "light" | "dark") {
	const p = mode === "dark" ? WORKSHOP_DARK : WORKSHOP_LIGHT;
	return {
		background: p.paper,
		primaryColor: p.workbench,
		primaryTextColor: p.ink,
		primaryBorderColor: p.copper,
		lineColor: p.graphite,
		secondaryColor: p.workbenchInset,
		tertiaryColor: p.paper,
		fontFamily: "Switzer, ui-sans-serif, system-ui, sans-serif",
	};
}
