This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Lobby characters

The lobby automatically discovers characters from subfolders in `public/characters`. Each character folder must contain `stand`, `walk_left`, and `walk_right` image files (`.gif`, `.webp`, `.png`, `.jpg`, `.jpeg`, and `.avif` are supported; each file can use its own extension) to appear in the scene. An optional `link.txt` containing an `http://` or `https://` URL makes that character open the link in a new tab when clicked. Characters wander in random directions, pause between walks, and remain still when reduced motion is enabled.

The header includes Google search and a 24-hour local clock with seconds. Add background images in `public/bekgron` to make them available in the **Change Background** panel. The selected background is saved in browser storage and restored on the next visit; choosing **DEFAULT** clears the saved selection.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
