const BASE_URL = 'http://localhost:5000';

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

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
