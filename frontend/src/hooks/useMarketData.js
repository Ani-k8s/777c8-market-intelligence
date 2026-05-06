import { useCallback, useEffect, useState } from "react";

import { getApiError } from "../api/client.js";
import { fetchLiveData } from "../services/marketService.js";

export default function useMarketData(intervalMs = 60000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async (force = false) => {
    setError("");
    try {
      const response = await fetchLiveData(force);
      setData(response);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(() => refresh(), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs, refresh]);

  return { data, loading, error, refresh };
}
