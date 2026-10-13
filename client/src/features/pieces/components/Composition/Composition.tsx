import React, { useState } from "react";
import { WorkCompositionItem, RoleBreakdown } from "@shared/types/social";
import styles from "./Composition.module.css";

interface CompositionProps {
	items: WorkCompositionItem[];
}

const ROLE_COLORS: Record<keyof RoleBreakdown, string> = {
	artist: "var(--color-yellow)",
	fan: "var(--color-green)",
	organizer: "var(--color-blue)",
};

export function Composition({ items }: CompositionProps) {
	const [hoveredRole, setHoveredRole] = useState<keyof RoleBreakdown | null>(null);

	const allCounts = items.flatMap((item) => Object.values(item.roles));
	const maxGlobalCount = Math.max(...allCounts, 1);

	if (items.length === 0) {
		return <div className={styles.empty}>No Composition data yet.</div>;
	}

	return (
		<div className={styles.compositionContainer}>
			{items.map((item) => (
				<IntermezzoRow
					key={item.id}
					item={item}
					maxGlobalCount={maxGlobalCount}
					hoveredRole={hoveredRole}
					onHoverRole={setHoveredRole}
				/>
			))}
		</div>
	);
}

interface IntermezzoRowProps {
	item: WorkCompositionItem;
	maxGlobalCount: number;
	hoveredRole: keyof RoleBreakdown | null;
	onHoverRole: (role: keyof RoleBreakdown | null) => void;
}

function IntermezzoRow({ item, maxGlobalCount, hoveredRole, onHoverRole }: IntermezzoRowProps) {
	const timePercent = getTimePositionPercent(item.createdAt);
	const roles: (keyof RoleBreakdown)[] = ["artist", "fan", "organizer"];

	return (
		<div className={styles.versionRow}>
			<div
				className={styles.versionLabelWrapper}
				style={{ left: `${timePercent}%` }}>
				<span className={styles.versionLabel}>
					Version {item.versionNumber} {item.isCurrent && "(Current)"}
				</span>
			</div>

			{/* 3 Activity Bars varying in height by role volume */}
			<div className={styles.barsGroup}>
				{roles.map((roleKey) => {
					const count = item.roles[roleKey] || 0;
					// Proportional height calculation with a minimum floor of 12px
					const heightPx = Math.max(12, (count / maxGlobalCount) * 72);
					const isHovered = hoveredRole === roleKey;

					return (
						<div
							key={roleKey}
							className={`${styles.activityBar} ${isHovered ? styles.activeBar : ""}`}
							style={{
								height: `${heightPx}px`,
								backgroundColor: isHovered ? ROLE_COLORS[roleKey] : undefined,
							}}
							onMouseEnter={() => onHoverRole(roleKey)}
							onMouseLeave={() => onHoverRole(null)}
							title={`${roleKey.toUpperCase()}: ${count} interactions`}
						/>
					);
				})}
			</div>
		</div>
	);
}

// Maps 00:00 to 0%, 12:00 (noon) to 50%, and 24:00 to 100%
function getTimePositionPercent(createdAt: string): number {
	const date = new Date(createdAt);
	const hours = date.getHours() + date.getMinutes() / 60;
	const percent = (hours / 24) * 100;
	// Clamp between 10% and 90% so labels don't clip off screen edges
	return Math.max(10, Math.min(90, percent));
}
