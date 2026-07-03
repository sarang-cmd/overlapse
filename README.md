# Overlapse

[![Next.js](https://img.shields.io/badge/Next.js-16.2.10-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-blue?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-V9-orange?style=for-the-badge&logo=firebase&logoColor=white)](https://firebase.google.com/)
[![Supabase](https://img.shields.io/badge/Supabase-V2-green?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

Overlapse is a modern web application built with Next.js, designed to help users manage and coordinate meetings across different timezones. It aims to simplify the complexities of scheduling by providing intuitive tools and a clean user interface.

## Features

- **Timezone Coordination:** Easily find optimal meeting times across multiple timezones.
- **Meeting Management:** Create, view, and manage your meetings with ease.
- **Responsive Design:** A seamless experience across all devices.
- **Real-time Updates:** Stay synchronized with the latest meeting changes.

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

## Technologies Used

*   **Framework:** Next.js (16.2.10)
*   **Language:** TypeScript (5+)
*   **Styling:** Tailwind CSS (4.0)
*   **Database/Auth:** Supabase (V2)
*   **Backend Services:** Firebase (V9)
*   **UI Components:** Shadcn UI, Radix UI
*   **Animation:** Framer Motion, GSAP
*   **Globe Visualization:** Globe.gl
*   **Date/Time:** Luxon, RRule

## Deployment

This application is configured for static export and deployment to Firebase Hosting (Classic).

1.  **Build the Next.js application:**
    ```bash
    npm run build
    ```
2.  **Deploy to Firebase Hosting:**
    ```bash
    firebase deploy --only hosting
    ```
    (Or `npx -y firebase-tools@latest deploy --only hosting`)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## License

[MIT License](LICENSE) (if applicable, otherwise state your license or "No License")