# Habit Tracker 💪

A small full-stack habit-tracking app with a React + Vite frontend and an Express + MongoDB backend. Track daily and weekly habits, mark completions, and view streaks. The backend also creates daily logs automatically using a cron job.

---

## Features ✅

- Add, edit and delete habits
- Daily and weekly views
- Mark habits as complete / incomplete
- Track current and longest streaks
- Automatic daily log creation via cron
- Simple REST API for integrations

---

## Tech Stack 🔧

- Frontend: React (Vite)
- Backend: Node.js, Express
- Database: MongoDB (via Mongoose)
- Scheduling: node-cron
- HTTP client: axios

---

## Quick Start 🚀

### Prerequisites

- Node.js (16+ recommended)
- npm
- MongoDB (Atlas or local)

### Backend

1. Open a terminal and go to the backend folder:

   ```bash
   cd backend
   ```

2. Install dependencies and create a `.env` file with the following variables:

   ```env
   MONGODB_URI=<your_mongo_connection_string>
   PORT=5000 # optional
   ```

3. Start the server:

   ```bash
   npm install
   npm start
   ```

The server runs on port `5000` by default and exposes the REST API under `/api`.

### Frontend

1. In another terminal, go to the frontend folder:

   ```bash
   cd frontend
   ```

2. Install dependencies and run the dev server:

   ```bash
   npm install
   npm run dev
   ```

Vite will show the local dev URL (typically `http://localhost:5173`). The frontend is configured to call `http://localhost:5000/api` by default—update `API_URL` in `src/App.jsx` if needed.

---

## API Endpoints 📡

- GET `/api/habits` — list all habits
- POST `/api/habits` — create a new habit
- PUT `/api/habits/:id` — update a habit
- DELETE `/api/habits/:id` — delete a habit
- GET `/api/logs?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` — get logs in range
- GET `/api/logs/today` — get logs for today
- POST `/api/logs` — mark a habit as complete/incomplete (body: `{ habitId, date, completed }`)
- GET `/api/habits/:id/stats` — get habit statistics

---

## Database & Cron 🗄️

- The app uses MongoDB (Mongoose schemas are defined in `backend/server.js`).
- A daily cron job runs at midnight (`0 0 * * *`) to ensure a log exists for each habit for the current day.

---

## Scripts

- Backend: `npm start`
- Frontend: `npm run dev`, `npm run build`, `npm run preview`
- Frontend lint: `npm run lint`

---

## Contributing 🤝

- Feel free to open issues or PRs.
- For local development, run both backend and frontend concurrently in separate terminals.

---

## Notes & Tips 💡

- Add `.env` to `backend` (it is already ignored by `.gitignore`).
- Consider adding `nodemon` for backend development convenience.

---

If you'd like, I can also add a short contributing guide, example `.env.example`, or a Docker setup—tell me which you'd prefer next.