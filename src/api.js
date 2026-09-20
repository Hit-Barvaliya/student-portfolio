const BASE_URL = 'http://localhost:5000';
const TOKEN_KEY = 'task_manager_token';

let authToken = localStorage.getItem(TOKEN_KEY);
let unauthorizedHandler = null;

export function setAuthToken(token) {
  authToken = token;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getAuthToken() {
  return authToken;
}

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
  return () => {
    unauthorizedHandler = null;
  };
}

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && authToken && !endpoint.startsWith("/auth/")) {
      setAuthToken(null);
      unauthorizedHandler?.();
    }

    const error = new Error(data.error || 'Request failed');
    error.status = response.status;
    throw error;
  }

  return data;
}

export const registerApi = (credentials) => apiRequest('/auth/register', {
  method: 'POST',
  body: JSON.stringify(credentials),
});

export const loginApi = (credentials) => apiRequest('/auth/login', {
  method: 'POST',
  body: JSON.stringify(credentials),
});

export const fetchTasks = () => apiRequest('/tasks');
export const createTaskApi = (task) => apiRequest('/tasks', {
  method: 'POST',
  body: JSON.stringify(task),
});
export const updateTaskApi = (id, task) => apiRequest(`/tasks/${id}`, {
  method: 'PUT',
  body: JSON.stringify(task),
});
export const deleteTaskApi = (id) => apiRequest(`/tasks/${id}`, {
  method: 'DELETE',
});
