import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { TopAppBar } from './TopAppBar.jsx';
import { RetroGrid } from '../ui/RetroGrid.jsx';

// Public-facing shell. Renders the nav + the routed page on top of the
// retro grid background, with a smooth fade/slide between routes.

const PAGE_VARIANTS = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -4 },
};

const PAGE_TRANSITION = {
  duration: 0.28,
  ease: [0.16, 1, 0.3, 1],
};

export const AppLayout = () => {
  const location = useLocation();
  return (
    <div className="relative min-h-screen">
      <RetroGrid className="fixed inset-0 -z-10" />
      <TopAppBar />
      <main className="relative">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            variants={PAGE_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={PAGE_TRANSITION}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};
