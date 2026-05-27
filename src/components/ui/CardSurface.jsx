export default function CardSurface({ children, className = "" }) {
  return <div className={`card-surface ${className}`}>{children}</div>;
}
