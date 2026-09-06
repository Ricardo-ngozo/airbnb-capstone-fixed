# Airbnb Capstone Project

Full-stack Airbnb clone starter for the Zaio capstone brief. It includes a React public frontend, an admin dashboard, and a Node.js/Express/MongoDB backend with JWT authentication.

## Project Structure

```text
airbnb-capstone/
  backend/
    controllers/
    middleware/
    models/
    routes/
    seed/
    tests/
    app.js
    server.js
  frontend/
    src/
      api/
      auth.jsx
      components/
      data/
      pages/
      styles/
      tests/
  docs/
    Testing_and_Validation_Report.docx
```

## Frontend Preview

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL, usually `http://localhost:5173`.

The frontend has sample fallback listings, so the public pages can be previewed before MongoDB is running.

If Vite says port 5173 is already in use, open the next URL it prints, usually `http://localhost:5174`.

## Backend Setup

Start MongoDB locally first, then:

```powershell
cd backend
copy .env.example .env
npm install
npm run seed
npm run dev
```

If MongoDB is not running, the backend automatically falls back to in-memory demo data so you can keep working on the UI. In that mode, created listings and reservations reset when the backend restarts.

If port 5000 is already in use, run the backend on another port:

```powershell
$env:PORT="5001"
npm start
```

Then point the frontend at that port:

```powershell
$env:VITE_API_URL="http://localhost:5001/api"
npm run dev
```

Default seed logins:

```text
jane@example.com / password321
john@example.com / password123
```

Demo logins for the 3 user roles (run `npm run seed:accounts` to create these):

```text
guest@demo.com / Guest123!   (role: user)
host@demo.com  / Host123!    (role: host)
admin@demo.com / Admin123!   (role: admin)
```

## Testing & Validation

Automated tests cover authentication (guest/host/admin), JWT protection, booking validation, and the login UI's role-based redirects.

- Backend: `cd backend && npm test` (Jest + Supertest, 16 tests)
- Frontend: `cd frontend && npm test` (Vitest + React Testing Library, 6 tests)

Full write-up, test tables, and manual QA notes: [Testing & Validation Report](docs/Testing_and_Validation_Report.docx)

## API Routes

- `POST /api/users/login`
- `GET /api/users/profile`
- `GET /api/accommodations`
- `GET /api/accommodations/:id`
- `POST /api/accommodations`
- `PUT /api/accommodations/:id`
- `DELETE /api/accommodations/:id`
- `POST /api/reservations`
- `GET /api/reservations/host`
- `GET /api/reservations/user`
- `DELETE /api/reservations/:id`

## Rubric Coverage Checklist

- Admin header with logo, navigation, logged-in greeting, profile dropdown, reservations link, logout
- Login page with validation, API errors, JWT session storage, redirect to admin dashboard
- Create listing form with required listing fields, fee fields, amenities, image URLs, and file upload input
- View listings admin page with title, location, price, image, update, and delete controls
- Update listing page with pre-filled form data
- Public home page with hero banner, inspiration cards, experiences, Shop Airbnb, future-getaway tabs, footer
- Location page with filter, heading, listing cards, ratings, reviews, amenities, and price
- Listing details page with heading, subheading, image gallery, static info sections, and dynamic calculator
- Reservation button that posts to MongoDB when backend/auth are running
- Backend Mongoose models for users, accommodations, and reservations
- JWT auth middleware with protected CRUD and reservation routes
- Express controllers with validation-oriented status codes and error feedback

## Submission Notes

For the final submission, deploy the backend and frontend, then record a short demo video showing:

1. Public home, location, and details pages.
2. Cost calculator changing with dates and guests.
3. Login.
4. Admin create, update, and delete listing.
5. Reservation creation and reservation table.

Submit the deployed URL, GitHub repository link, and video link.