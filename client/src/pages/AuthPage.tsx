import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoginForm } from "../features/auth/components/LoginForm";
import { SignupForm } from "../features/auth/components/SignupForm";
import { ROUTES } from "../routes/routePaths";

type AuthMode = "login" | "signup";

export function AuthPage() {
	const [mode, setMode] = useState<AuthMode>("login");
	const navigate = useNavigate();

	// Login and signup land in different places on purpose: a returning user
	// goes straight to the feed, a brand-new user goes to onboarding first.
	function handleLoginSuccess() {
		navigate(ROUTES.FEED, { replace: true });
	}
	function handleSignupSuccess() {
		navigate(ROUTES.ONBOARDING, { replace: true });
	}

	return (
		<div className="auth-page">
			<h1 className="auth-page-title">
				{mode === "login" ? "Log in" : "Create your account"}
			</h1>

			{mode === "login" ? (
				<LoginForm onSuccess={handleLoginSuccess} />
			) : (
				<SignupForm onSuccess={handleSignupSuccess} />
			)}

			<button
				type="button"
				className="auth-toggle"
				onClick={() => setMode(mode === "login" ? "signup" : "login")}>
				{mode === "login"
					? "Don't have an account? Sign up"
					: "Already have an account? Log in"}
			</button>
		</div>
	);
}
