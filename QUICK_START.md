# 🚀 Quick Start Checklist

Use this checklist to track your progress. Check off each item as you complete it.

## Phase 1: Environment Setup
- [ ] Verify Node.js 18+ installed (`node --version`)
- [ ] Verify Python 3.11+ installed (`python3 --version`)
- [ ] Install Redis (`brew install redis` on macOS)
- [ ] Start Redis (`brew services start redis`)

## Phase 2: Supabase Setup
- [ ] Create Supabase account
- [ ] Create new project "echo-platform"
- [ ] Copy Project URL, anon key, and service_role key
- [ ] Run database schema SQL in SQL Editor
- [ ] Verify tables created (run verification query)

## Phase 3: Environment Variables
- [ ] Create `api/.env` file
- [ ] Add Supabase credentials to `api/.env`
- [ ] Create `frontend/.env.local` file
- [ ] Add Supabase URL and anon key to `frontend/.env.local`
- [ ] Update `api/src/utils/connectors/supabase.py` to use env vars

## Phase 4: Test Setup
- [ ] Install backend dependencies (`pip install -r requirements.txt`)
- [ ] Test database connection
- [ ] Start Flask server (`python run.py`)
- [ ] Test `/token` endpoint with curl
- [ ] Install frontend dependencies (`npm install`)
- [ ] Start Next.js server (`npm run dev`)
- [ ] Verify frontend loads at localhost:3000

## Phase 5: Build Studies API
- [ ] Add Study model to `supabase.py`
- [ ] Create `api/src/components/studies.py`
- [ ] Create `api/src/app/studies.py`
- [ ] Register studies blueprint in `run.py`
- [ ] Test create study endpoint
- [ ] Test read studies endpoint

## Phase 6: Connect Frontend
- [ ] Add study API functions to `frontend/src/utils/api.ts`
- [ ] Update dashboard to fetch real data
- [ ] Test creating study from frontend
- [ ] Verify studies appear in dashboard

---

## 🎯 Current Status

**You are here:** Phase 1 - Environment Setup

**Next step:** Follow LEARNING_GUIDE.md Phase 1, Step 1.1

---

## 📝 Notes

Write down any issues you encounter here:

```
Date: ___________
Issue: 
Solution: 

Date: ___________
Issue: 
Solution: 
```

