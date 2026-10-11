import { createContext, useContext, useState, type ReactNode } from "react";
import { CreatePieceModal } from "./components/CreatePieceModal";

interface ComposerContextValue {
	openComposer: () => void;
}

const ComposerContext = createContext<ComposerContextValue | null>(null);

// The "New Piece" composer modal - opened from the global FAB (see
// layouts/Layout.tsx) and from the empty-state CTA on My Pieces. Same
// shape as PostQuickViewProvider: owns the open/closed state and renders
// the modal itself, just exposes openComposer() to trigger it.
export function useComposer(): ComposerContextValue {
	const ctx = useContext(ComposerContext);
	if (!ctx) {
		throw new Error("useComposer must be used within a ComposerProvider");
	}
	return ctx;
}

export function ComposerProvider({ children }: { children: ReactNode }) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<ComposerContext.Provider value={{ openComposer: () => setIsOpen(true) }}>
			{children}
			<CreatePieceModal
				isOpen={isOpen}
				onClose={() => setIsOpen(false)}
			/>
		</ComposerContext.Provider>
	);
}
