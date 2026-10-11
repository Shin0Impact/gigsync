import { useState, type FormEvent } from "react";
import type { DbEvent } from "@shared/types/index";
import { useApplyToEventMutation } from "../eventsApi";
import styles from "./ApplyToEventModal.module.css";

interface ApplyToEventModalProps {
	event: DbEvent | null;
	onClose: () => void;
}

// Mirrors CreatePieceModal.tsx's backdrop/modal/form shape - a cover note
// is optional context for the organizer, not required to apply.
export function ApplyToEventModal({ event, onClose }: ApplyToEventModalProps) {
	const [coverNote, setCoverNote] = useState("");
	const [applyToEvent, { isLoading, error, isSuccess, reset }] = useApplyToEventMutation();

	const isOpen = event !== null;
	if (!isOpen) return null;

	function handleClose() {
		if (isLoading) return;
		setCoverNote("");
		reset();
		onClose();
	}

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		try {
			await applyToEvent({ eventId: event!.id, coverNote: coverNote.trim() || undefined }).unwrap();
		} catch (err) {
			console.error("Failed to apply to event:", err);
		}
	}

	return (
		<div
			className={styles.backdrop}
			onClick={handleClose}>
			<div
				className={styles.modal}
				onClick={(e) => e.stopPropagation()}>
				<header className={styles.header}>
					<h2 className={styles.title}>Apply to {event!.title}</h2>
					<button
						type="button"
						className={styles.closeButton}
						onClick={handleClose}
						disabled={isLoading}>
						Cancel
					</button>
				</header>

				{isSuccess ? (
					<div className={styles.successState}>
						<p className={styles.successMessage}>Application sent! You can track its status under My Applications.</p>
						<button
							type="button"
							className={styles.submitButton}
							onClick={handleClose}>
							Done
						</button>
					</div>
				) : (
					<form
						onSubmit={handleSubmit}
						className={styles.form}>
						{error && (
							<p
								className={styles.errorMessage}
								role="alert">
								Failed to send your application. Please try again.
							</p>
						)}

						<div className={styles.field}>
							<label
								htmlFor="apply-cover-note"
								className={styles.label}>
								Cover note (optional)
							</label>
							<textarea
								id="apply-cover-note"
								className={styles.textarea}
								value={coverNote}
								onChange={(e) => setCoverNote(e.target.value)}
								placeholder="Tell the organizer why you would be a good fit…"
								rows={4}
								disabled={isLoading}
								autoFocus
							/>
						</div>

						<button
							type="submit"
							className={styles.submitButton}
							disabled={isLoading}>
							{isLoading ? "Sending…" : "Send Application"}
						</button>
					</form>
				)}
			</div>
		</div>
	);
}
