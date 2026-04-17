# AETHERIS | Next-Generation Focus Protocol

![Aetheris Logo](/public/logo.png)

**Aetheris** is a high-fidelity, collaborative Pomodoro environment designed for deep focus and optimized productivity. It merges advanced real-time synchronization with AI-driven task management to create the ultimate study hub.

---

## ✨ Key Features

### 🧠 AI Focus Coach
- **Goal Slicing:** Convert massive, daunting projects into actionable, 25-minute milestones using AI.
- **Dynamic Context:** The AI understands your focus state and helps you break through procrastination.

### 🌐 Collaborative Study Rooms
- **Real-Time Sync:** Timers are perfectly synchronized across all participants using Firebase Realtime Database.
- **Moderated Chat:** Stay connected without distractions. Includes a robust moderation suite (Kicking, Banning, and Reporting).
- **Presence Indicators:** See who is focused and who is on break in real-time.

### 🎨 Atmospheric Immersion
- **Custom Scenes:** Switch between minimalist high-altitude views, cozy libraries, and more.
- **Audio Mixer:** Layer custom soundscapes (Rain, Café, White Noise) with a tailored volume mixer.

---

## 🛠️ Technical Stack

- **Framework:** Next.js 16 (React 19)
- **Styling:** Tailwind CSS 4 + Glassmorphism
- **Animations:** Framer Motion
- **Backend/Database:** 
  - **Firebase Auth:** Secure user management.
  - **Firestore:** Persistent storage for tasks, stats, and settings.
  - **Realtime Database (RTDB):** Low-latency room & chat synchronization.
- **AI Engine:** Groq (Llama 3 / Mixtral) for instant focus coaching.

---

## 🚀 Deployment Guide (Vercel)

Aetheris is optimized for zero-config deployment on Vercel.

### 1. Environment Setup
Create a new project on Vercel and add the following variables from your `.env.local` (see `.env.example` for the list):
- `NEXT_PUBLIC_FIREBASE_*` (All 6 Web SDK keys)
- `GROQ_API_KEY`
- `FIREBASE_SERVICE_ACCOUNT_KEY` (Minified JSON string)

### 2. Firebase Security Rules
Ensure your Firestore and RTDB rules are set to `v2`. 
- **Firestore:** Restricted to Auth users for profiles; public-write for `reports`.
- **RTDB:** Room nodes require valid Room IDs; cleanup logic allows the last user to delete empty rooms.

### 3. Build & Deploy
```bash
npm run build
```
Vercel will automatically detect the Next.js framework and handle the rest.

---

## 📜 Legal & Compliance

Aetheris includes a built-in **Legal Notice & Terms of Service** located in the documentation (📖 icon).
- **Indemnification:** Protections for the developer against third-party claims.
- **Data Privacy:** GDPR/CCPA-aligned disclosures regarding Firebase and AI sub-processing.

---

## 🧑‍💻 Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

---

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.


