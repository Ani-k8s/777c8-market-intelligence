import { api } from "../api/client.js";

export async function fetchLiveData(force = false) {
  const { data } = await api.get(`/market/live-data${force ? "?force=1" : ""}`);
  return data;
}

export async function analyzeMarket(payload) {
  const { data } = await api.post("/market/analyze", payload);
  return data;
}

export async function fetchStrikeSuggestions(payload) {
  const { data } = await api.post("/market/strike-suggestions", payload);
  return data;
}

export async function generateCopy(payload) {
  const { data } = await api.post("/market/generate-copy", payload);
  return data;
}

export async function generateImagePayload(payload) {
  const { data } = await api.post("/market/generate-image", payload);
  return data;
}
