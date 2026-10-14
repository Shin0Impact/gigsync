import styles from "./ConfirmDialogue.module.css";

interface ConfirmDialogProps {
	isOpen: boolean;
	title: string;
	message: string;
	confirmLabel?: string;
	cancelLabel?: string;
	isConfirming?: boolean;
	errorMessage?: string | null;
	onConfirm: () => void;
	onCancel: () => void;
}

// Small, generic yes/no modal - "delete this post" is the first caller
// (see PieceCard.tsx) but nothing here is piece-specific, so any future
// irreversible action (unfollow, leave an event, etc.) can reuse it
// instead of growing its own backdrop/modal markup.
export function ConfirmDialog({
	isOpen,
	title,
	message,
	confirmLabel = "Delete",
	cancelLabel = "Cancel",
	isConfirming = false,
	errorMessage = null,
	onConfirm,
	onCancel,
}: ConfirmDialogProps) {
	if (!isOpen) return null;

	return (
		<div
			className={styles.backdrop}
			onClick={onCancel}>
			<div
				className={styles.modal}
				role="alertdialog"
				aria-modal="true"
				aria-labelledby="confirm-dialog-title"
				onClick={(e) => e.stopPropagation()}>
				<h2
					id="confirm-dialog-title"
					className={styles.title}>
					{title}
				</h2>
				<p className={styles.message}>{message}</p>

				{errorMessage && (
					<p
						className={styles.errorMessage}
						role="alert">
						{errorMessage}
					</p>
				)}

				<div className={styles.actions}>
					<button
						type="button"
						className={styles.cancelButton}
						onClick={onCancel}
						disabled={isConfirming}>
						{cancelLabel}
					</button>
					<button
						type="button"
						className={styles.confirmButton}
						onClick={onConfirm}
						disabled={isConfirming}>
						{isConfirming ? "Deleting…" : confirmLabel}
					</button>
				</div>
			</div>
		</div>
	);
}
