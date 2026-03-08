# Strange Grocery App

A self-hosted, collaborative grocery list app with Claude AI integration. Manage your grocery list in real time across multiple devices, get recipe suggestions from Claude, and parse handwritten lists via photo upload.

![Synthwave UI with neon pink and cyan palette](.github/screenshot.jpeg)

## Features

- **Real-time shared lists** — multiple users see updates instantly via Socket.io
- **Auto-categorization** — items are sorted by department (Produce, Dairy, Meat, etc.) using a rule-based system with a learned cache and Claude Haiku as fallback
- **Claude chat** — ask for recipe ideas, meal plans, or add items by chat; Claude has context of your current list and last 10 trip histories
- **Photo-to-list** — snap a photo of a handwritten list; Claude vision parses and adds items automatically
- **Shopping mode** — check off items while in-store
- **Trip history** — completed lists are saved; browse history and copy past trips to a new list
- **Print view** — organized by department, optimized for printing
- **Autocomplete** — item name suggestions drawn from your history
- **Synthwave UI** — mobile-first responsive design with Orbitron font and neon glow effects

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | Vue 3 + Vite |
| Backend | Node.js + Express |
| Real-time | Socket.io |
| Database | MariaDB |
| AI | Anthropic Claude API (Haiku + Sonnet) |

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- An [Anthropic API key](https://console.anthropic.com/)

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/dirkstrange/Strange-Grocery-App.git
cd Strange-Grocery-App
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
PORT=3000

DB_HOST=db
DB_PORT=3306
DB_NAME=grocery_app
DB_USER=grocery_user
DB_PASSWORD=your_secure_password_here
DB_ROOT_PASSWORD=your_secure_root_password_here

ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

- `DB_PASSWORD` — the password for the app's database user
- `DB_ROOT_PASSWORD` — the MariaDB root password, required by the Docker image to initialize the database. The app itself never uses this value; choose any strong password.
- `ANTHROPIC_API_KEY` — get yours at [console.anthropic.com](https://console.anthropic.com/). Claude Haiku is used for auto-categorization; Claude Sonnet for chat and photo parsing.

### 3. Start the app

```bash
docker compose up --build
```

The app will be available at `http://localhost:3000`.

On first run, Docker will:
- Pull the MariaDB image and initialize the database schema automatically
- Build the Vue frontend
- Start the Node.js backend

> **Note:** First startup takes 30–60 seconds. MariaDB needs time to initialize before the app can connect. This is normal — wait for the log line `Grocery App server running on port 3000` before opening the browser.

To run in the background (detached mode):

```bash
docker compose up --build -d
```

Subsequent starts (no code changes):

```bash
docker compose up -d
```

## Logs

To view live logs:

```bash
docker compose logs -f
```

To view logs for a specific service:

```bash
docker compose logs -f app
docker compose logs -f db
```

## Stopping the app

```bash
docker compose down
```

Database data is persisted in a Docker volume and survives restarts. To wipe all data:

```bash
docker compose down -v
```

## Updating

```bash
git pull
docker compose up --build
```

## Configuration notes

- **Port** — defaults to `3000`. Change `PORT` in `.env` and update the port mapping in `docker-compose.yml` if needed.
- **External access** — the app works behind a reverse proxy (nginx, Caddy, Traefik). Set your proxy to forward to port 3000.
- **Multiple users** — no account system is required. Users enter a display name on first visit, stored in localStorage.

## License

MIT
