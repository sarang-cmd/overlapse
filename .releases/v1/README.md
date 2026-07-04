# Overlapse

[![Live Preview](https://img.shields.io/badge/Live_Preview-Deployed_App-brightgreen?style=for-the-badge&logo=firebase)](https://overlapse-dev.web.app) 
[![Next.js](https://img.shields.io/badge/Next.js-16.2.10-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-blue?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-V9-orange?style=for-the-badge&logo=firebase&logoColor=white)](https://firebase.google.com/)
[![Supabase](https://img.shields.io/badge/Supabase-V2-green?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

Overlapse is a sophisticated web application built using the Next.js framework, meticulously designed to alleviate the complexities of scheduling and coordinating meetings across diverse timezones. In an increasingly globalized world, effective cross-timezone communication is paramount. Overlapse addresses this challenge by providing an intuitive, real-time platform that streamlines the process of finding optimal meeting slots, managing invites, and ensuring all participants are synchronized, regardless of their geographical location.

Our vision for Overlapse is to create a frictionless meeting coordination experience, empowering teams and individuals to collaborate more efficiently and reduce the time lost to scheduling conflicts. With a focus on user experience, performance, and scalability, Overlapse leverages modern web technologies to deliver a robust and reliable solution.

## Features

- **Intelligent Timezone Coordination:** Advanced algorithms to suggest the best meeting times, minimizing overlap and maximizing attendance across various time zones.
- **Comprehensive Meeting Management:** Create, edit, delete, and view meetings with a rich set of details, including attendees, agendas, and attached resources.
- **Real-time Synchronization:** Instant updates for all meeting changes, ensuring everyone has the most current information.
- **Interactive Calendar View:** A dynamic and user-friendly calendar interface for visualizing schedules and availability.
- **User Authentication & Authorization:** Secure user sign-up and login, with role-based access control for meeting management.
- **Responsive and Adaptive UI/UX:** A meticulously crafted user interface that provides an optimal viewing and interaction experience across a wide range of devices, from desktops to mobile phones.
- **Integration with External Calendars (Future):** Planned support for syncing with popular calendar services.

## Core Concepts and Architecture

Overlapse is built upon a modern, full-stack architecture designed for performance and scalability:

*   **Next.js (Frontend & Backend):** Utilized for its powerful React framework, enabling both static site generation (SSG) for fast initial loads and server-side rendering (SSR) capabilities for dynamic content. The App Router handles routing and data fetching.
*   **Firebase (Hosting):** Provides fast and secure hosting for the statically exported Next.js application, ensuring global content delivery.
*   **Supabase (Database & Authentication):** A robust open-source alternative to Firebase, offering a PostgreSQL database, real-time subscriptions, and a comprehensive authentication system. Supabase handles user management and all application data.
*   **Tailwind CSS (Styling):** A utility-first CSS framework for rapidly building custom designs without leaving your HTML.

## Getting Started

To get Overlapse up and running on your local machine, follow these steps:

### Prerequisites

Ensure you have the following installed:

*   Node.js (LTS version recommended)
*   npm or Yarn
*   Git

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/sarang-cmd/overlapse.git
    cd overlapse
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

### Environment Variables

Create a `.env.local` file in the root of your project and add the following environment variables, which are essential for connecting to your Supabase project:

```
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

*   **`NEXT_PUBLIC_SUPABASE_URL`**: The URL of your Supabase project. You can find this in your Supabase project settings under "API".
*   **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: Your Supabase "anon" key. This is a public key that allows unauthenticated access to your Supabase project (e.g., for user sign-up/login). Found in the same "API" settings page.

### Running Locally

Once the dependencies are installed and environment variables are set, you can start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. The application will hot-reload as you make changes to the code.

## Script Commands

*   `npm run dev`: Starts the development server with hot-reloading.
*   `npm run build`: Creates an optimized production build of the application for static export.
*   `npm run start`: Serves the statically built application locally (after running `npm run build`).
*   `npm run lint`: Runs ESLint to check for code quality and style issues.

## Technologies Used

*   **Framework:** Next.js (16.2.10)
*   **Language:** TypeScript (5+)
*   **Styling:** Tailwind CSS (4.0)
*   **Database/Auth:** Supabase (V2) - PostgreSQL, Realtime, Authentication
*   **Hosting:** Firebase (V9) - Static content hosting
*   **UI Components:** Shadcn UI, Radix UI - Accessible and customizable UI components
*   **Animation:** Framer Motion, GSAP - Advanced animation libraries for fluid user experiences
*   **Globe Visualization:** Globe.gl - Interactive 3D globe for timezone visualization
*   **Date/Time:** Luxon, RRule - Powerful libraries for date, time, and recurrence rule management

## Deployment

This application is configured for static export and deployment to Firebase Hosting (Classic). Please ensure your Firebase project is set up correctly.

1.  **Build the Next.js application for static export:**
    ```bash
    npm run build
    ```
    This command will generate the static HTML, CSS, and JavaScript files in the `out` directory.

2.  **Deploy to Firebase Hosting:**
    ```bash
    firebase deploy --only hosting
    ```
    (Or `npx -y firebase-tools@latest deploy --only hosting` if the Firebase CLI is not globally installed.)

    This command uploads the contents of the `out` directory to your Firebase Hosting instance.

## Learn More

To learn more about the core technologies used in this project, refer to their official documentation:

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Contributing

We welcome contributions to Overlapse! If you have suggestions, bug reports, or want to contribute code, please feel free to:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'feat: Add new feature'`).
5.  Push to the branch (`git push origin feature/your-feature-name`).
6.  Open a Pull Request.

Please ensure your code adheres to the project's coding standards and includes appropriate tests.

## License

This project is licensed under the [MIT License](LICENSE).