import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IMessage } from '../../shared/types';

// Real-time-only slice: holds messages pushed over Socket.IO
// ('receive_message'), NOT fetched conversation/message history - that's
// REST-fetchable data and belongs behind an RTK Query endpoint once one
// exists (chatApi.ts, injected into src/shared/api.ts the same way
// authApi.ts is), not duplicated here. This slice exists because RTK Query
// has nothing to patch for a push event with no backing query.
interface ChatState {
  messages: Record<string, IMessage[]>;
}

const initialState: ChatState = {
  messages: {},
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    messageReceived(state, action: PayloadAction<IMessage>) {
      const { conversationId } = action.payload;
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      state.messages[conversationId].push(action.payload);
    },
  },
});

export const { messageReceived } = chatSlice.actions;
export default chatSlice.reducer;
