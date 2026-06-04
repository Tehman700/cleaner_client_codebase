interface Props {
  src: string;
  label: string;
  onClose: () => void;
}

export default function Lightbox({ src, label, onClose }: Props) {
  return (
    <div className="lightbox open" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose}>✕</button>
      <img src={src} alt={label} onClick={e => e.stopPropagation()} />
      <div className="lightbox-label">{label}</div>
    </div>
  );
}
