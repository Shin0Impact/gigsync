import { useState, useRef, useEffect } from "react";
import { Metaballs } from "@paper-design/shaders-react";

interface LazyShaderProps {
	count: number;
	size: number;
	speed: number;
	color: string;
}

export function LazyShader({ count, size, speed, color }: LazyShaderProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				// Toggle visibility based on whether it's currently on screen
				setIsVisible(entry.isIntersecting);
			},
			{ rootMargin: "100px" },
		);

		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	return (
		<div
			ref={containerRef}
			style={{ width: "100%", height: "100%" }}>
			{isVisible ? (
				<Metaballs
					width={"auto"}
					height={"100%"}
					colors={[color]}
					colorBack="#00000000"
					count={count}
					size={size}
					speed={speed}
					scale={2}
				/>
			) : null}
		</div>
	);
}
