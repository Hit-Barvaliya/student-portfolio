import { useEffect, useState } from "react";
import {
  createTaskApi,
  deleteTaskApi,
  fetchTasks,
  getAuthToken,
  loginApi,
  registerApi,
  setAuthToken,
  setUnauthorizedHandler,
  updateTaskApi,
} from "../api";
import "./TaskManager.css";

const emptyTask = {
  title: "",
  description: "",
  dueDate: "",
  priority: "normal",
  status: "pending",
};

function formatDate(value) {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

function getTokenExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function formatSessionTime(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function TaskManager() {
  const [token, setToken] = useState(getAuthToken);
  const [sessionRemaining, setSessionRemaining] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(emptyTask);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ email: "", password: "" });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  async function loadTasks() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchTasks();
      setTasks(data.tasks || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const removeUnauthorizedHandler = setUnauthorizedHandler(logout);

    if (token) {
      loadTasks();
      const expiry = getTokenExpiry(token);
      const updateSessionRemaining = () => {
        const remaining = expiry ? Math.max(0, expiry - Date.now()) : 0;
        setSessionRemaining(remaining);
        if (expiry && remaining === 0) logout();
      };

      updateSessionRemaining();
      const timer = window.setInterval(updateSessionRemaining, 1000);
      return () => {
        window.clearInterval(timer);
        removeUnauthorizedHandler();
      };
    } else {
      setLoading(false);
      setSessionRemaining(0);
      return removeUnauthorizedHandler;
    }
  }, [token]);

  function updateAuthField(event) {
    setAuthForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function submitAuth(event) {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    try {
      if (authMode === "register") {
        await registerApi(authForm);
      }
      const data = await loginApi(authForm);
      setAuthToken(data.token);
      setToken(data.token);
      setAuthForm({ email: "", password: "" });
    } catch (requestError) {
      setAuthError(requestError.message);
    } finally {
      setAuthLoading(false);
    }
  }

  function logout() {
    setAuthToken(null);
    setToken(null);
    setTasks([]);
    setError("");
  }

  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  function beginEdit(task) {
    setEditingId(task.id);
    setForm({
      title: task.title || "",
      description: task.description || "",
      dueDate: task.dueDate
        ? new Date(task.dueDate).toISOString().slice(0, 10)
        : "",
      priority: task.priority || "normal",
      status: task.status || "pending",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setForm(emptyTask);
    setEditingId(null);
  }

  async function submitTask(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editingId) {
        const data = await updateTaskApi(editingId, form);
        if (!data.success) throw new Error(data.error || "Unable to update task");
      } else {
        const data = await createTaskApi(form);
        if (!data.success) throw new Error(data.error || "Unable to create task");
      }
      await loadTasks();
      resetForm();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteTask(id) {
    if (!window.confirm("Delete this task?")) return;
    setDeletingId(id);
    setError("");
    try {
      const data = await deleteTaskApi(id);
      if (!data.success) throw new Error(data.error || "Unable to delete task");
      setTasks((current) => current.filter((task) => task.id !== id));
      if (editingId === id) resetForm();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDeletingId(null);
    }
  }

  const visibleTasks =
    filter === "all" ? tasks : tasks.filter((task) => task.status === filter);

  if (!token) {
    return (
      <main className="task-page auth-page">
        <section className="task-intro">
          <p className="eyebrow">Workspace / Access</p>
          <div className="task-heading">
            <div>
              <h1>{authMode === "login" ? "Welcome back" : "Create your account"}</h1>
              <p>Sign in to manage your tasks.</p>
            </div>
          </div>
        </section>
        <form className="task-form auth-form" onSubmit={submitAuth}>
          <div className="section-label">
            <span>{authMode === "login" ? "Sign in" : "Register"}</span>
          </div>
          <label>
            Email
            <input
              name="email"
              type="email"
              value={authForm.email}
              onChange={updateAuthField}
              required
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              value={authForm.password}
              onChange={updateAuthField}
              minLength="6"
              required
            />
          </label>
          {authError && <div className="error-message" role="alert">{authError}</div>}
          <button className="primary-button" type="submit" disabled={authLoading}>
            {authLoading ? "Please wait..." : authMode === "login" ? "Sign in" : "Register"}
          </button>
          <button
            className="text-button"
            type="button"
            onClick={() => {
              setAuthMode((current) => current === "login" ? "register" : "login");
              setAuthError("");
            }}
          >
            {authMode === "login" ? "Create an account" : "Back to sign in"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="task-page">
      <section className="task-intro">
        <p className="eyebrow">Workspace / Operations</p>
        <div className="task-heading">
          <div className="task-heading-copy">
            <h1>Task manager</h1>
            <p>Capture the work. Keep the momentum.</p>
          </div>
          <div className="task-heading-actions">
            <div className="task-count">
              <strong>{tasks.length}</strong>
              <span>total tasks</span>
            </div>
            <div className="session-count" aria-live="polite">
              <strong>{formatSessionTime(sessionRemaining)}</strong>
              <span>session remaining</span>
            </div>
            <button className="text-button" type="button" onClick={logout}>
              Sign out
            </button>
          </div>
        </div>
      </section>

      <section className="task-layout">
        <form className="task-form" onSubmit={submitTask}>
          <div className="section-label">
            <span>{editingId ? "Edit task" : "New task"}</span>
            <span className="required">Required fields *</span>
          </div>
          <label>
            Title *
            <input
              name="title"
              value={form.title}
              onChange={updateField}
              placeholder="What needs doing?"
              required
            />
          </label>
          <label>
            Description *
            <textarea
              name="description"
              value={form.description}
              onChange={updateField}
              placeholder="Add useful context"
              rows="4"
              required
            />
          </label>
          <div className="form-grid">
            <label>
              Due date
              <input
                type="date"
                name="dueDate"
                value={form.dueDate}
                onChange={updateField}
              />
            </label>
            <label>
              Priority
              <select
                name="priority"
                value={form.priority}
                onChange={updateField}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </label>
          </div>
          <label>
            Status
            <select name="status" value={form.status} onChange={updateField}>
              <option value="pending">Pending</option>
              <option value="in-progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
          </label>
          <div className="form-actions">
            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Save changes" : "Add task"}
            </button>
            {editingId && (
              <button className="text-button" type="button" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="task-list-panel">
          <div className="list-toolbar">
            <div>
              <span className="section-label">Your tasks</span>
              <span className="list-total">{visibleTasks.length} showing</span>
            </div>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              aria-label="Filter tasks"
            >
              <option value="all">All tasks</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}
          {loading ? (
            <p className="empty-state">Loading tasks...</p>
          ) : visibleTasks.length === 0 ? (
            <p className="empty-state">
              No tasks here yet. Add one to get moving.
            </p>
          ) : (
            <div className="task-list">
              {visibleTasks.map((task) => (
                <article className="task-item" key={task.id}>
                  <div className="task-item-top">
                    <span className={`status status-${task.status}`}>
                      {task.status.replace("-", " ")}
                    </span>
                    <span className={`priority priority-${task.priority}`}>
                      {task.priority}
                    </span>
                  </div>
                  <h2>{task.title}</h2>
                  <p>{task.description}</p>
                  <div className="task-meta">
                    <span>{formatDate(task.dueDate)}</span>
                    <span className="task-id">{task.id}</span>
                  </div>
                  <div className="item-actions">
                    <button type="button" onClick={() => beginEdit(task)}>
                      Edit
                    </button>
                    <button
                      className="delete-button"
                      type="button"
                      onClick={() => deleteTask(task.id)}
                      disabled={deletingId === task.id}
                    >
                      {deletingId === task.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default TaskManager;
