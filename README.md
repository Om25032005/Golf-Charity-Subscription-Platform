# Golf Charity Subscription Platform

A full-stack MERN (MongoDB, Express, React, Node.js) web application designed for a charitable subscription service. Users can subscribe via Stripe, submit lottery-style numbers, and participate in monthly draws where a portion of the prize pool is donated to a selected charity.
Link : https://golf-charity-subscription-platform-beryl.vercel.app/login

## 🌟 Key Features

### For Users
* **Authentication:** Secure JWT-based signup, login, and protected routing.
* **Charity Selection:** Users select a registered charity to support upon account creation.
* **Subscriptions (Stripe):** Monthly and Yearly subscription plans handled through Stripe Checkout and portal management. Webhooks handle real-time status syncing.
* **Score Submission:** Active subscribers can submit and maintain up to 5 lucky numbers (1-45). Features include adding, editing, and deleting numbers with a First-In-First-Out limit mechanism.
* **Winnings Dashboard:** Users can view the results of past draws. If they win, they are prompted to upload a Proof of Identity/Tax document (via Multer) to claim their prize.

### For Admins
* **Admin Dashboard:** Exclusive access to platform supervision.
* **Run Draws:** Generate 5 random winning numbers. The system automatically calculates 3, 4, and 5-number matches, distributes 10% to the charities, and allocates the remaining prize pool.
* **Jackpot Rollovers:** If no user matches 5 numbers, the top prize automatically rolls over to the next month's draw.
* **Verify Winners:** Review uploaded proof documents and approve or reject payout claims.

---

## 🛠️ Tech Stack

* **Frontend:** React.js, Vite, Tailwind CSS, React Router DOM, Axios, Lucide React (Icons).
* **Backend:** Node.js, Express.js, Mongoose.
* **Database:** MongoDB Atlas.
* **File Uploads:** Multer (local `uploads/` directory).
* **Payments:** Stripe API & Webhooks.
* **Authentication:** JSON Web Tokens (JWT) & bcryptjs.

---

## 🚀 Installation & Setup

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed and a [MongoDB](https://www.mongodb.com/atlas/database) cluster ready. You also need a [Stripe Developer Account](https://dashboard.stripe.com/test/apikeys).

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd Assignment
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `/backend` directory:
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://<your_user>:<your_password>@cluster.mongodb.net/
JWT_SECRET=your_super_secret_jwt_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_MONTHLY_PRICE_ID=price_your_monthly_id
STRIPE_YEARLY_PRICE_ID=price_your_yearly_id
CLIENT_URL=http://localhost:3000
MAX_FILE_SIZE=5242880
```

**Seed the Database:**
Generate the default charities and the master Admin account (`admin@example.com` / `password123`):
```bash
node seed.js
node seed-admin.js
```

**Run the Backend:**
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
```

Start the Vite development server:
```bash
npm run dev
```
The frontend will be available at `http://localhost:3000`.

---

## 💳 Testing Stripe Webhooks Locally
Because Stripe cannot send webhooks to a `localhost` URL over the internet natively, you will need the Stripe CLI for full local testing.

1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli).
2. Log in and forward events to your backend:
```bash
stripe login
stripe listen --forward-to localhost:5000/api/subscriptions/webhook
```
3. Use the webhook secret printed in the terminal as your `STRIPE_WEBHOOK_SECRET` in the `.env` file.

Alternatively, the application features a built-in polling fallback which manually verifies the subscription state if the webhook fails to reach the local server.

---

## 📁 Folder Structure

```
c:\project\Assignment\
│
├── backend/                  # Express.js Server
│   ├── src/
│   │   ├── config/           # DB & Stripe configs
│   │   ├── controllers/      # API logic (Auth, Draws, Subscriptions, Scores)
│   │   ├── middleware/       # JWT Auth, Multer Unload, Error Handlers
│   │   ├── models/           # Mongoose Schemas (User, Draw, Charity, Winner)
│   │   └── routes/           # Express Routers
│   ├── uploads/              # Participant uploaded proof documents
│   ├── seed.js               # Charity seeding script
│   ├── seed-admin.js         # Admin generation script
│   └── server.js             # Main entry point
│
└── frontend/                 # React SPA (Vite)
    ├── src/
    │   ├── components/       # Reusable UI (Navbar, ScoreManager, ProtectedRoute)
    │   ├── context/          # Global AuthContext API
    │   ├── pages/            # View Layouts (Login, Dashboard, Admin)
    │   ├── services/         # Axios API interceptors and endpoint definitions
    │   ├── App.jsx           # Main Application Router
    │   └── index.css         # Tailwind directives
    └── vite.config.js
```
