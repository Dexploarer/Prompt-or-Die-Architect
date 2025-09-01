# Glass AI Diagrams

Glass AI Diagrams is a web-based application that uses AI to generate system architecture diagrams and project plans from natural language descriptions.

## Features

-   **Generate Diagrams from Text:** Describe your idea, and the application will generate a system architecture diagram.
-   **AI-Powered Suggestions:** Get suggestions for improving your architecture based on your goals.
-   **Export to PNG:** Export your diagrams as PNG images.
-   **Generate Project Plans:** Generate comprehensive project plans in JSON format.
--   **Export Plans to PDF:** Export your project plans as PDF documents.
-   **User Authentication:** Secure your work with GitHub-based authentication.
-   **Persistence:** Save your diagrams and documents to continue working on them later.

## Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or later)
-   [Bun](https://bun.sh/)

### Setup

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies:**

    ```bash
    bun install
    ```

3.  **Set up environment variables:**

    Create a `.env.local` file in the root of the project and add the following environment variables:

    ```
    OPENAI_API_KEY="your-openai-api-key"
    GITHUB_ID="your-github-oauth-app-client-id"
    GITHUB_SECRET="your-github-oauth-app-client-secret"
    ```

    -   You can get your OpenAI API key from the [OpenAI Platform](https://platform.openai.com/).
    -   You can create a GitHub OAuth application at [https://github.com/settings/applications/new](https://github.com/settings/applications/new). The callback URL should be `http://localhost:3000/api/auth/callback/github`.

### Running the Application

To run the application in development mode, use the following command:

```bash
bun dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Running Tests

To run the tests, use the following command:

```bash
bun test
```

## Tech Stack

-   [Next.js](https://nextjs.org/) - React framework
-   [ReactFlow](https://reactflow.dev/) - for rendering diagrams
-   [Tailwind CSS](https://tailwindcss.com/) - for styling
-   [OpenAI API](https://platform.openai.com/) - for AI-powered features
-   [NextAuth.js](https://next-auth.js.org/) - for authentication
-   [Jest](https://jestjs.io/) & [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - for testing
