/**
 * Type icons for interaction types.
 */
const ICONS = {
  call: '📞',
  email: '✉️',
  meeting: '🤝',
  note: '📝',
  message: '💬',
};

const LABELS = {
  call: 'Call',
  email: 'Email',
  meeting: 'Meeting',
  note: 'Note',
  message: 'Message',
};

export function typeIcon(type) {
  return ICONS[type] || '📌';
}

export function typeLabel(type) {
  return LABELS[type] || type;
}

/**
 * Format a date string as a human-friendly relative date.
 */
export function formatRelativeDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}
