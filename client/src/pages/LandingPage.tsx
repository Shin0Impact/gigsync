import Hero from "../features/landing/Hero";
import { GuestNavigation } from "../features/landing/GuestNavigation";
import styles from "./LandingPage.module.css";

export function LandingPage() {
	return (
		<div className={styles.landingPage}>
			<GuestNavigation />
			<Hero />
		</div>
	);
}
