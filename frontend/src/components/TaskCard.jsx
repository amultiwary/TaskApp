export default function TaskCard({ task, onToggle, onEdit, onDelete }) {
  const isDone = task.status === 'completed';

  const createdDate = new Date(task.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  const dueDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  const isOverdue = task.dueDate && task.status === 'pending' && new Date(task.dueDate) < new Date();

  return (
    <div className={`task-card priority-${task.priority} ${isDone ? 'completed' : ''}`}>
      <button
        className={`task-checkbox ${isDone ? 'done' : ''}`}
        onClick={() => onToggle(task._id)}
        aria-label={isDone ? 'Mark as pending' : 'Mark as complete'}
        title={isDone ? 'Mark as pending' : 'Mark as complete'}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 6l3 3 5-5" />
        </svg>
      </button>

      <div className="task-body">
        <p className="task-title">{task.title}</p>
        {task.description && <p className="task-desc">{task.description}</p>}
        <div className="task-meta">
          <span className={`badge badge-${task.priority}`}>{task.priority}</span>
          <span className={`badge badge-${task.status}`}>{task.status}</span>
          <span className="task-date">Created {createdDate}</span>
          {dueDate && (
            <span className={`task-due ${isOverdue ? 'overdue' : ''}`}>
              {isOverdue ? '⚠ ' : ''}Due {dueDate}
            </span>
          )}
          {isDone && task.completedAt && (
            <span className="task-date" style={{ color: 'var(--success)', opacity: 0.7 }}>
              ✓ {new Date(task.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      </div>

      <div className="task-actions">
        <button className="btn btn-ghost btn-icon" onClick={() => onEdit(task)} aria-label="Edit task" title="Edit">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button className="btn btn-danger btn-icon" onClick={() => onDelete(task._id)} aria-label="Delete task" title="Delete">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
          </svg>
        </button>
      </div>
    </div>
  );
}