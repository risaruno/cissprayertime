interface GlassProps {
  children: React.ReactNode;
  active?: boolean;
}

export default function Glass({ children, active = false }: GlassProps) {
  return (
    <div className={`liquidGlass-wrapper dock ${active ? 'active' : ''}`}>
      <div className="liquidGlass-effect"></div>
      <div className="liquidGlass-tint"></div>
      <div className="liquidGlass-shine"></div>
      <div className="liquidGlass-text">
        {children}
      </div>
    </div>
  );
}