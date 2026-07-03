export function AussieOSWordmark({ className = "" }: { className?: string }) {
  return (
    <a href="https://aussieos.xyz/" className={`wordmark ${className}`.trim()}>
      AUSSIE<span>OS</span>
    </a>
  );
}
