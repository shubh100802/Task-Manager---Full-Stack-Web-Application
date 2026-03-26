import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AnimatedBackground from '../components/AnimatedBackground';
import { taskAPI } from '../services/api';
import type { TaskQueryParams } from '../services/api';

interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'Todo' | 'In Progress' | 'Done';
  priority: 'Low' | 'Medium' | 'High';
  dueDate: string;
}

interface Analytics {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionPercentage: number;
  tasksByStatus: Record<string, number>;
  tasksByPriority: Record<string, number>;
  overdueTasks: number;
  tasksDueThisWeek: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const defaultForm = {
  title: '',
  description: '',
  status: 'Todo' as 'Todo' | 'In Progress' | 'Done',
  priority: 'Medium' as 'Low' | 'Medium' | 'High',
  dueDate: '',
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [tasksError, setTasksError] = useState('');
  const [analyticsError, setAnalyticsError] = useState('');
  const [actionError, setActionError] = useState('');

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'createdAt'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(6);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 6, total: 0, pages: 1 });

  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.body.classList.toggle('theme-dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const queryParams: TaskQueryParams = useMemo(() => ({
    status: status || undefined,
    priority: priority || undefined,
    search: search || undefined,
    sortBy,
    sortOrder,
    page,
    limit,
  }), [status, priority, search, sortBy, sortOrder, page, limit]);

  const fetchTasks = useCallback(async () => {
    setLoadingTasks(true);
    setTasksError('');
    try {
      const apiResponse = await taskAPI.getTasks(queryParams);
      setTasks(apiResponse.data.tasks || []);
      const incoming = apiResponse.data.pagination || { page: 1, limit, total: 0, pages: 1 };
      setPagination(incoming);
      setPage(incoming.page || 1);
    } catch (errorObj: any) {
      setTasksError(errorObj.response?.data?.message || 'Failed to load tasks.');
    } finally {
      setLoadingTasks(false);
    }
  }, [queryParams, limit]);

  const fetchAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    setAnalyticsError('');
    try {
      const apiResponse = await taskAPI.getAnalytics();
      setAnalytics(apiResponse.data.analytics);
    } catch (errorObj: any) {
      setAnalyticsError(errorObj.response?.data?.message || 'Failed to load analytics.');
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  const refreshAll = async () => {
    await Promise.all([fetchTasks(), fetchAnalytics()]);
  };

  const openAddModal = () => {
    setEditingTask(null);
    setFormData(defaultForm);
    setActionError('');
    setShowModal(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: new Date(task.dueDate).toISOString().split('T')[0],
    });
    setActionError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTask(null);
    setFormData(defaultForm);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setActionError('');

    try {
      if (editingTask) {
        await taskAPI.updateTask(editingTask._id, formData);
      } else {
        await taskAPI.createTask(formData);
      }

      closeModal();
      await refreshAll();
    } catch (errorObj: any) {
      setActionError(errorObj.response?.data?.message || 'Unable to save task.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    const confirmed = window.confirm('Delete this task?');
    if (!confirmed) return;

    setActionError('');
    try {
      await taskAPI.deleteTask(id);
      if (tasks.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        await refreshAll();
      }
    } catch (errorObj: any) {
      setActionError(errorObj.response?.data?.message || 'Unable to delete task.');
    }
  };

  const handleMarkComplete = async (id: string) => {
    setActionError('');
    try {
      await taskAPI.markTaskComplete(id);
      await refreshAll();
    } catch (errorObj: any) {
      setActionError(errorObj.response?.data?.message || 'Unable to mark task complete.');
    }
  };

  const resetFilters = () => {
    setSearchInput('');
    setSearch('');
    setStatus('');
    setPriority('');
    setSortBy('dueDate');
    setSortOrder('asc');
    setPage(1);
    setLimit(6);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const pageButtons = useMemo(() => {
    const pages = pagination.pages || 1;
    const current = pagination.page || 1;
    const start = Math.max(1, current - 2);
    const end = Math.min(pages, start + 4);
    const buttons: number[] = [];

    for (let i = start; i <= end; i += 1) {
      buttons.push(i);
    }

    return buttons;
  }, [pagination]);

  return (
    <div className="dashboard-page">
      <AnimatedBackground />
      <main className="dashboard-container">
        <header className="panel header-panel">
          <div>
            <h1>Task Dashboard</h1>
            <p>Track progress, prioritize work, and finish on time.</p>
          </div>
          <div className="header-actions">
            <button type="button" className="secondary-btn" onClick={() => setIsDarkMode((v) => !v)}>
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
            <button type="button" className="primary-btn" onClick={openAddModal}>Add Task</button>
            <button type="button" className="danger-btn" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        {actionError && <div className="alert alert-error">{actionError}</div>}

        <section className="panel filter-panel">
          <div className="filter-grid">
            <div>
              <label htmlFor="search">Search</label>
              <input
                id="search"
                type="text"
                placeholder="Search by title"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All</option>
                <option value="Todo">Todo</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
              </select>
            </div>
            <div>
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div>
              <label htmlFor="sortBy">Sort By</label>
              <select id="sortBy" value={sortBy} onChange={(e) => setSortBy(e.target.value as 'dueDate' | 'priority' | 'createdAt')}>
                <option value="dueDate">Due Date</option>
                <option value="priority">Priority</option>
                <option value="createdAt">Created Time</option>
              </select>
            </div>
            <div>
              <label htmlFor="sortOrder">Order</label>
              <select id="sortOrder" value={sortOrder} onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}>
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
            <div>
              <label htmlFor="limit">Per Page</label>
              <select id="limit" value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>
                <option value={6}>6</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>
          </div>
          <div className="filter-actions">
            <button type="button" className="secondary-btn" onClick={resetFilters}>Reset</button>
          </div>
        </section>

        <section className="analytics-grid">
          {loadingAnalytics ? (
            <div className="panel">Loading analytics...</div>
          ) : analyticsError ? (
            <div className="panel alert alert-error">{analyticsError}</div>
          ) : analytics ? (
            <>
              <article className="panel stat-card"><h3>Total Tasks</h3><p>{analytics.totalTasks}</p></article>
              <article className="panel stat-card"><h3>Completed</h3><p>{analytics.completedTasks}</p></article>
              <article className="panel stat-card"><h3>Pending</h3><p>{analytics.pendingTasks}</p></article>
              <article className="panel stat-card"><h3>Completion</h3><p>{analytics.completionPercentage}%</p></article>
            </>
          ) : null}
        </section>

        <section className="panel tasks-panel">
          <div className="tasks-header">
            <h2>Tasks</h2>
            <span>{pagination.total} total</span>
          </div>

          {loadingTasks ? (
            <p>Loading tasks...</p>
          ) : tasksError ? (
            <div className="alert alert-error">{tasksError}</div>
          ) : tasks.length === 0 ? (
            <p className="empty-state">No tasks found for the selected filters.</p>
          ) : (
            <div className="task-list">
              {tasks.map((task) => (
                <article key={task._id} className="task-card">
                  <div className="task-main">
                    <h3>{task.title}</h3>
                    <p>{task.description}</p>
                    <div className="task-meta">
                      <span className={`badge status-${task.status.replace(' ', '-').toLowerCase()}`}>{task.status}</span>
                      <span className={`badge priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
                      <span className="badge">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="task-actions">
                    {task.status !== 'Done' && (
                      <button type="button" className="secondary-btn" onClick={() => handleMarkComplete(task._id)}>Complete</button>
                    )}
                    <button type="button" className="secondary-btn" onClick={() => openEditModal(task)}>Edit</button>
                    <button type="button" className="danger-btn" onClick={() => handleDeleteTask(task._id)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="pagination-row">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={(pagination.page || 1) <= 1 || loadingTasks}
            >
              Previous
            </button>

            <div className="page-buttons">
              {pageButtons.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={value === pagination.page ? 'page-btn page-btn-active' : 'page-btn'}
                  onClick={() => setPage(value)}
                  disabled={loadingTasks}
                >
                  {value}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="secondary-btn"
              onClick={() => setPage((prev) => Math.min(pagination.pages || 1, prev + 1))}
              disabled={(pagination.page || 1) >= (pagination.pages || 1) || loadingTasks}
            >
              Next
            </button>
          </div>
        </section>
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>{editingTask ? 'Edit Task' : 'Add Task'}</h2>
            <form onSubmit={handleSaveTask} className="modal-form">
              <div>
                <label htmlFor="title">Title</label>
                <input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              <div className="modal-grid">
                <div>
                  <label htmlFor="formStatus">Status</label>
                  <select
                    id="formStatus"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Todo' | 'In Progress' | 'Done' })}
                  >
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="formPriority">Priority</label>
                  <select
                    id="formPriority"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'Low' | 'Medium' | 'High' })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="dueDate">Due Date</label>
                <input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                />
              </div>

              {actionError && <div className="alert alert-error">{actionError}</div>}

              <div className="modal-actions">
                <button type="submit" className="primary-btn" disabled={saving}>
                  {saving ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}
                </button>
                <button type="button" className="secondary-btn" onClick={closeModal} disabled={saving}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
