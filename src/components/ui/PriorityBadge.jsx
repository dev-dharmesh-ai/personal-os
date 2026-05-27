const priorityClasses = {
  High: "bg-error/15 text-error",
  Medium: "bg-primary-container/15 text-primary-container",
  Low: "bg-secondary-fixed/15 text-secondary-fixed",
};

export default function PriorityBadge({ priority }) {
  return (
    <span
      className={`font-label-caps text-label-caps px-3 py-1 rounded-full ${priorityClasses[priority] || priorityClasses.Low}`}
    >
      {priority}
    </span>
  );
}
