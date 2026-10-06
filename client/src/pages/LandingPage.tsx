import Hero from "../features/landing/Hero";
import { Navbar } from "../features/landing/Navbar";
import styles from "./LandingPage.module.css";

export function LandingPage() {
	return (
		<div className={styles.landingPage}>
			<Navbar />
			<Hero />
		</div>
	);
}
