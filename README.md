# White Penguin

A comprehensive platform with a Next.js frontend and Node.js/Express backend.

## Prerequisites

Before you begin, ensure you have the following installed:
* **Node.js**: v20 or newer (or **Bun** if preferred)
* **PostgreSQL**: A local instance running for the database

## Environment Variables

You will need to set up `.env` files for both the frontend and backend.

### Backend Environment Variables
Create a `.env` file in the `backend` directory (or use `.env.example` if available).

```env
# backend/.env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=white_penguin_db
JWT_SECRET=super_secret_jwt_key
# Other necessary env vars...
```

### Frontend Environment Variables
Create a `.env.local` or `.env` file in the `frontend` directory.

```env
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_URL_ENCRYPTION_KEY=white-penguin-secret-key-2024
NEXT_PUBLIC_APP_DOMAIN=localhost
```

## Database Setup

1. Make sure your local PostgreSQL server is running.
2. Create the database matching your `DB_NAME` (e.g., `white_penguin_db`).
3. Follow the backend instructions to run migrations and seed the database if required.

## Run Instructions

### 1. Backend Setup

Open a terminal and navigate to the backend directory:

```bash
cd backend
npm install
# Run migrations/seed if applicable
npm run dev
```

The backend server should now be running on the specified port (e.g., http://localhost:5000).

### 2. Frontend Setup

Open another terminal and navigate to the frontend directory:

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

The Next.js frontend will start and typically be available at http://localhost:3000.
