'use client'

import { motion } from 'framer-motion'

const dots = [0, 1, 2, 3]

// A simple animated loading indicator. Pass a custom `message` per route.
export const PageLoader = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center h-64 select-none">
      {/* Animated dots */}
      <div className="flex items-center gap-1.5 mb-4">
        {dots.map((i) => (
          <motion.div
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-cyan-500"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Message */}
      <motion.p
        className="text-sm text-gray-400 font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {message}
      </motion.p>
    </div>
  )
}
