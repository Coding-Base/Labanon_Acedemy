import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap } from 'lucide-react';
import labanonLogo from '../pages/labanonlogo.png';

export default function Loader() {
  // Floating animation for the logo
  const floatAnimation = {
    y: [0, -20, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  };

  // Rotating circle animation
  const rotateAnimation = {
    rotate: 360,
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "linear"
    }
  };

  // Pulse animation
  const pulseAnimation = {
    scale: [1, 1.1, 1],
    opacity: [0.6, 1, 0.6],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  };

  // Text animation
  const textAnimation = {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 2.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  };

  // Particle animation
  const particleAnimation = {
    y: [0, -100],
    x: [0, Math.random() * 60 - 30],
    opacity: [1, 0],
    transition: {
      duration: 2.5,
      repeat: Infinity,
      ease: "easeOut"
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-green-50 via-white to-blue-50 flex flex-col items-center justify-center z-[9999] overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-10 left-10 w-32 h-32 bg-yellow-300 rounded-full filter blur-3xl opacity-20"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-48 h-48 bg-teal-300 rounded-full filter blur-3xl opacity-20"
          animate={{
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Outer rotating circle */}
        <motion.div
          className="absolute w-48 h-48 border-4 border-transparent border-t-green-600 border-r-teal-500 rounded-full"
          animate={rotateAnimation}
        />

        {/* Middle pulsing circle */}
        <motion.div
          className="absolute w-40 h-40 border-2 border-yellow-400 rounded-full"
          animate={pulseAnimation}
        />

        {/* Logo container */}
        <motion.div
          animate={floatAnimation}
          className="relative z-20 flex flex-col items-center"
        >
          {/* Logo with glow effect */}
          <motion.div
            className="relative"
            animate={{
              boxShadow: [
                "0 0 20px rgba(34, 197, 94, 0.3)",
                "0 0 40px rgba(34, 197, 94, 0.5)",
                "0 0 20px rgba(34, 197, 94, 0.3)",
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <img
              src={labanonLogo}
              alt="Lebanon Academy"
              className="w-32 h-32 object-contain drop-shadow-2xl"
            />
          </motion.div>

          {/* Particles around logo */}
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-yellow-600 rounded-full"
              style={{
                top: 50,
                left: 50,
              }}
              animate={particleAnimation}
              transition={{
                ...particleAnimation.transition,
                delay: i * 0.4,
              }}
            />
          ))}
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-16 text-center relative z-20"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-3">
            Lebanon Academy
          </h1>
          <p className="text-green-700 font-semibold text-lg">Future Ready Learning</p>
        </motion.div>

        {/* Loading text with animation */}
        <motion.div
          animate={textAnimation}
          className="mt-12 flex items-center gap-2 relative z-20"
        >
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-yellow-600 rounded-full"
                animate={{
                  y: [0, -8, 0],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
              />
            ))}
          </div>
          <span className="text-green-700 font-semibold ml-2">Preparing your experience...</span>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8 w-64 h-1 bg-gray-200 rounded-full overflow-hidden relative z-20"
        >
          <motion.div
            className="h-full bg-gradient-to-r from-green-600 to-blue-500"
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ width: "40%" }}
          />
        </motion.div>

        {/* Features hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-12 text-center relative z-20"
        >
          <div className="flex justify-center gap-8 mb-4">
            {[
              { icon: "📚", label: "1000+ Courses" },
              { icon: "👥", label: "50K+ Students" },
              { icon: "🎓", label: "Expert Tutors" }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1.2 + i * 0.2 }}
                className="flex flex-col items-center"
              >
                <span className="text-3xl">{feature.icon}</span>
                <span className="text-xs text-gray-600 mt-1">{feature.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Corner decorations */}
      <motion.div
        className="absolute top-8 right-8 w-12 h-12 border-2 border-yellow-400 rounded-lg"
        animate={{
          rotate: 360,
          borderColor: ["rgb(134, 239, 172)", "rgb(34, 197, 94)", "rgb(134, 239, 172)"]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      <motion.div
        className="absolute bottom-8 left-8 w-16 h-16 border-2 border-teal-400 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          borderColor: ["rgb(45, 212, 191)", "rgb(20, 184, 166)", "rgb(45, 212, 191)"]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  );
}
