# Next Steps to Get Running

## What's Done
- All code is written (lead form, savings calculator, social proof, RentCast integration, TCPA consent)
- Database migrations applied to Supabase (both 001 and 002)
- `.env.local` created with RentCast API key and Supabase credentials

## What's Left

### 1. Install Node.js
You need Node.js to run this app. On a machine where you can install software:
- Go to https://nodejs.org
- Download the **LTS** version (22.x)
- Install with default settings
- Restart your terminal/VS Code after installing

### 2. Install Dependencies
Open a terminal in this project folder and run:
```
npm install
```

### 3. Verify .env.local
Open `.env.local` and make sure these 3 values are filled in (not the placeholder text):
- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase > Settings > API > anon public
- `SUPABASE_SERVICE_ROLE_KEY` — from Supabase > Settings > API > service_role (click Reveal)

The other values should already be set:
- `RENTCAST_API_KEY` — your RentCast API key (from your RentCast dashboard)
- `ADMIN_ACCESS_TOKEN=change-me` (change this to a real password)
- `INTERNAL_ENRICH_TOKEN=change-me-too` (change this to a random string)

### 4. Start the Dev Server
```
npm run dev
```
Then open http://localhost:3000 in your browser.

### 5. Test It
1. You should see the landing page with a savings calculator slider, solar benefits content, testimonials, and a lead form
2. Fill out the form with a real Hawaii address (e.g., 91-1234 Keaunui Dr, Ewa Beach, HI 96706)
3. Check both consent boxes and submit
4. You should be redirected to the thank-you page
5. Go to http://localhost:3000/admin/login and enter your ADMIN_ACCESS_TOKEN to see the lead in the dashboard

### 6. Deploy to Vercel (Optional — for a live URL)
If you can't install Node.js locally, deploy via Vercel instead:
1. Push this repo to GitHub
2. Go to https://vercel.com and sign up with GitHub
3. Click "Import Project" and select this repo
4. Add all the environment variables from `.env.local` in Vercel's project settings
5. Deploy — you'll get a live URL

## Key Files Reference
- `src/lib/partners.ts` — edit partner names here (bump consent version in consent.ts when you change them)
- `src/components/SocialProof.tsx` — replace placeholder testimonials with real ones
- `src/components/SavingsCalculator.tsx` — adjust Hawaii electricity rate constants if needed
- `.env.local` — all secrets and API keys (never commit this file)
