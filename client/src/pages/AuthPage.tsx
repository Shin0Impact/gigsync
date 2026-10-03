import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LoginForm } from "../features/auth/components/LoginForm";
import { SignupForm } from "../features/auth/components/SignupForm";
import { ROUTES } from "../routes/routePaths";
import styles from "./AuthPage.module.css";
import { Logo } from "../components/Logo";
import { Voronoi } from "@paper-design/shaders-react";

type AuthMode = "login" | "signup";

export function AuthPage() {
	const [mode, setMode] = useState<AuthMode>("login");
	const navigate = useNavigate();

	function handleLoginSuccess() {
		navigate(ROUTES.FEED, { replace: true });
	}
	function handleSignupSuccess() {
		navigate(ROUTES.ONBOARDING, { replace: true });
	}

	return (
		<div className={styles.authPage}>
			<Link
				to={ROUTES.HOME}
				className={styles.sidebar}
				aria-label="Home">
				<div className={styles.glyphArea}>
					<Logo
						variant="mark"
						orientation="vertical"
						size="fill"
						className={styles.verticalGlyph}
					/>
				</div>
				<span className={styles.sidebarWordmark}>Mezzo</span>
			</Link>

			<main className={styles.contentContainer}>
				<div className={styles.formShaderWrapper}>
					<Voronoi
						width={"auto"}
						height={"100vh"}
						colors={["#fafafa"]}
						colorGap="#272727"
						stepsPerColor={1}
						distortion={0.33}
						gap={0.02}
						glow={0}
						speed={0}
						scale={0.27}
					/>
				</div>

				<div className={styles.formWrapper}>
					<h1 className={styles.title}>
						{mode === "login" ? "Welcome back" : "Join Mezzo"}
					</h1>

					{mode === "login" ? (
						<LoginForm onSuccess={handleLoginSuccess} />
					) : (
						<SignupForm onSuccess={handleSignupSuccess} />
					)}

					<button
						type="button"
						className={styles.toggleButton}
						onClick={() => setMode(mode === "login" ? "signup" : "login")}>
						{mode === "login"
							? "Don't have an account? Sign up"
							: "Already have an account? Log in"}
					</button>
				</div>
			</main>
		</div>
	);
}
