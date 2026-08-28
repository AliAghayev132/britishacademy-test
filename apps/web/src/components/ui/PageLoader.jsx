'use client'

// Yüklənmə göstəricisi — sırayla «nəfəs alan» üç-dörd nöqtə.
//
// Əvvəl framer-motion işlədirdi. Animasiya sadə scale+opacity dövrüdür,
// CSS keyframes bunu eyni şəkildə edir və ~123 KB kitabxana asılılığı aradan
// qalxır. Gecikmə (stagger) `animation-delay` ilə verilir.
//
// Keyframe-lər globals.css-dədir: `ba-dot-pulse` və `ba-fade-in`.

const dots = [0, 1, 2, 3]

export const PageLoader = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center h-64 select-none">
      {/* Nöqtələr */}
      <div className="flex items-center gap-1.5 mb-4">
        {dots.map((i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-cyan-500"
            style={{
              animation: 'ba-dot-pulse 1s ease-in-out infinite',
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>

      {/* Mətn — qısa gecikmə ilə görünür */}
      <p
        className="text-sm text-gray-400 font-medium"
        style={{ animation: 'ba-fade-in .3s ease-out .3s both' }}
      >
        {message}
      </p>
    </div>
  )
}
