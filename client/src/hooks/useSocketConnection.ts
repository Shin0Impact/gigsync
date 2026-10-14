import { useEffect } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../app/store";
import { useMeQuery } from "../features/auth/authApi";
import { connectSocket, disconnectSocket } from "../sockets/client";
import { attachSocketListeners } from "../sockets/listeners";

// Wires up the Socket.IO connection for the whole app - previously
// connectSocket()/attachSocketListeners() existed but nothing ever
// called them, so neither the emergency_status_changed listener nor
// chat's receive_message listener was actually live. Mounted once from
// Layout (see Layout.tsx) rather than per-page, so a conversation thread
// still receives messages pushed while the user is on a different page,
// and the connection survives navigating between pages.
export function useSocketConnection() {
	const dispatch = useDispatch<AppDispatch>();
	const { data } = useMeQuery();
	const userId = data?.user?.userId;

	useEffect(() => {
		if (!userId) return;

		connectSocket();
		attachSocketListeners(dispatch);

		return () => {
			disconnectSocket();
		};
	}, [userId, dispatch]);
}
