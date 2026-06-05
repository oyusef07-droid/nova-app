import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "mediafetch_history";
const MAX_ITEMS = 10; // Updated to 10 items limit

export function useHistory() {
  const [history, setHistory] = useState([]);
  const [session, setSession] = useState(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize and check session
  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const data = await res.json();
          if (Object.keys(data).length > 0) {
            setSession(data);
          }
        }
      } catch (e) {
        // ignore
      }
      setIsReady(true);
    };
    init();
  }, []);

  // Fetch history when session is ready
  useEffect(() => {
    if (!isReady) return;

    const fetchHistory = async () => {
      if (session) {
        try {
          const res = await fetch("/api/history");
          if (res.ok) {
            const dbHistory = await res.json();
            setHistory(dbHistory);
            
            // Check if there's local history to migrate
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
              const localHistory = JSON.parse(stored);
              if (localHistory.length > 0) {
                // Merge to DB
                await fetch("/api/history", {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(localHistory)
                });
                // Refetch to get merged data with valid IDs
                const updatedRes = await fetch("/api/history");
                if (updatedRes.ok) {
                  setHistory(await updatedRes.json());
                }
                // Clear local storage since it's migrated
                localStorage.removeItem(STORAGE_KEY);
              }
            }
          }
        } catch (e) {
          // fallback to local on error
          loadLocal();
        }
      } else {
        loadLocal();
      }
    };

    fetchHistory();
  }, [session, isReady]);

  const loadLocal = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setHistory(JSON.parse(stored).slice(0, MAX_ITEMS));
    } catch {
      // ignore
    }
  };

  const persistLocal = useCallback((items) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, []);

  const addItem = useCallback(
    async (item) => {
      if (session) {
        try {
          await fetch("/api/history", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
          });
          // Refresh from DB
          const res = await fetch("/api/history");
          if (res.ok) {
            setHistory(await res.json());
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        setHistory((prev) => {
          const newItem = {
            id: Date.now().toString() + Math.random().toString(36).slice(2),
            ...item,
            createdAt: new Date().toISOString(),
          };
          const updated = [newItem, ...prev].slice(0, MAX_ITEMS);
          persistLocal(updated);
          return updated;
        });
      }
    },
    [session, persistLocal]
  );

  const removeItem = useCallback(
    async (id) => {
      if (session) {
        try {
          await fetch(`/api/history?id=${id}`, { method: 'DELETE' });
          setHistory((prev) => prev.filter((i) => i.id !== id));
        } catch (e) {
          console.error(e);
        }
      } else {
        setHistory((prev) => {
          const updated = prev.filter((i) => i.id !== id);
          persistLocal(updated);
          return updated;
        });
      }
    },
    [session, persistLocal]
  );

  const clearAll = useCallback(async () => {
    if (session) {
      try {
        await fetch("/api/history", { method: 'DELETE' });
        setHistory([]);
      } catch (e) {
        console.error(e);
      }
    } else {
      setHistory([]);
      persistLocal([]);
    }
  }, [session, persistLocal]);

  return { history, addItem, removeItem, clearAll };
}
