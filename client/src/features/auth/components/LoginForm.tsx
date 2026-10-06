import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useLoginMutation } from "../authApi";
import styles from "./AuthForm.module.css";
import { ROUTES } from "../../../routes/routePaths";

interface LoginFormProps {
	onSuccess: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [login, { isLoading, error }] = useLoginMutation();

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		try {
			await login({ identifier: email, password }).unwrap();
			onSuccess();
		} catch {
			// error state is already tracked by the mutation hook
		}
	}

	function handleNeedAccount() {
		navigate(ROUTES.SIGNUP);
	}

	return (
		<div className={styles.formWrapper}>
			<div className={styles.formHeader}>
				{/* Empty left placeholder or a subtle back link if needed */}
				<div style={{ width: "60px" }} />

				<div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
					<span style={{ fontSize: "0.875rem", opacity: 0, fontWeight: 500 }}>w</span>
				</div>

				<button
					type="button"
					onClick={handleNeedAccount}
					className={styles.toggleButton}
					style={{ textAlign: "right", margin: 0 }}>
					No account yet?
				</button>
			</div>

			<div className={styles.formBody}>
				<h1 className={styles.title}>Good to see you again.</h1>

				<form
					className={styles.authForm}
					onSubmit={handleSubmit}
					style={{ margin: "0 auto" }}>
					<div className={styles.field}>
						<label htmlFor="login-email">Email</label>
						<input
							id="login-email"
							type="email"
							autoComplete="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							autoFocus
						/>
					</div>

					<div className={styles.field}>
						<label htmlFor="login-password">Password</label>
						<input
							id="login-password"
							type="password"
							autoComplete="current-password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
						/>
					</div>

					{error && (
						<p
							className={styles.fieldError}
							role="alert">
							Couldn't log in. Check your email and password and try again.
						</p>
					)}

					<button
						type="submit"
						className={styles.authSubmit}
						disabled={isLoading}>
						{isLoading ? "Logging in…" : "Log in"}
					</button>
				</form>
			</div>
		</div>
	);
}
