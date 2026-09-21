import type { AppDispatch } from '../app/store';
import { emergencyStatusChanged } from '../features/artists/presenceSlice';
import { messageReceived } from '../features/chat/chatSlice';
import type { IMessage } from '../shared/types';
import { getSocket } from './client';

interface EmergencyStatusChangedPayload {
  artistId: string;
  isEmergencyAvailable: boolean;
}

// Wires server -> client Socket.IO events into Redux. Call once, right
// after connectSocket(). Safe to call again (e.g. on reconnect) - it clears
// old listeners first so handlers don't stack up.
export function attachSocketListeners(dispatch: AppDispatch) {
  const socket = getSocket();
  if (!socket) return;

  socket.off('receive_message');
  socket.on('receive_message', (message: IMessage) => {
    dispatch(messageReceived(message));
  });

  socket.off('emergency_status_changed');
  socket.on('emergency_status_changed', (payload: EmergencyStatusChangedPayload) => {
    dispatch(emergencyStatusChanged(payload));
  });
}
