import { useState } from 'react';

const initialForm = { title: '', description: '', priority: 'medium', dueDate: '' };

export default function AddTaskModal({ task = null, onSubmit, onClose }) {
  const isEdit = Boolean(task);

  const [form, setForm] = useState(() =>
    task
      ? { title: task.title || '', description: task.description || '',
          priority: task.priority || 'medium', dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '' }
      : { ...initialForm }
  );

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (form.title.length > 120) e.title = 'Max 120 characters';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length > 0) { setErrors(v); return; }
    setLoading(true);
    try {
      const payload = { title: form.title.trim(), description: form.description.trim(), priority: form.priority };
      if (form.dueDate) payload.dueDate = form.dueDate;
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => { if (e.target === e.currentTarget) onClose(); };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit task' : 'New task'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {errors.submit && <div className="global-error">{errors.submit}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="modal-title">Title *</label>
            <input id="modal-title" name="title" type="text" className="form-input"
              placeholder="What needs to be done?" value={form.title} onChange={handleChange} autoFocus maxLength={120} />
            {errors.title && <p className="form-error">{errors.title}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="modal-desc">Description</label>
            <textarea id="modal-desc" name="description" className="form-textarea"
              placeholder="Add more context (optional)..." value={form.description} onChange={handleChange} maxLength={1000} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="modal-priority">Priority</label>
              <select id="modal-priority" name="priority" className="form-select" value={form.priority} onChange={handleChange}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="modal-due">Due Date</label>
              <input id="modal-due" name="dueDate" type="date" className="form-input"
                value={form.dueDate} onChange={handleChange} style={{ colorScheme: 'dark' }} />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : (isEdit ? 'Save changes' : 'Add task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}