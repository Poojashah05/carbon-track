# CO₂Track — India's Smart Carbon Footprint Awareness Platform

> **Hackathon submission for Hack2Skill PromptWars by Google for Developers**
> Challenge vertical: **Carbon Footprint Awareness**

CO₂Track is an India-focused carbon footprint tracker designed to help individuals measure, analyze, and reduce their greenhouse gas emissions. The platform features Supabase authentication (Google & GitHub OAuth), a secure real-time relational database, Indian cultural adaptation (no beef/pork, local staples, and local transit), and AI-driven insights with monthly rate limiting.

---

## 1. Challenge Vertical

This project was built for the **Carbon Footprint Awareness** vertical. The goal is to help individuals understand, measure, and actively reduce their carbon emissions through localized data-driven calculations and AI-powered recommendations.

---

## 2. Approach & Logic

### Indian Culture & Localized Methodology
To better fit the Indian context, the application logic was refactored:
- **Zero Beef/Pork:** Removed beef and pork entirely from calculation factors, forms, and recommendations.
- **Indian Diet Options:** Included mutton, chicken, fish, paneer/dairy, eggs, dal/pulses, rice + sabzi, veg thali, and fully plant-based food items.
- **Indian Transit Modes:** Integrated local transport options such as Metro, Auto Rickshaws, and 2-Wheelers (Petrol and Electric).
- **Indian Energy Sources:** Updated emissions calculation using the CEA India Grid baseline intensity, LPG (cooking gas), natural gas (PNG), kerosene, and rooftop solar.

All calculations use **IPCC AR6 and EPA emission factors**:

| Category | Source / Factor | Unit |
|---|---|---|
| Transport | IPCC AR6 WG3 / CEA India | kg CO₂ per km |
| Food | FAO / Poore & Nemecek (2018) | kg CO₂ per 150g serving |
| Energy | CEA India Grid Intensity 2022 (0.82 kg/kWh) | kg CO₂ per kWh |
| Shopping | Carbon Trust Product Footprinting | kg CO₂ per item |

### AI Personalization & Rate Limiting
CO₂Track uses **Groq's llama-3.1-8b-instant** model to deliver custom action plans:
1. Injects the user's actual emission breakdown (transport, food, energy, shopping).
2. Compares their total monthly footprint to India's national average (230 kg) and the global average (391.67 kg).
3. Forces the model to address their **highest-impact category first**.
4. Constrains output to 3 actionable, numbered recommendations under 60 words.
5. **Rate Limiting:** Restricts users to **2 AI insight generations per calendar month** to control API costs. Usage is securely tracked in the database.

---

## 3. Database Architecture

The application uses **Supabase** (PostgreSQL) for state management. The schema contains the following tables:

1. **`profiles`**: Extends Supabase Auth users. Stores onboarding responses (diet, typical transport, electricity usage) and user details.
2. **`emission_logs`**: Logs daily user activity across transport, food, energy, and shopping.
3. **`challenge_state`**: Tracks accepted and completed weekly eco-challenges for gamification.
4. **`ai_usage`**: Tracks monthly AI insights request count per user for rate limiting.

All tables are secured using PostgreSQL **Row Level Security (RLS)**, ensuring users can only read/write their own records.

---

## 4. Setup & Installation Guide

