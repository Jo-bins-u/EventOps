import { create } from 'zustand';
import api from '../utils/api';
import toast from 'react-hot-toast';

export const useAIStore = create((set, get) => ({
  isOpen: false,
  messages: [],
  loading: false,
  completedActions: {},
  commandPaletteOpen: false,

  setIsOpen: (isOpen) => set({ isOpen }),
  setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),

  fetchHistory: async () => {
    try {
      const res = await api.get('/ai/history');
      if (res.data && res.data.length > 0) {
        // Parse backend OpenAI/Groq history structure back to simplified local structure
        const parsed = [];
        res.data.forEach((msg) => {
          let text = '';
          let actions = [];

          if (msg.content) {
            const partText = msg.content;
            try {
              const jsonObj = JSON.parse(partText);
              text = jsonObj.reply;
              actions = jsonObj.actions || [];
            } catch (err) {
              text = partText;
            }
          }

          if (text) {
            parsed.push({
              id: Math.random().toString(36).substring(7),
              sender: msg.role === 'user' ? 'user' : 'ai',
              text,
              actions,
            });
          }
        });
        set({ messages: parsed });
      }
    } catch (err) {
      console.error('Failed to load AI history:', err);
    }
  },

  sendMessage: async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Append user message immediately
    const userMsgId = Math.random().toString(36).substring(7);
    set((state) => ({
      messages: [...state.messages, { id: userMsgId, sender: 'user', text: trimmed }],
      loading: true,
      isOpen: true, // Dock the assistant panel open to show response
    }));

    try {
      const res = await api.post('/ai/chat', { message: trimmed });
      const { reply, actions } = res.data;

      // Append AI response
      const aiMsgId = Math.random().toString(36).substring(7);
      set((state) => ({
        messages: [
          ...state.messages,
          {
            id: aiMsgId,
            sender: 'ai',
            text: reply || 'Sorry, I encountered an error formatting my response.',
            actions: actions || [],
          },
        ],
      }));
    } catch (err) {
      console.error('AI Request failed:', err);
      // Append error message locally
      set((state) => ({
        messages: [
          ...state.messages,
          {
            id: Math.random().toString(36).substring(7),
            sender: 'ai',
            text: '⚠️ **Error:** I was unable to connect to my backend brain. Please ensure your backend is running and the Gemini API key is configured.',
          },
        ],
      }));
    } finally {
      set({ loading: false });
    }
  },

  clearHistory: async () => {
    try {
      await api.post('/ai/reset');
      set({ messages: [], completedActions: {} });
      toast.success('Chat history cleared');
    } catch (err) {
      console.error('Failed to reset AI history:', err);
      toast.error('Failed to clear chat history');
    }
  },

  setCompletedAction: (key, status) => set((state) => ({
    completedActions: { ...state.completedActions, [key]: status }
  })),
}));
