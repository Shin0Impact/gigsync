import { useState, type FormEvent } from "react";
import { useRegisterMutation } from "../authApi";
import styles from "./AuthForm.module.css";
import { StepIndicator } from "../../../components/StepIndicator";
import { RegisterInput } from "@shared/services/auth.service";
import { UserRole } from "@shared/types/index";
import { Button } from "../../../components/Button";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../routes/routePaths";

interface SignupFormProps {
	onSuccess: () => void;
}

interface RoleOption {
	label: string;
	value: UserRole;
}

const roleOptions: RoleOption[] = [
	{ label: "I'm a creative", value: "artist" },
	{ label: "I'm a supporter", value: "fan" },
	{ label: "I'm an organizer", value: "organizer" },
];

export function SignupForm({ onSuccess }: SignupFormProps) {
	const navigate = useNavigate();

	const [step, setStep] = useState<number>(1);
	const [name, setName] = useState("");
	const [role, setRole] = useState<UserRole | "">("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [localError, setLocalError] = useState<string | null>(null);

	const [register, { isLoading, error }] = useRegisterMutation();

	const headers = ["We're Mezzo :)", "Hi, ", "Let's get you started.", "We can keep a secret ;)"];

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
			await register({ user_name: name, email, password, role } as RegisterInput).unwrap();
			onSuccess();
		} catch {
			// server-side error tracked by mutation hook
		}
	}

	function handleNext(e: FormEvent) {
		e.preventDefault();
		setLocalError(null);

		if (step === 1 && !name.trim()) {
			setLocalError("Please enter your name.");
			return;
		}
		if (step === 2 && !role) {
			setLocalError("Please select a role.");
			return;
		}
		if (step === 3 && !email.trim()) {
			setLocalError("Please enter a valid email.");
			return;
		}

		setStep((prev) => prev + 1);
	}

	function handleBack() {
		setLocalError(null);
		setStep((prev) => Math.max(prev - 1, 1));
	}

	function handleAlreadyMember() {
		navigate(ROUTES.LOGIN);
	}

	return (
		<div className={styles.formWrapper}>
			<div className={styles.formHeader}>
				<button
					type="button"
					onClick={handleBack}
					className={styles.toggleButton}
					style={{ textAlign: "left", margin: 0, opacity: step === 1 ? 0.3 : 0.7 }}
					disabled={step === 1}>
					← Back
				</button>

				<div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
					<StepIndicator
						currentStep={step}
						totalSteps={4}
					/>
				</div>

				<button
					type="button"
					onClick={handleAlreadyMember}
					className={styles.toggleButton}
					style={{ textAlign: "right", margin: 0 }}>
					Already a member?
				</button>
			</div>
			<div className={styles.formBody}>
				<h1 className={styles.title}>
					{step === 2 ? `${headers[1]} ${name}!` : headers[step - 1]}
				</h1>

				<form
					className={styles.authForm}
					onSubmit={step === 4 ? handleSubmit : handleNext}
					style={{ margin: "0 auto" }}>
					{step === 1 && (
						<div className={styles.field}>
							<label htmlFor="signup-name">How about you?</label>
							<input
								id="signup-name"
								type="text"
								autoComplete="name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
								autoFocus
							/>
						</div>
					)}

					{step === 2 && (
						<div className={styles.field}>
							<label>Which describes you best?</label>
							<div className={styles.buttonRow}>
								{roleOptions.map((option) => (
									<Button
										key={option.value}
										type="button"
										variant="solid"
										active={role === option.value}
										onClick={() => setRole(option.value)}>
										{option.label}
									</Button>
								))}
							</div>
						</div>
					)}

					{step === 3 && (
						<div className={styles.field}>
							<label htmlFor="signup-email">Where can we reach you?</label>
							<input
								id="signup-email"
								type="email"
								autoComplete="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								autoFocus
							/>
						</div>
					)}

					{step === 4 && (
						<>
							<div className={styles.field}>
								<label htmlFor="signup-password">8 characters minimum.</label>
								<input
									id="signup-password"
									type="password"
									autoComplete="new-password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									autoFocus
								/>
							</div>

							<div className={styles.field}>
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
						</>
					)}

					{(localError || error) && (
						<p
							className={styles.fieldError}
							role="alert">
							{localError ??
								"Couldn't create your account. That email or username may already be taken."}
						</p>
					)}

					<button
						type="submit"
						className={styles.authSubmit}
						disabled={isLoading || (step === 2 && !role)}>
						{isLoading ? "Creating account…" : step === 4 ? "Sign up" : "Continue"}
					</button>
				</form>
			</div>
		</div>
	);
}
