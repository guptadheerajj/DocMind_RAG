import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'docmind_chats';

function loadChats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveChats(chats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  } catch { /* quota exceeded — fail silently */ }
}

function makeChat(id) {
  return {
    id,
    title: 'New Chat',
    messages: [],  // [{ id, role: 'user'|'assistant', content, sources?, createdAt }]
    sources: [],   // [{ id, name, type, url?, chunkCount, createdAt }]
    createdAt: new Date().toISOString(),
  };
}

/**
 * useChatStore — single source of truth for all chat state.
 * Persists to localStorage so chat history survives page refreshes
 */
export function useChatStore() {
  const [chats, setChats] = useState(() => {
    const saved = loadChats();
    if (saved.length === 0) {
      const initial = makeChat(uuidv4());
      saveChats([initial]);
      return [initial];
    }
    return saved;
  });

  const [activeChatId, setActiveChatId] = useState(() => {
    const saved = loadChats();
    return saved.length > 0 ? saved[0].id : null;
  });

  const activeChat = chats.find((c) => c.id === activeChatId) ?? chats[0] ?? null;

  const updateChats = useCallback((updater) => {
    setChats((prev) => {
      const next = updater(prev);
      saveChats(next);
      return next;
    });
  }, []);

  const createChat = useCallback(() => {
    const newChat = makeChat(uuidv4());
    updateChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    return newChat.id;
  }, [updateChats]);

  const selectChat = useCallback((id) => setActiveChatId(id), []);

  const deleteChat = useCallback((id) => {
    updateChats((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (id === activeChatId) {
        if (next.length === 0) {
          const fresh = makeChat(uuidv4());
          saveChats([fresh]);
          setActiveChatId(fresh.id);
          return [fresh];
        }
        setActiveChatId(next[0].id);
      }
      return next;
    });
  }, [activeChatId, updateChats]);

  const addMessage = useCallback((chatId, message) => {
    const msg = { id: uuidv4(), createdAt: new Date().toISOString(), ...message };
    updateChats((prev) =>
      prev.map((c) => {
        if (c.id !== chatId) return c;
        const isFirstUserMsg = c.messages.length === 0 && message.role === 'user';
        return {
          ...c,
          title: isFirstUserMsg
            ? message.content.slice(0, 50) + (message.content.length > 50 ? '…' : '')
            : c.title,
          messages: [...c.messages, msg],
        };
      })
    );
    return msg;
  }, [updateChats]);

  const addSource = useCallback((chatId, source) => {
    updateChats((prev) =>
      prev.map((c) => c.id !== chatId ? c : { ...c, sources: [...c.sources, source] })
    );
  }, [updateChats]);

  const removeSource = useCallback((chatId, sourceId) => {
    updateChats((prev) =>
      prev.map((c) =>
        c.id !== chatId ? c : { ...c, sources: c.sources.filter((s) => s.id !== sourceId) }
      )
    );
  }, [updateChats]);

  return {
    chats,
    activeChatId,
    activeChat,
    createChat,
    selectChat,
    deleteChat,
    addMessage,
    addSource,
    removeSource,
  };
}
