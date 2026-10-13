import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useLoginMutation } from "../authApi";
import { Form } from "@components";
import { ROUTES } from "../../../routes/routePaths";

export function FormLogin() {
	const navigate = useNavigate();
	const [identifier, setIdentifier] = useState("");
	const [password, setPassword] = useState("");
	// Defaults checked - matches the always-persistent behavior logins
	// had before this existed, so unchecking is an explicit opt into a
	// shorter, browser-session-only login rather than the other way
	// around.
	const [rememberMe, setRememberMe] = useState(true);
	const [login, { isLoading, error }] = useLoginMutation();

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		try {
			await login({ identifier, password, rememberMe }).unwrap();
			setTimeout(() => {
				handleLoginSuccess();
			}, 50);
		} catch {
			// handled by mutation
		}
	}

	function handleLoginSuccess() {
		navigate(ROUTES.HOME, { replace: true });
	}

	return (
		<Form
			title="Good to see you again :)"
			onSubmit={handleSubmit}
			header={
				<Form.Header
					right={<Form.ToggleButton onClick={() => navigate(ROUTES.SIGNUP)}>No account yet?</Form.ToggleButton>}
				/>
			}>
			<Form.Field>
				<Form.Label htmlFor="login-identifier">Email or username</Form.Label>
				<Form.Input
					id="login-identifier"
					name="username"
					type="text"
					autoComplete="username"
					value={identifier}
					onChange={(e) => setIdentifier(e.target.value)}
					required
					autoFocus
				/>
			</Form.Field>

			<Form.Field>
				<Form.Label htmlFor="login-password">Password</Form.Label>
				<Form.Input
					id="login-password"
					name="password"
					type="password"
					autoComplete="current-password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
				/>
			</Form.Field>

			<Form.Checkbox
				id="login-remember-me"
				label="Remember me"
				checked={rememberMe}
				onChange={setRememberMe}
				disabled={isLoading}
			/>

			{error && (
				<Form.ErrorMessage>Couldn't log in. Check your email/username and password and try again.</Form.ErrorMessage>
			)}

			<Form.Submit disabled={isLoading}>{isLoading ? "Logging in…" : "Log in"}</Form.Submit>
		</Form>
	);
}
