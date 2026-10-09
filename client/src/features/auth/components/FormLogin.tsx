import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useLoginMutation } from "../authApi";
import { Form } from "@components";
import { ROUTES } from "../../../routes/routePaths";

export function FormLogin() {
	const navigate = useNavigate();
	const [identifier, setIdentifier] = useState("");
	const [password, setPassword] = useState("");
	const [login, { isLoading, error }] = useLoginMutation();

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		try {
			await login({ identifier, password }).unwrap();
			setTimeout(() => {
				handleLoginSuccess();
			}, 50);
		} catch {
			// handled by mutation
		}
	}

	function handleLoginSuccess() {
		navigate(ROUTES.DASHBOARD, { replace: true });
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

			{error && (
				<Form.ErrorMessage>Couldn't log in. Check your email/username and password and try again.</Form.ErrorMessage>
			)}

			<Form.Submit disabled={isLoading}>{isLoading ? "Logging in…" : "Log in"}</Form.Submit>
		</Form>
	);
}
