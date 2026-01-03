# agarrison.dev - Portfolio Website

## Project Overview
Personal portfolio website for Andrew Garrison featuring playful animations, glass morphism design, and interactive navigation. Built as a single-page application with section-based routing.

## Tech Stack
- **Framework**: Next.js 16.1.1 (App Router)
- **React**: 19.2.3
- **TypeScript**: 5.x
- **Styling**: Tailwind CSS 4 with custom CSS variables
- **Animations**: GSAP 3.14.2 with MorphSVGPlugin
- **Audio**: use-sound for interaction feedback
- **Fonts**: Playfair Display (serif/headings), Libre Franklin (sans/body)

## Architecture

### Navigation System
Single-page app with four main sections: home, projects, about, contact. URL routing uses Next.js rewrites to map `/projects`, `/about`, `/contact` back to `/` while maintaining URLs for sharability.

### Animation Strategy
- **GSAP-powered transitions**: Directional slide animations with elastic bounce
- **Morphing SVG Dock**: Living blob indicator with breathing animation and stretch-on-click
- **Parallax background**: CSS transitions shift cloud image based on active section
- **Sound effects**: Click-down/up sounds on navigation interactions

### State Management
Client-side section state managed in `src/app/page.tsx` with global function exposure for cross-component communication. Background parallax controlled via global `setParallaxSection` function.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with fonts, WindowFrame, Dock
│   ├── page.tsx            # Main page with section navigation logic
│   ├── globals.css         # CSS variables, glass morphism, animations
│   └── projects/[slug]/    # Dynamic project detail pages
│
├── components/
│   ├── layout/
│   │   ├── Dock.tsx                # Morphing blob navigation
│   │   ├── WindowFrame.tsx         # Outer frame wrapper
│   │   └── ParallaxBackground.tsx  # Parallax cloud background
│   │
│   ├── sections/
│   │   ├── Hero.tsx        # Home section with animated chars
│   │   ├── Projects.tsx    # Projects grid/carousel
│   │   ├── About.tsx       # About section
│   │   └── Contact.tsx     # Contact section
│   │
│   └── ui/
│       ├── GlassCard.tsx       # Reusable glass morphism card
│       └── ProjectCard.tsx     # Project showcase card
│
└── data/
    └── projects.ts         # Project data with TypeScript interface

public/
├── clouds.jpeg            # Parallax background image
└── audio/                # Dock interaction sounds
```

## Key Components

### Dock (`components/layout/Dock.tsx`)
Interactive navigation with morphing SVG blob indicator. Features:
- Stretch animation on mousedown (anticipation)
- Elastic snap to target on mouseup
- Breathing animation when idle
- Sound effects for tactile feedback
- Prevents animation on already-active sections

### Page Transitions (`app/page.tsx`)
Section-based navigation with:
- Direction-aware animations (left/right based on section order)
- Distance-scaled bounce intensity (farther navigation = more bounce)
- Directional character/content stagger
- Hero section special handling with character-by-character animation
- Previous section tracking to prevent flashing during transitions

### Glass Morphism System (`globals.css`)
CSS variable-based design system:
- `.glass` - Standard glass effect
- `.glass-strong` - Enhanced blur and background
- `.glass-interactive` - Hover effects
- Custom backdrop blur with fallback

## Design System

### Colors
- **Sky Blue Gradient**: `#7DD3FC` → `#38BDF8` → `#0EA5E9` → `#0284C7`
- **Glass Effects**: White overlays with 12-18% opacity, 16-24px blur
- **Text**: White with 60-100% opacity based on hierarchy

### Typography
- **Headings**: Playfair Display (serif, playful)
- **Body**: Libre Franklin (sans-serif, clean)
- Blue/white color scheme for contrast

### Spacing
- Frame padding: 24px mobile, 32px desktop
- Border radius: 12-24px range for modern, soft feel

## Development

### Commands
```bash
npm run dev    # Start dev server (localhost:3000)
npm run build  # Production build
npm run start  # Start production server
npm run lint   # Run ESLint
```

### Important Conventions
- All animations use GSAP, not CSS keyframes
- Section refs exposed globally via `window.navigateToSection` and `window.setParallaxSection`
- Components use `forwardRef` for GSAP animation targets
- Sound files stored in `/public/audio/`
- Projects data centralized in `/src/data/projects.ts`

## State Flow
1. User clicks dock item
2. Sound plays, stretch animation begins
3. On mouseup: complete transition or cancel if mouse moved away
4. URL updates via `window.history.pushState`
5. GSAP animates current section out, next section in
6. Parallax background shifts
7. Section content animates in with directional stagger
8. Dock blob morphs to new position with elastic ease

## Known Patterns
- `'use client'` directive on interactive components
- CSS variables for theming (`--glass-bg`, `--sky-base`, etc.)
- TypeScript interfaces for data structures
- Ref objects for GSAP animation targets
- Timeline-based animations with stagger and callbacks
- Performance optimizations: `will-change`, `backface-visibility`

## Browser Support
Modern browsers with backdrop-filter support. Fallbacks provided for `-webkit-backdrop-filter`.
