// api.js
const API_BASE = "http://localhost:5000";

function getToken() {
  return localStorage.getItem("token");
}

function setToken(token) {
  localStorage.setItem("token", token);
}

function apiRequest(path, method = "GET", body = null) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(API_BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  }).then(res => res.json());
}