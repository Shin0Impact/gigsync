interface StepIndicatorProps {
	currentStep: number;
	totalSteps: number;
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
	return (
		<div
			style={{ display: "flex", gap: "6px", alignItems: "center", justifyContent: "center" }}
			aria-label={`Step ${currentStep} of ${totalSteps}`}>
			{Array.from({ length: totalSteps }, (_, index) => {
				const stepNumber = index + 1;
				const isFilled = stepNumber <= currentStep;

				return (
					<div
						key={stepNumber}
						style={{
							width: "12px",
							height: "12px",
							border: "1px solid var(--color-accent)",
							backgroundColor: isFilled ? "var(--color-accent)" : "transparent",
							transition: "background-color 0.2s ease",
						}}
					/>
				);
			})}
		</div>
	);
}
