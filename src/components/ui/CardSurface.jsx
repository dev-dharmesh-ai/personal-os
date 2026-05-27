export default function CardSurface({ children, className = "" }) {
  return <div className={`card-surface flex flex-col ${className}`}>{children}</div>;
}
