# ramirorivas.dev

Personal portfolio: seven projects with technical case studies and video walkthroughs.
The site itself is part of the showcase - built from scratch with Astro 5, React islands,
Tailwind CSS 4, GSAP ScrollTrigger, Lenis smooth scrolling, and a hand-rolled interactive
canvas simulation in the hero.

## Develop

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static build to dist/
npm run preview    # serve the production build
```

## Content

Each project is one MDX file in `src/content/projects/` with frontmatter for title,
stack, links, and an optional `video` path. Drop a walkthrough recording into
`public/videos/<slug>.mp4` and set `video: '/videos/<slug>.mp4'` in the frontmatter to
replace the placeholder.

## Deploy

Static output, deployed on Cloudflare Pages:

- Build command: `npm run build`
- Output directory: `dist`
