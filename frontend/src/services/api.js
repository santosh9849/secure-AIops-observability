
import axios from "axios";

// FastAPI backend address
const API_BASE_URL = "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Check backend health
export const getHealth = async () => {
  const response = await api.get("/health");
  return response.data;
};

// Get latest telemetry
export const getLatestTelemetry = async () => {
  const response = await api.get("/latest");
  return response.data;
};

// Get telemetry history
export const getTelemetryHistory = async (sourceId) => {
  const response = await api.get(
    `/history/${encodeURIComponent(sourceId)}`
  );
  return response.data;
};

// Get registered collectors
export const getCollectors = async () => {
  const response = await api.get("/collectors");
  return response.data;
};

export default api;
