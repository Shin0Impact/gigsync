import { createContext, useContext, useState, type ReactNode } from "react";
import { PostQuickView } from "./components";

interface PostQuickViewContextValue {
	openPost: (pieceId: number) => void;
}

const PostQuickViewContext = createContext<PostQuickViewContextValue | null>(null);

// Any PieceCard, anywhere (My Pieces, Explore, a profile's work grid),
// calls this instead of navigating directly - see PieceCard.tsx. Lives
// at the Layout level (see layouts/Layout.tsx) so the modal it renders
// sits above every creative page, not just one.
export function usePostQuickView(): PostQuickViewContextValue {
	const ctx = useContext(PostQuickViewContext);
	if (!ctx) {
		throw new Error("usePostQuickView must be used within a PostQuickViewProvider");
	}
	return ctx;
}

export function PostQuickViewProvider({ children }: { children: ReactNode }) {
	const [openPieceId, setOpenPieceId] = useState<number | null>(null);

	return (
		<PostQuickViewContext.Provider value={{ openPost: setOpenPieceId }}>
			{children}
			<PostQuickView
				pieceId={openPieceId}
				onClose={() => setOpenPieceId(null)}
			/>
		</PostQuickViewContext.Provider>
	);
}
