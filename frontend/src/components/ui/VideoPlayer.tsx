interface VideoPlayerProps {
  src: string;
  className?: string;
}

export function VideoPlayer({ src, className = '' }: VideoPlayerProps) {
  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      <video
        controls
        className="w-full h-full"
        style={{ aspectRatio: '9/16', maxHeight: '600px' }}
      >
        <source src={src} type="video/mp4" />
        Your browser does not support video playback.
      </video>
    </div>
  );
}
