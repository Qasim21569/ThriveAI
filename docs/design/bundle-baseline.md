# Bundle Baseline — Plan 4 Task 1

Measured with `npm run build` (Next 14 production build) on the same commit, before and
after the dependency purge. "Shared" = First Load JS shared by all routes.

## Before (with unused deps + old next.config webpack overrides)

- **Shared first-load JS: 518 kB**
- Heaviest routes: /coach 525 kB, /today 524 kB, /fitness/plan 524 kB

## After (29 packages removed, next.config cleaned, framer-motion ^12)

- **Shared first-load JS: 84.5 kB** (−433.5 kB, **−83.7%**)
- Removed (zero imports verified per package): three, @react-three/drei, @react-three/fiber,
  @react-three/postprocessing, three-mesh-bvh, maath, @mui/material, @mui/icons-material,
  @mui/system, @mui/x-date-pickers, @emotion/react, @emotion/styled, gsap, @react-spring/web,
  lottie-react, locomotive-scroll, smooth-scrollbar, chart.js, react-chartjs-2,
  @heroicons/react, @huggingface/inference, node-fetch, buffer, stream-browserify, util,
  encoding, @shadcn/ui, @splinetool/runtime (dev), @types/three (dev)
- next.config.js: removed three.js alias, encoding fallback, manual splitChunks, MUI
  optimizePackageImports — the manual splitChunks override was forcing a giant shared
  vendor chunk; its removal is a large part of the win.
- Kept: framer-motion (upgraded ^10 → ^12; the only animation runtime per the brief).

Task 13 (visual QA gate) appends the final numbers after all UI work.
