# Inteligentne Fiszki (Smart Flashcards)
PR TEST 2
[![Project Status: In Development](https://img.shields.io/badge/status-in_development-blueviolet.svg)](https://shields.io)

A web application designed to help students, especially those in AI and ML fields, efficiently create study materials. It addresses the time-consuming process of manual flashcard creation by leveraging AI to automatically generate question-and-answer pairs from user-provided text notes.

## 📋 Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## 📖 Project Description

The core problem this application solves is the slow and tedious nature of creating high-quality educational flashcards. Many students have extensive digital notes but are discouraged from using spaced repetition—one of the most effective learning techniques—due to the significant time investment required to prepare materials.

**Inteligentne Fiszki** streamlines this process by allowing users to paste their notes and receive AI-generated flashcard suggestions, minimizing effort and maximizing learning efficiency. The Minimum Viable Product (MVP) focuses on essential features: AI generation, manual creation, card management, and a learning module based on the Leitner system.

## 🛠️ Tech Stack

The project uses a modern tech stack focused on performance, developer experience, and scalability.

| Category     | Technology                                                                                                                                                                                      |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend** | [Astro 5](https://astro.build/), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS 4](https://tailwindcss.com/), [Shadcn/ui](https://ui.shadcn.com/) |
| **Backend**  | [Supabase](https://supabase.com/) (PostgreSQL, Authentication, BaaS)                                                                                                                            |
| **AI**       | [OpenRouter.ai](https://openrouter.ai/) (Access to various LLMs)                                                                                                                                |
| **Testing**  | [Vitest](https://vitest.dev/) (Unit & Component), [Playwright](https://playwright.dev/) (E2E)                                                                                                   |
| **CI/CD**    | [GitHub Actions](https://github.com/features/actions)                                                                                                                                           |
| **Hosting**  | [DigitalOcean](https://www.digitalocean.com/) (via Docker)                                                                                                                                      |

## 🚀 Getting Started Locally

To set up and run the project on your local machine, follow these steps.

### Prerequisites

- **Node.js**: Version `22.14.0` (as specified in the `.nvmrc` file). We recommend using [nvm](https://github.com/nvm-sh/nvm) to manage Node versions.
- **Package Manager**: `npm`, `yarn`, or `pnpm`.
- **Supabase Account**: You will need a Supabase project for the database and authentication.
- **OpenRouter.ai Account**: You will need an API key to connect to the AI model provider.

### Installation

1.  **Clone the repository:**

    ```sh
    git clone https://github.com/your-username/inteligentne-fiszki.git
    cd inteligentne-fiszki
    ```

2.  **Install the correct Node.js version (if using nvm):**

    ```sh
    nvm use
    ```

3.  **Install dependencies:**

    ```sh
    npm install
    ```

4.  **Set up environment variables:**
    Create a `.env` file in the root of the project by copying the example file:

    ```sh
    cp .env.example .env
    ```

    Populate the `.env` file with your credentials from Supabase and OpenRouter:

    ```env
    # Supabase
    PUBLIC_SUPABASE_URL="your-supabase-project-url"
    PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"

    # OpenRouter.ai
    OPENROUTER_API_KEY="your-openrouter-api-key"
    ```

5.  **Run the development server:**
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:4321`.

## 📜 Available Scripts

The `package.json` file includes the following scripts:

- `npm run dev`: Starts the Astro development server with hot-reloading.
- `npm run build`: Builds the application for production.
- `npm run preview`: Starts a local server to preview the production build.
- `npm run lint`: Runs ESLint to analyze the code for potential errors.
- `npm run lint:fix`: Runs ESLint and automatically fixes fixable issues.
- `npm run format`: Formats the code using Prettier.

## 🎯 Project Scope

### Key Features (MVP)

- **User Accounts**: Secure registration and login for users.
- **AI Flashcard Generator**: Generate flashcard suggestions from pasted text using an LLM.
- **Manual Creation**: A form for users to create their own custom flashcards.
- **Flashcard Management**: View, edit, and delete flashcards. All cards are private to the owner.
- **Leitner System**: A simple spaced repetition system to help with learning and memorization.

### Out of Scope (For Now)

- Advanced repetition algorithms (e.g., SuperMemo, Anki).
- Importing complex file formats like PDF, DOCX, or MD.
- Social features like sharing flashcard decks.
- Integrations with other e-learning platforms or tools.
- Native mobile applications for iOS or Android.

## 📊 Project Status

This project is currently **in the development phase for the MVP**.

The key success metrics for the MVP are:

1.  **AI Acceptance Rate**: 75% of AI-generated flashcards are accepted by the user.
2.  **AI Adoption Rate**: 75% of all flashcards in the system are created using the AI generator.

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for more details.
