const FLAME_COUNT = 6;

const GhostFlames = () => (
  <div className="pointer-events-none absolute inset-x-0 -top-1.5 flex justify-around overflow-visible z-10">
    {Array.from({ length: FLAME_COUNT }).map((_, i) => (
      <svg
        key={i}
        viewBox="0 0 24 24"
        className="w-4 h-5"
        style={{
          animation: `ghost-flame-flicker ${0.5 + (i % 3) * 0.15}s ease-in-out infinite alternate`,
          animationDelay: `${i * 0.12}s`,
        }}
      >
        <path
          d="M12 2C12 2 4 10 4 16C4 20.4 7.6 24 12 24C16.4 24 20 20.4 20 16C20 10 12 2 12 2Z"
          fill="white"
          fillOpacity="0.55"
        />
      </svg>
    ))}
  </div>
);

export default GhostFlames;
