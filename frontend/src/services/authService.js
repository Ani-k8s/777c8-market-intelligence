import { api } from "../api/client.js";

export async function loginRequest(username, password) {
  const { data } = await api.post("/auth/login", { username, password });
  return data;
}

export async function listUsers() {
  const { data } = await api.get("/auth/users");
  return data.users;
}

export async function getAdminStats() {
  const { data } = await api.get("/auth/stats");
  return data;
}

export async function createUser(payload) {
  const { data } = await api.post("/auth/create-user", payload);
  return data.user;
}

export async function toggleUser(userId, enabled) {
  const { data } = await api.post("/auth/toggle-user", { user_id: userId, enabled });
  return data.user;
}

export async function deleteUser(userId) {
  await api.post("/auth/delete-user", { user_id: userId });
}

export async function setUserExpiry(userId, accessExpiresAt) {
  const { data } = await api.post("/auth/set-expiry", {
    user_id: userId,
    access_expires_at: accessExpiresAt,
  });
  return data.user;
}

export async function resetPassword(userId, password) {
  const { data } = await api.post("/auth/reset-password", { user_id: userId, password });
  return data.user;
}
