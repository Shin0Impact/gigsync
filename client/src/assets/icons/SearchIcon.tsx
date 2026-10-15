export function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			width="1em"
			height="1em"
			fill="none"
			stroke="currentColor"
			strokeWidth="2.4"
			strokeLinecap="round"
			{...props}>
			<circle
				cx="10.5"
				cy="10.5"
				r="6.5"
			/>
			<line
				x1="15.3"
				y1="15.3"
				x2="21"
				y2="21"
			/>
		</svg>
	);
}
