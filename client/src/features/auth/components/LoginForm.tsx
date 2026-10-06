import { useState, type FormEvent } from "react";
import { useLoginMutation } from "../authApi";
import styles from "./AuthForm.module.css";

interface LoginFormProps {
	onSuccess: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [login, { isLoading, error }] = useLoginMutation();

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		try {
			await login({ email, password }).unwrap();
			onSuccess();
		} catch {
			// server-side error is already tracked by the mutation hook
		}
	}

	return (
		<form
			className={styles.authForm}
			onSubmit={handleSubmit}>
			<div className={styles.field}>
				<label htmlFor="login-email">Email</label>
				<input
					id="login-email"
					type="email"
					autoComplete="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
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
	);
}
