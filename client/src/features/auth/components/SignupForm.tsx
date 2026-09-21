import { useState, type FormEvent } from "react";
import { useRegisterMutation } from "../authApi";

interface SignupFormProps {
	onSuccess: () => void;
}

export function SignupForm({ onSuccess }: SignupFormProps) {
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [localError, setLocalError] = useState<string | null>(null);

	const [register, { isLoading, error }] = useRegisterMutation();

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setLocalError(null);

		if (password !== confirmPassword) {
			setLocalError("Passwords don't match.");
			return;
		}
		if (password.length < 8) {
			setLocalError("Password must be at least 8 characters.");
			return;
		}

		try {
			await register({ username, email, password }).unwrap();
			onSuccess();
		} catch {
			// server-side error is already tracked by the mutation hook (see `error` above)
		}
	}

	return (
		<form
			className="auth-form"
			onSubmit={handleSubmit}>
			<div className="field">
				<label htmlFor="signup-username">Username</label>
				<input
					id="signup-username"
					type="text"
					autoComplete="username"
					value={username}
					onChange={(e) => setUsername(e.target.value)}
					required
				/>
			</div>

			<div className="field">
				<label htmlFor="signup-email">Email</label>
				<input
					id="signup-email"
					type="email"
					autoComplete="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
				/>
			</div>

			<div className="field">
				<label htmlFor="signup-password">Password</label>
				<input
					id="signup-password"
					type="password"
					autoComplete="new-password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
				/>
			</div>

			<div className="field">
				<label htmlFor="signup-confirm-password">Confirm password</label>
				<input
					id="signup-confirm-password"
					type="password"
					autoComplete="new-password"
					value={confirmPassword}
					onChange={(e) => setConfirmPassword(e.target.value)}
					required
				/>
			</div>

			{(localError || error) && (
				<p
					className="field-error"
					role="alert">
					{localError ??
						"Couldn't create your account. That email or username may already be taken."}
				</p>
			)}

			<button
				type="submit"
				className="auth-submit"
				disabled={isLoading}>
				{isLoading ? "Creating account…" : "Sign up"}
			</button>
		</form>
	);
}
