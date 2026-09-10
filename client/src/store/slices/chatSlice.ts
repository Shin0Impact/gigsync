import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IConversation, IMessage } from '../../types';

interface ChatState {
  activeConversationId: string | null;
  conversations: IConversation[];
  messages: Record<string, IMessage[]>;
  unreadCount: number;
}

const initialState: ChatState = {
  activeConversationId: null,
  conversations: [],
  messages: {},
  unreadCount: 0,
};

// TODO (Dev 3): dispatch setMessageReceived from the Socket.IO
// 'receive_message' handler once the client socket is wired up.
const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveConversation(state, action: PayloadAction<string | null>) {
      state.activeConversationId = action.payload;
    },
    setConversations(state, action: PayloadAction<IConversation[]>) {
      state.conversations = action.payload;
    },
    messageReceived(state, action: PayloadAction<IMessage>) {
      const { conversationId } = action.payload;
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      state.messages[conversationId].push(action.payload);
    },
  },
});

export const { setActiveConversation, setConversations, messageReceived } = chatSlice.actions;
export default chatSlice.reducer;
