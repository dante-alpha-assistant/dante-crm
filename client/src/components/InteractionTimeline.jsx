import { useState } from 'react';
import { formatRelativeDate, typeIcon, typeLabel } from '../lib/interactions';

export default function InteractionTimeline({ interactions, onEdit, onDelete }) {
  const [expandedId, setExpandedId] = useState(null);

  if (interactions.length === 0) {
    return <p className="empty-state">No interactions yet. Add your first one above.</p>;
  }

  return (
    <div className="timeline">
      {interactions.map((interaction) => {
        const expanded = expandedId === interaction.id;
        return (
          <div key={interaction.id} className="timeline-item">
            <div
              className="timeline-row"
              onClick={() => setExpandedId(expanded ? null : interaction.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setExpandedId(expanded ? null : interaction.id);
                }
              }}
            >
              <span className="timeline-icon" title={typeLabel(interaction.type)}>
                {typeIcon(interaction.type)}
              </span>
              <div className="timeline-content">
                <span className="timeline-type">{typeLabel(interaction.type)}</span>
                {interaction.summary && (
                  <span className="timeline-summary">{interaction.summary}</span>
                )}
              </div>
              <span className="timeline-date">
                {formatRelativeDate(interaction.occurred_at)}
              </span>
              <span className="timeline-chevron">{expanded ? '▾' : '▸'}</span>
            </div>

            {expanded && (
              <div className="timeline-details">
                {interaction.details ? (
                  <p className="timeline-details-text">{interaction.details}</p>
                ) : (
                  <p className="timeline-details-text empty">No details provided.</p>
                )}
                <div className="timeline-actions">
                  <button
                    className="btn btn-sm"
                    onClick={(e) => { e.stopPropagation(); onEdit(interaction); }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this interaction?')) onDelete(interaction.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
