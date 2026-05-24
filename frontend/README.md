# Phishing Awareness Simulator Frontend

This frontend is a React + Vite + TypeScript application that integrates with the backend API for anonymous learner creation, phishing scenario browsing, scenario inspection, quiz submission, progress dashboards, and defensive resources.

## Run locally

1. Install dependencies:
   npm install
2. Start the development server:
   npm run dev
3. Optional API base URL override:
   VITE_API_BASE_URL=http://localhost:4000

If `VITE_API_BASE_URL` is not set, the app defaults to `http://localhost:4000`.

## Notes

- The frontend does not include mock data.
- All application data is requested from the backend API.
- Learner session state stores only anonymous learner metadata in localStorage.
- Passwords, tokens, session IDs, and secrets are not stored in frontend state or localStorage.
