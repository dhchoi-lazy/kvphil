# KVPhil Project

This project consists of a [Next.js](https://nextjs.org) frontend, a Python backend, and utilizes Docker Compose for container orchestration, including a NordVPN container for external connections.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed.
- Credentials for necessary services (see Environment Variables).

## Environment Variables

This application requires several environment variables to be set. Create a `.env` file in the project root (you can copy `.env.example` if it exists, otherwise create it manually) and fill in the following values based on your `.env` and `docker compose.yml`:

- **Database:**
  - `POSTGRES_PASSWORD`: Ask me if you connect to the database.
- **Authentication:**
  - `NEXTAUTH_SECRET`: A secret key for NextAuth session encryption. Generate a secure key using: `openssl rand -base64 32`.
  - `NEXTAUTH_URL`: The absolute URL of your NextAuth deployment (e.g., `http://localhost:3010/kvphil/api/auth` for local development via Docker, or your production URL). Update this in your `.env`.
  - `AUTH_URL`: Similar to `NEXTAUTH_URL`, update this in `.env`.
- **API Keys:**
  - `OPENAI_API_KEY`: Your API key from OpenAI. Required for features leveraging the OpenAI API. Obtain from your OpenAI account.
- **VPN:**
  - `NORDVPN_TOKEN`: Your NordVPN personal access token required for the `vpn` service in `docker compose.yml`. Obtain this from your [NordVPN account settings](https://my.nordaccount.com/dashboard/nordvpn/) under "Manual Setup". See [NordVPN documentation](https://support.nordvpn.com/General-info/Features/1999708942/What-is-NordVPN-personal-access-token-and-how-to-use-it.htm) for more details.
- **Application URLs:**
  - `NEXT_PUBLIC_APP_URL`: The public base URL of your application (e.g., `http://localhost:3010/kvphil` for local Docker access).
  - `NEXT_PUBLIC_BASE_PATH`: The base path if your application is served under a subpath (e.g., `/kvphil`).
  - `NEXT_PUBLIC_NEXTAUTH_URL`: Public URL for NextAuth API endpoints (should match `NEXTAUTH_URL`).
  - `NEXT_PUBLIC_INTERNAL_API_URL`: The URL the frontend uses to communicate with the backend. Within the Docker network defined in `docker compose.yml`, this is `http://vpn-host:8080`.
- **Server Configuration:**
  - `NODE_ENV`: Set to `development` or `production`. Passed as a build argument in `docker compose.yml`.
  - `PYTHONPATH`: Set in `.env` (e.g., `/app`) for the backend container.

**Important:** Ensure the `.env` file is listed in your `.gitignore` and is **never** committed to version control due to sensitive credentials.

## Getting Started with Docker Compose

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <your-repository-directory>
    ```
2.  **Create and configure your `.env` file:**
    Follow the instructions in the "Environment Variables" section above, ensuring all required variables are present.
3.  **Build and run the containers:**

    ```bash
    docker compose up --build -d
    ```

    - `--build`: Forces Docker Compose to build the images (useful after changes to Dockerfiles or application code).
    - `-d`: Runs the containers in detached mode (in the background).

4.  **Access the application:**

    - Frontend: Open your browser and navigate to the URL configured in `NEXT_PUBLIC_APP_URL` (e.g., `http://localhost:3010/kvphil`). The frontend service (`app`) maps port 3000 inside the container to port 3010 on your host machine.
    - Backend: The backend API runs on port 8080 within the Docker network and is accessible to the frontend via `http://vpn-host:8080`. The `vpn` service also exposes port 8080 to the host.

5.  **View logs:**

    ```bash
    docker compose logs -f           # Follow logs for all services
    docker compose logs -f <service_name> # Follow logs for a specific service (e.g., app, backend, vpn)
    ```

6.  **Stopping the application:**
    ```bash
    docker compose down              # Stops and removes containers, networks
    # docker compose down -v         # Stops and removes containers, networks, AND volumes (use with caution)
    ```
