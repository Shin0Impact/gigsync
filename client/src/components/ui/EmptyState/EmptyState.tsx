import { useState, useRef, useEffect } from "react";
import { Voronoi } from "@paper-design/shaders-react";
import styles from "./EmptyState.module.css";
import { ButtonLink } from "../Button";

interface EmptyStateProps {
	title: string;
	subtitle?: string;
	actionLabel: string;
	to?: string;
	href?: string;
	onAction?: () => void;
}

export function EmptyState({ title, subtitle, actionLabel, to, href, onAction }: EmptyStateProps) {
	const [distortion, setDistortion] = useState(0);
	const targetDistortion = useRef(0);
	const animationFrameId = useRef<number | null>(null);

	useEffect(() => {
		const updateDistortion = () => {
			setDistortion((prev) => {
				const diff = targetDistortion.current - prev;
				if (Math.abs(diff) < 0.001) {
					return targetDistortion.current;
				}
				return prev + diff * 0.08;
			});

			animationFrameId.current = requestAnimationFrame(updateDistortion);
		};

		animationFrameId.current = requestAnimationFrame(updateDistortion);

		return () => {
			if (animationFrameId.current !== null) {
				cancelAnimationFrame(animationFrameId.current);
			}
		};
	}, []);

	const handleMouseEnter = () => {
		targetDistortion.current = 0.33;
	};

	const handleMouseLeave = () => {
		targetDistortion.current = 0;
	};

	return (
		<div className={styles.container}>
			<div className={styles.shaderWrapper}>
				<Voronoi
					width={1280}
					height={720}
					colors={["#fafafa"]}
					colorGlow="#ffffff"
					colorGap="#262626"
					stepsPerColor={1}
					distortion={distortion}
					gap={0.02}
					glow={0}
					speed={1}
					scale={0.5}
				/>
			</div>

			<div className={styles.content}>
				<h2 className={styles.title}>{title}</h2>
				{subtitle && <p className={styles.subtitle}>{subtitle}</p>}

				{to ? (
					<ButtonLink
						to={to}
						onMouseEnter={handleMouseEnter}
						onMouseLeave={handleMouseLeave}>
						{actionLabel}
					</ButtonLink>
				) : href ? (
					<ButtonLink
						href={href}
						onMouseEnter={handleMouseEnter}
						onMouseLeave={handleMouseLeave}>
						{actionLabel}
					</ButtonLink>
				) : (
					<ButtonLink
						href="#"
						onClick={(e) => {
							e.preventDefault();
							onAction?.();
						}}
						onMouseEnter={handleMouseEnter}
						onMouseLeave={handleMouseLeave}>
						{actionLabel}
					</ButtonLink>
				)}
			</div>
		</div>
	);
}
