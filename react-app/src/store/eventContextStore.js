import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useEventContextStore = create(
  persist(
    (set) => ({
      selectedEvent: null,
      selectEvent: (event) => set({ selectedEvent: event }),
      clearEvent: () => set({ selectedEvent: null }),
    }),
    {
      name: 'eventops-event-context',
    }
  )
);
