import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});


// ---------------------------------
// BACKEND HEALTH
// ---------------------------------

export const getHealth = async () => {
  const response = await api.get("/health");
  return response.data;
};


// ---------------------------------
// TELEMETRY
// ---------------------------------

export const getLatestTelemetry = async () => {
  const response = await api.get("/latest");
  return response.data;
};


export const getTelemetryHistory = async (sourceId) => {
  const response = await api.get(
    `/history/${encodeURIComponent(sourceId)}`
  );

  return response.data;
};


// ---------------------------------
// COLLECTORS
// ---------------------------------

export const getCollectors = async () => {
  const response = await api.get("/collectors");
  return response.data;
};


// ---------------------------------
// INCIDENT MANAGEMENT
// ---------------------------------

export const getIncidents = async (status) => {
  const response = await api.get("/incidents", {
    params: status ? { status } : {},
  });

  return response.data;
};


export const updateIncidentStatus = async (
  incidentId,
  status
) => {
  const response = await api.patch(
    `/incidents/${encodeURIComponent(incidentId)}/status`,
    { status }
  );

  return response.data;
};


// ---------------------------------
// AUDIT LOGS
// ---------------------------------

export const getAuditLogs = async (limit = 100) => {
  const response = await api.get("/audit-logs", {
    params: { limit },
  });

  return response.data;
};


export default api;