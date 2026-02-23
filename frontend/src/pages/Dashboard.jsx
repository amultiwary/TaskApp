import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import TaskCard from '../components/TaskCard';
import AddTaskModal from '../components/AddTaskModal';

export default function Dashboard() {
  const [tasks, setTasks]   = useState([]);
  const [stats, setStats]   = useState({ total: 0, completed: 0, pending: 0 });
  const [filter, setFilter] = useState('all');
  const [modal, setModal]   = useState({ open: false, mode: 'create', task: null });
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  const fetchStats = useCallback(async () => {
    const { data } = await api.get('/tasks/stats');
    setStats(data);
  }, []);

  const fetchTasks = useCallback(async (currentFilter) => {
    const params = currentFilter !== 'all' ? { status: currentFilter } : {};
    const { data } = await api.get('/tasks', { params });
    setTasks(data);
  }, []);

  const loadAll = useCallback(async (currentFilter = filter) => {
    setError('');
    try {
      await Promise.all([fetchTasks(currentFilter), fetchStats()]);
    } catch {
      setError('Failed to load tasks. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [fetchTasks, fetchStats, filter]);

  useEffect(() => { loadAll(); }, []);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    fetchTasks(newFilter);
  };

  const handleCreate = async (payload) => {
    const { data } = await api.post('/tasks', payload);
    setTasks((prev) => [data, ...prev]);
    setStats((prev) => ({ ...prev, total: prev.total + 1, pending: prev.pending + 1 }));
  };

  const handleUpdate = async (payload) => {
    const id = modal.task._id;
    const { data } = await api.patch(`/tasks/${id}`, payload);
    setTasks((prev) => prev.map((t) => (t._id === id ? data : t)));
  };

  const handleToggle = async (id) => {
    // Optimistic update — flip before server confirms
    const snapshot = tasks;
    const task = tasks.find((t) => t._id === id);
    setTasks((prev) => prev.map((t) =>
      t._id === id
        ? { ...t, status: t.status === 'pending' ? 'completed' : 'pending',
              completedAt: t.status === 'pending' ? new Date().toISOString() : null }
        : t
    ));
    if (task) {
      setStats((s) => ({
        ...s,
        completed: task.status === 'pending' ? s.completed + 1 : s.completed - 1,
        pending:   task.status === 'pending' ? s.pending   - 1 : s.pending   + 1,
      }));
    }
    try {
      const { data } = await api.patch(`/tasks/${id}/toggle`);
      setTasks((prev) => prev.map((t) => (t._id === id ? data : t)));
    } catch {
      setTasks(snapshot); // Rollback
      await fetchStats();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task? This cannot be undone.')) return;
    const deletedTask = tasks.find((t) => t._id === id);
    setTasks((prev) => prev.filter((t) => t._id !== id));
    setStats((prev) => ({
      ...prev,
      total: prev.total - 1,
      [deletedTask?.status === 'completed' ? 'completed' : 'pending']:
        prev[deletedTask?.status === 'completed' ? 'completed' : 'pending'] - 1,
    }));
    try {
      await api.delete(`/tasks/${id}`);
    } catch {
      await loadAll(); // Rollback
    }
  };

  const openCreate = () => setModal({ open: true, mode: 'create', task: null });
  const openEdit   = (task) => setModal({ open: true, mode: 'edit', task });
  const closeModal = () => setModal({ open: false, mode: 'create', task: null });

  const handleModalSubmit = async (payload) => {
    if (modal.mode === 'edit') await handleUpdate(payload);
    else await handleCreate(payload);
  };

  const filters = [
    { key: 'all',       label: `All (${stats.total})` },
    { key: 'pending',   label: `Pending (${stats.pending})` },
    { key: 'completed', label: `Done (${stats.completed})` },
  ];

  return (
    <div className="dashboard">
      <Navbar />

      <div className="stats-bar">
        <div className="stat-block">
          <div className="stat-value amber">{stats.total}</div>
          <div className="stat-label">Total Tasks</div>
        </div>
        <div className="stat-block">
          <div className="stat-value muted">{stats.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-block">
          <div className="stat-value green">{stats.completed}</div>
          <div className="stat-label">Completed</div>
        </div>
      </div>

      <main className="main-content">
        {error && <div className="global-error">{error}</div>}

        <div className="toolbar">
          <h2 className="toolbar-title">Tasks</h2>
          <div className="filter-tabs" role="tablist">
            {filters.map(({ key, label }) => (
              <button key={key} role="tab" aria-selected={filter === key}
                className={`filter-tab ${filter === key ? 'active' : ''}`}
                onClick={() => handleFilterChange(key)}>
                {label}
              </button>
            ))}
          </div>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>+ New task</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div className="spinner" style={{ margin: '0 auto', width: 28, height: 28 }} />
          </div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M12 12v4M10 14h4"/>
            </svg>
            <h3>No tasks here</h3>
            <p>{filter === 'all' ? 'Add your first task to get started.' : `No ${filter} tasks.`}</p>
            {filter === 'all' && (
              <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={openCreate}>
                + Create task
              </button>
            )}
          </div>
        ) : (
          <div className="task-list">
            {tasks.map((task) => (
              <TaskCard key={task._id} task={task} onToggle={handleToggle} onEdit={openEdit} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>

      {modal.open && (
        <AddTaskModal task={modal.task} onSubmit={handleModalSubmit} onClose={closeModal} />
      )}
    </div>
  );
}