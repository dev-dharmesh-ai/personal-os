export default function CardSurface({ children, className = "", ...props }) {
  return (
    <div className={`card-surface flex flex-col ${className}`} {...props}>
      {children}
    </div>
  );
}
