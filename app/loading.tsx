"use client"

import { motion } from "framer-motion"

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden">
      {/* Subtle background orbs like Cluely */}
      <motion.div
        className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-gradient-to-br from-[#2bbcff]/15 to-[#a259ff]/10 blur-3xl"
        animate={{ x: [0, 40, 0], y: [0, 20, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-tl from-[#a259ff]/15 to-[#2bbcff]/10 blur-3xl"
        animate={{ x: [0, -40, 0], y: [0, -30, 0], scale: [1, 0.97, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 text-center">
        {/* Ring loader */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative h-24 w-24 mx-auto mb-8"
        >
          {/* Outer pulsing ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-[#2bbcff]/30"
            animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0.2, 0.6] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Rotating gradient arc */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "conic-gradient(from 0deg, rgba(43,188,255,0.8), rgba(162,89,255,0.3), transparent 60%)",
              WebkitMask:
                "radial-gradient(farthest-side, transparent calc(100% - 8px), black calc(100% - 7px))",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
          />
          {/* Center brand */}
          <motion.div
            className="absolute inset-3 rounded-full bg-black flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="text-white font-extrabold tracking-widest">
              ES
            </span>
          </motion.div>
        </motion.div>

        {/* Brand wordmark */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-2xl font-extrabold tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-[#2bbcff] to-[#a259ff] mb-3"
        >
          ELITESCORE
        </motion.h1>

        {/* Progress shimmer */}
        <div className="relative mx-auto h-1 w-48 overflow-hidden rounded-full bg-zinc-800">
          <motion.div
            className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-[#2bbcff] to-[#a259ff]"
            animate={{ x: ["-33%", "100%"] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-zinc-400 mt-4 text-sm"
        >
          Preparing your growth journey…
        </motion.p>
      </div>
    </div>
  )
}

