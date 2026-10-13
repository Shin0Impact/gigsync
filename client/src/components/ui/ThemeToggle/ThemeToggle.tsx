import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../../app/ThemeProvider";
import styles from "./ThemeToggle.module.css";

interface ThemeToggleProps {
	size?: "sm" | "md";
	className?: string;
}

// Flips the whole site between light and dark mode (app/ThemeProvider.tsx) -
// previously there was no toggle anywhere, just the OS's own
// prefers-color-scheme mirrored straight through via CSS. Reused both as
// the compact icon in the Sidebar (size="sm") and the labelled control on
// the Settings page (size="md").
export function ThemeToggle({ size = "md", className = "" }: ThemeToggleProps) {
	const { theme, toggleTheme } = useTheme();
	const isDark = theme === "dark";

	return (
		<button
			type="button"
			className={`${styles.toggle} ${className}`.trim()}
			data-size={size}
			onClick={toggleTheme}
			aria-pressed={isDark}
			aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
			title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
			{isDark ? <Sun size={size === "sm" ? 16 : 20} /> : <Moon size={size === "sm" ? 16 : 20} />}
			{size === "md" && <span>{isDark ? "Light mode" : "Dark mode"}</span>}
		</button>
	);
}
