"use client";

import { motion } from "framer-motion";

/** Route transition inside the app shell: content settles in when you switch sections. */
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}