import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useLoginMutation, useRegisterMutation } from "../authApi";
import { StepIndicator } from "../../../components/StepIndicator";
import { RegisterInput, UserRole } from "@shared/types/index";
import { Form } from "@components";
import { ROUTES } from "../../../routes/routePaths";

const roleOptions = [
	{ label: "I'm a creative", value: "artist" },
	{ label: "I'm a supporter", value: "fan" },
	{ label: "I'm an organizer", value: "organizer" },
] as const;

export function FormSignup() {
	const navigate = useNavigate();

	const [step, setStep] = useState<number>(1);
	const [name, setName] = useState("");
	const [role, setRole] = useState<UserRole | "">("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [userName, setUserName] = useState("");
	const [localError, setLocalError] = useState<string | null>(null);

	const [register, { isLoading, error }] = useRegisterMutation();
	const [login] = useLoginMutation();
	const headers = ["We're Mezzo :)", "Hi, ", "Let's get you started.", "Pick a password.", "Finally, choose a handle."];

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setLocalError(null);

		if (!userName.trim()) {
			setLocalError("Please choose a username.");
			return;
		}

		try {
			// 1. Create the account
			await register({
				user_name: userName,
				name,
				email,
				password,
				role: role as UserRole,
				artists_type: null,
			} as RegisterInput).unwrap();

			await login({
				identifier: email,
				password,
				rememberMe: true,
			}).unwrap();

			handleSignupSuccess();
		} catch {
			// server-side error tracked by mutation hooks or local state
		}
	}

	function handleSignupSuccess() {
		navigate(ROUTES.ONBOARDING, { replace: true });
	}

	function handleNext(e: FormEvent) {
		e.preventDefault();
		setLocalError(null);

		if (step === 1 && !name.trim()) return setLocalError("Please enter your name.");
		if (step === 2 && !role) return setLocalError("Please select a role.");
		if (step === 3 && !email.trim()) return setLocalError("Please enter a valid email.");
		if (step === 4) {
			if (password !== confirmPassword) {
				setLocalError("Passwords don't match.");
				return;
			}
			if (password.length < 8) {
				setLocalError("Password must be at least 8 characters.");
				return;
			}
		}

		setStep((prev) => prev + 1);
	}

	const headerLeft = (
		<Form.ToggleButton
			onClick={() => {
				setLocalError(null);
				setStep((prev) => Math.max(prev - 1, 1));
			}}
			style={{ opacity: step === 1 ? 0.3 : 0.7 }}
			disabled={step === 1}>
			← Back
		</Form.ToggleButton>
	);

	const headerCenter = (
		<StepIndicator
			currentStep={step}
			totalSteps={5}
		/>
	);

	const headerRight = (
		<Form.ToggleButton onClick={() => navigate(ROUTES.LOGIN, { replace: true })}>Already a member?</Form.ToggleButton>
	);

	return (
		<Form
			title={step === 2 ? `${headers[1]} ${name}!` : headers[step - 1]}
			onSubmit={step === 5 ? handleSubmit : handleNext}
			header={
				<Form.Header
					left={headerLeft}
					center={headerCenter}
					right={headerRight}
				/>
			}>
			{step === 1 && (
				<Form.Field>
					<Form.Label htmlFor="signup-name">What's your name?</Form.Label>
					<Form.Input
						id="signup-name"
						name="name"
						type="text"
						autoComplete="name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
						autoFocus
					/>
				</Form.Field>
			)}

			{step === 2 && (
				<Form.Field>
					<Form.Label>Which describes you best?</Form.Label>
					<Form.OptionGroup
						options={roleOptions}
						value={role}
						onChange={(selectedRole) => setRole(selectedRole)}
					/>
				</Form.Field>
			)}

			{step === 3 && (
				<Form.Field>
					<Form.Label htmlFor="signup-email">Where can we reach you?</Form.Label>
					<Form.Input
						id="signup-email"
						name="email"
						type="email"
						autoComplete="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						autoFocus
					/>
				</Form.Field>
			)}

			{step === 4 && (
				<>
					<Form.Field>
						<Form.Label htmlFor="signup-password">8 characters minimum.</Form.Label>
						<Form.Input
							id="signup-password"
							name="password"
							type="password"
							autoComplete="new-password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							autoFocus
						/>
					</Form.Field>

					<Form.Field>
						<Form.Label htmlFor="signup-confirm-password">Confirm password</Form.Label>
						<Form.Input
							id="signup-confirm-password"
							name="confirmPassword"
							type="password"
							autoComplete="new-password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							required
						/>
					</Form.Field>
				</>
			)}

			{step === 5 && (
				<Form.Field>
					<Form.Label htmlFor="signup-username">Choose a username</Form.Label>
					<Form.Input
						id="signup-username"
						name="username"
						type="text"
						autoComplete="username"
						value={userName}
						onChange={(e) => setUserName(e.target.value)}
						required
						autoFocus
					/>
				</Form.Field>
			)}

			{(localError || error) && (
				<Form.ErrorMessage>
					{localError ?? "Couldn't create your account. That email or username may already be taken."}
				</Form.ErrorMessage>
			)}

			<Form.Submit disabled={isLoading || (step === 2 && !role)}>
				{isLoading ? "Creating account…" : step === 5 ? "Sign up" : "Continue"}
			</Form.Submit>
		</Form>
	);
}

export default FormSignup;