### Prerequisites
- Node.js (v18+)
- A [Supabase](https://supabase.com) account
- A [Groq Console](https://console.groq.com) account

### Step 1: Clone the Repository & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/your-username/ecotrack.git
cd ecotrack/ecotrack

# Install dependencies
npm install
```

### Step 2: Set Up the Supabase Database
1. Go to your **Supabase Dashboard** and create a **New Project**.
2. Go to **SQL Editor** -> **New Query**.
3. Copy the contents of `supabase/schema.sql` paste them into the SQL Editor.
4. Click **Run** to create the tables, indexes, triggers, and Row-Level Security (RLS) policies.

*Note: The script includes a trigger `on_auth_user_created` that automatically inserts a corresponding profile row whenever a new user signs up via OAuth.*

### Step 3: Set Up Authentication (OAuth Providers)
CO₂Track utilizes GitHub OAuth for authentication.
1. In the Supabase Dashboard, navigate to **Authentication** -> **Providers**.
2. **Configure GitHub:**
   - Enable the GitHub provider.
   - Register a new OAuth application on [GitHub Developer Settings](https://github.com/settings/developers).
   - Copy the Client ID and Client Secret into the Supabase GitHub configuration.
   - Set the Homepage URL to `http://localhost:5173` and the Authorization callback URL to the Redirect URI provided by Supabase.
3. In Supabase **Authentication** -> **URL Configuration**, set the site URL to `http://localhost:5173/` (for local development).

### Step 4: Configure Environment Variables
1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in the values:
   - `VITE_SUPABASE_URL`: Your Supabase Project URL (found in Settings -> API).
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase project public anon key (found in Settings -> API).
   - `VITE_GROQ_API_KEY`: Your Groq API key (found in console.groq.com).

### Step 5: Start the Development Server
```bash
npm run dev
```
Open **http://localhost:5173** to view the app!

---

## 5. How It Works (User Flow)

```
1. Login Page
   → Sign in securely with Google or GitHub OAuth.
   → Profile name is fetched automatically from OAuth metadata.

2. Onboarding (3 steps)
   → Step 1 (Personal Info): Confirm name (prefilled) and location (default: India).
   → Step 2 (Transport & Diet): Select typical transport modes and diet type.
   → Step 3 (Home Energy): Enter average monthly electricity bill (kWh) and household size.

3. Dashboard
   → Animated carbon emissions count-up.
   → Comparison chart showing your emissions against India's and the Global average.
   → Interactive donut chart showing category breakdowns.
   → Logged activity history list.

4. Log Activity
   → Input transport distance, food servings, energy usage, or shopping items.
   → View instant, live carbon footprint previews before logging.

5. AI Insights
   → Generate 3 personalized action points tailored to your highest emission category.
   → Chat window for follow-up questions.
   → Displays remaining monthly requests (2 left).

6. Weekly Challenges
   → Earn badges and points by accepting and completing green challenges.
```

---

## 6. Tech Stack

| Technology | Version | Why |
|---|---|---|
| **React** | 19 | Component-driven UI development and modern hook state management. |
| **Vite** | 8 | Lightning-fast development environment and HMR. |
| **Supabase** | 2 | Secure authentication, PostgreSQL relational database, and real-time operations. |
| **Tailwind CSS** | 3 | Utility-first styling with customized color palette design tokens. |
| **Recharts** | 3 | Responsive, interactive charts for dashboard metrics. |
| **Groq API** | Llama 3.1 8B | Fast, lightweight AI inference for personalized insights (optimized for free-tier rate limits). |
| **Jest** | 30 | Standard unit testing runner. |

---

## 7. Development, Quality & Testing

### Code Quality Rules
The project enforces strict code quality and linting standards using ESLint:
- **Zero Errors or Warnings:** The codebase compiles with no warnings/errors under ESLint rules.
- **Strict Lint Config:** Rules ensure no unused variables, no undefined variables, and compliant React Hooks dependency arrays.
- **Centralized Utils:** Standardized logger (`logger.js`), local storage access (`storage.js`), and user input sanitization (`sanitize.js`).
- **JSDoc & PropTypes:** All utilities, hooks, and React components are comprehensively decorated with JSDoc annotations and enforced via `PropTypes`.

### Run Commands & Tests
```bash
# Run ESLint validation
npx eslint src/

# Run unit tests
npm test

# Run unit tests with coverage metrics (>80% target for utils and hooks)
npm run test:coverage

# Compile production build
npm run build

# Start preview server for production build
npm run preview
```

---

## License

MIT — see [LICENSE](LICENSE)
