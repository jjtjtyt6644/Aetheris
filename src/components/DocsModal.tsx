import { motion, AnimatePresence } from "framer-motion";
import DocsContent from "./DocsContent";

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DocsModal({ isOpen, onClose }: DocsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-5xl"
          >
            <DocsContent onClose={onClose} isPage={false} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
