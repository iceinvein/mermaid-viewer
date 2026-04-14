/**
 * Brandmark: inline SVG version of the ⌗ glyph used for favicon + header.
 * Rendered from paths so it doesn't depend on Erode being loaded and
 * stays crisp at every size.
 */
export function Brandmark({
	size = 18,
	className,
}: {
	size?: number;
	className?: string;
}) {
	return (
		<svg
			aria-hidden="true"
			className={className}
			fill="none"
			height={size}
			stroke="currentColor"
			strokeLinecap="round"
			strokeWidth={3.5}
			viewBox="0 0 20 20"
			width={size}
			xmlns="http://www.w3.org/2000/svg"
		>
			<line x1="7.2" y1="3" x2="5.8" y2="17" />
			<line x1="14.2" y1="3" x2="12.8" y2="17" />
			<line x1="3.5" y1="7.5" x2="17" y2="7.5" />
			<line x1="3" y1="12.5" x2="16.5" y2="12.5" />
		</svg>
	);
}
