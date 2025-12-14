# Echo Platform - Learning & Implementation Guide

## 🎓 Your Learning Journey

This guide will walk you through building the Echo platform step-by-step, explaining concepts as we go.

---

## 📚 Phase 1: Understanding the Foundation (Day 1)

### Step 1.1: Verify Your Development Environment

**Why?** Before building, ensure your tools are ready.

**What to do:**

```bash
# Check Node.js version (should be 18+)
node --version

# Check Python version (should be 3.11+)
python3 --version

# Check if you have Git
git --version

# Check if Redis is installed (needed for background tasks)
redis-cli --version
```

**If something is missing:**

- **Node.js**: Download from [nodejs.org](https://nodejs.org/)
- **Python**: Download from [python.org](https://www.python.org/downloads/)
- **Redis** (macOS): `brew install redis` then `brew services start redis`
- **Redis** (Linux): `sudo apt-get install redis-server` then `sudo systemctl start redis`

**Learning Point:** These are the core tools:
- **Node.js**: Runs JavaScript on the server (for Next.js)
- **Python**: Runs your Flask backend
- **Redis**: Stores background job queue (for AI processing later)
- **Git**: Version control for your code

---

### Step 1.2: Understand the Project Structure

**Why?** Knowing where things go helps you navigate the codebase.

**Current Structure:**
```
echo/
├── api/                    # Backend (Flask/Python)
│   ├── src/
│   │   ├── app/           # API routes (endpoints)
│   │   ├── components/    # Business logic
│   │   └── utils/         # Helpers (database, logging, etc.)
│   └── run.py             # Entry point
│
└── frontend/              # Frontend (Next.js/React)
    └── src/
        ├── app/           # Pages (routes)
        ├── components/    # Reusable UI components
        └── utils/         # Frontend helpers
```

**Learning Point:**
- **Backend (API)**: Handles data, business logic, AI processing
- **Frontend**: User interface that talks to the backend
- **Separation of Concerns**: Backend and frontend are separate so they can scale independently

---

## 🗄️ Phase 2: Database Setup (Day 2-3)

### Step 2.1: Create Supabase Account & Project

**Why?** Supabase is your database (PostgreSQL) and provides authentication.

**What to do:**

1. Go to [supabase.com](https://supabase.com) and sign up
2. Click "New Project"
3. Fill in:
   - **Name**: `echo-platform`
   - **Database Password**: Create a strong password (SAVE THIS!)
   - **Region**: Choose closest to you
4. Wait 2-3 minutes for setup

**Learning Point:** Supabase gives you:
- PostgreSQL database (stores all your data)
- Authentication (user login/signup)
- Storage (for videos, images)
- Real-time subscriptions (for live updates)

---

### Step 2.2: Get Your Supabase Credentials

**Why?** Your app needs these to connect to the database.

**What to do:**

1. In Supabase Dashboard, go to **Settings** → **API**
2. Copy these values (we'll use them soon):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbG...` (starts with eyJ)
   - **service_role key**: `eyJhbG...` (KEEP THIS SECRET!)

**Learning Point:**
- **anon key**: Safe for frontend (limited permissions)
- **service_role key**: Backend only (full access - never expose!)

---

### Step 2.3: Create Database Tables

**Why?** Your app needs tables to store studies, users, tasks, etc.

**What to do:**

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. We'll create the schema step by step (see next section)

**Learning Point:** Tables are like spreadsheets:
- Each table stores one type of data (users, studies, etc.)
- Rows = individual records
- Columns = fields (name, email, etc.)

---

### Step 2.4: Create Core Tables (Start Simple)

**Why?** Start with essential tables, add more later.

**Copy and run this in SQL Editor:**

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations table (companies using the platform)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Users table (people who use the platform)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    organization_id UUID REFERENCES organizations(id),
    role TEXT DEFAULT 'member', -- 'admin', 'member', 'viewer'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Studies table (research studies)
CREATE TABLE studies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    created_by UUID REFERENCES users(id) NOT NULL,
    name TEXT NOT NULL,
    objective TEXT,
    study_type TEXT,
    status TEXT DEFAULT 'draft', -- 'draft', 'active', 'completed', 'archived'
    target_participants INTEGER DEFAULT 50,
    duration_days INTEGER DEFAULT 7,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    segment_criteria JSONB, -- Flexible JSON for filters
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tasks table (tasks within a study)
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    study_id UUID REFERENCES studies(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- 'camera', 'discussion', 'gallery', 'collage', 'classification', 'fill_blanks'
    title TEXT NOT NULL,
    instructions TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Participants table (people participating in studies)
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    study_id UUID REFERENCES studies(id) ON DELETE CASCADE NOT NULL,
    contact TEXT NOT NULL, -- email or phone
    demographics JSONB, -- age, gender, location, etc.
    status TEXT DEFAULT 'invited', -- 'invited', 'started', 'completed', 'dropped'
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Responses table (participant responses to tasks)
CREATE TABLE responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE NOT NULL,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
    response_data JSONB NOT NULL, -- Flexible: {text, videoUrl, images, etc.}
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_studies_organization ON studies(organization_id);
CREATE INDEX idx_tasks_study ON tasks(study_id);
CREATE INDEX idx_participants_study ON participants(study_id);
CREATE INDEX idx_responses_participant ON responses(participant_id);
CREATE INDEX idx_responses_task ON responses(task_id);
```

**Click "Run"** to execute.

**Verify it worked:**
```sql
-- Check tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see: organizations, participants, responses, studies, tasks, users

**Learning Point:**
- **PRIMARY KEY**: Unique identifier for each row
- **REFERENCES**: Links tables together (foreign keys)
- **ON DELETE CASCADE**: If study deleted, delete its tasks too
- **JSONB**: Flexible JSON storage (for variable data)
- **INDEXES**: Speed up queries on common fields

---

## 🔐 Phase 3: Secure Your Credentials (Day 3)

### Step 3.1: Create Backend Environment File

**Why?** Never hardcode secrets! Environment variables keep them safe.

**What to do:**

1. In `/api/` directory, create `.env` file:

```bash
cd api
touch .env
```

2. Open `.env` and add:

```env
# Flask Configuration
FLASK_ENV=development
SECRET_KEY=your-super-secret-key-change-this-in-production
PORT=5000
DEV_MODE=true

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-service-role-key-here
SUPABASE_USER=your-supabase-user
SUPABASE_PASSWORD=your-supabase-password

# AI APIs (get these later)
OPENAI_API_KEY=your-openai-key-here
ANTHROPIC_API_KEY=your-anthropic-key-here

# Redis (for background tasks)
REDIS_URL=redis://localhost:6379/0
```

3. Replace the placeholder values with your actual Supabase credentials

**Learning Point:**
- `.env` files are gitignored (never commit secrets!)
- Each environment (dev/prod) has its own `.env`
- Python's `python-dotenv` loads these automatically

---

### Step 3.2: Update Supabase Connector to Use Environment Variables

**Why?** Remove hardcoded credentials from code.

**What to do:**

1. Open `api/src/utils/connectors/supabase.py`
2. Replace the hardcoded credentials with environment variables:

```python
from sqlalchemy import Boolean, ForeignKey, Text, create_engine, Column, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
import uuid
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from src.utils.managers.database_manager import DatabaseManager
from src.utils.logger import logger
import os
from dotenv import load_dotenv

load_dotenv()  # Load environment variables

class Supabase:
    _instance = None
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Supabase, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if not self._initialized:
            logger.announcement('Initializing Database Service', 'info')

            # Get credentials from environment variables
            supabase_user = os.getenv('SUPABASE_USER')
            supabase_password = os.getenv('SUPABASE_PASSWORD')
            
            if not supabase_user or not supabase_password:
                raise ValueError("SUPABASE_USER and SUPABASE_PASSWORD must be set in .env file")
            
            # Construct database URL
            # Format: postgresql://user:password@host:port/database
            # For Supabase: postgresql://postgres.{user}:{password}@aws-1-us-east-2.pooler.supabase.com:6543/postgres
            self.db_url = f'postgresql://postgres.{supabase_user}:{supabase_password}@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
            self.engine = create_engine(self.db_url)
            
            self.Base = declarative_base()
            self._setup_models()
            
            self.db = DatabaseManager(base=self.Base, engine=self.engine)
            
            logger.announcement('Successfully initialized Database Service', 'success')
            self._initialized = True

    def _setup_models(self):
        # We'll add more models as we build
        class User(self.Base):
            __tablename__ = 'users'  # Match your database table name
            id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
            created_at = Column(Text, nullable=False, default=datetime.now().strftime('%Y%m%d%H%M%S'))
            updated_at = Column(Text, nullable=False, default=datetime.now().strftime('%Y%m%d%H%M%S'))
            email = Column(Text, nullable=False, unique=True)
            organization_id = Column(UUID(as_uuid=True), nullable=True)

        self.User = User

# Create a single instance that can be imported and used throughout the application
db = Supabase().db
```

**Learning Point:**
- `os.getenv()` reads environment variables
- `load_dotenv()` loads `.env` file
- Always validate that required env vars exist

---

### Step 3.3: Create Frontend Environment File

**Why?** Frontend also needs API URLs and public keys.

**What to do:**

1. In `/frontend/` directory, create `.env.local`:

```bash
cd frontend
touch .env.local
```

2. Add:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://localhost:3000 
```

**Learning Point:**
- `NEXT_PUBLIC_` prefix makes variables available in browser
- `.env.local` is for local development (gitignored)
- Never put secrets in frontend env vars!

---

## 🚀 Phase 4: Test Your Setup (Day 3)

### Step 4.1: Test Backend Connection

**Why?** Verify everything works before building features.

**What to do:**

1. Start Redis (if not running):
```bash
redis-server
# Or if installed via brew:
brew services start redis
```

2. Activate Python virtual environment:
```bash
cd api
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Test database connection:
```bash
python3 -c "from src.utils.connectors.supabase import db; print('Database connected!')"
```

If you see "Database connected!" - success! 🎉

If you see "Database connected!" - success! 🎉

**If you get connection errors:**

**Option 1: Get Connection String from Supabase Dashboard (Recommended)**

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **Settings** → **Database**
4. Scroll down to **Connection string** section
5. Select **URI** tab
6. Copy the connection string (it will look like: `postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres`)
7. Add it to your `.env` file as `SUPABASE_DB_URL`:
   ```env
   SUPABASE_DB_URL=postgresql://postgres.xxxxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
8. The code will automatically use this connection string if `SUPABASE_DB_URL` is set

**Option 2: Use Connection Pooler**

If you prefer to construct the connection string automatically, you can use the pooler:
1. In your `.env` file, add:
   ```env
   SUPABASE_USE_POOLER=true
   ```
2. This will use the connection pooler format automatically

**Common Error Messages:**
- **"could not translate host name"**: DNS resolution failed - check your internet connection
- **"Operation timed out"**: Connection blocked - use the connection string from Supabase Dashboard (Option 1)
- **"password authentication failed"**: Wrong password - verify `SUPABASE_PASSWORD` in `.env`
- **"SUPABASE_PASSWORD must be set"**: Add `SUPABASE_PASSWORD=your-password` to `.env` file

---

### Step 4.2: Test Backend API

**Why?** Ensure Flask server starts correctly.

**What to do:**

1. Start the Flask server:
```bash
cd api
python run.py
```

You should see:
```
Running safety checks...
Successfully started Echo API
```

2. In another terminal, test the health endpoint:
```bash
curl http://localhost:5000/
```

3. Test token endpoint:
```bash
curl -X POST http://localhost:5000/token \
  -H "Content-Type: application/json" \
  -d '{"token": "all"}'
```

You should get back a JSON with `access_token`.

**Learning Point:**
- Flask runs on port 5000 by default
- `/token` endpoint creates JWT tokens for authentication
- `curl` is a command-line tool to test APIs

---

### Step 4.3: Test Frontend

**Why?** Ensure Next.js runs correctly.

**What to do:**

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Open browser to `http://localhost:3000`

You should see the login page redirect.

**Learning Point:**
- Next.js runs on port 3000
- Hot reload: changes auto-refresh browser
- `npm install` downloads all dependencies from `package.json`

---

## 📝 Phase 5: Build Your First Feature - Studies API (Day 4-5)

### Step 5.1: Understand REST APIs

**Why?** APIs are how frontend talks to backend.

**REST Basics:**
- **GET** `/studies` - List all studies
- **GET** `/studies/123` - Get one study
- **POST** `/studies` - Create new study
- **PUT** `/studies/123` - Update study
- **DELETE** `/studies/123` - Delete study

**Learning Point:**
- REST = standard way to design APIs
- HTTP methods = actions (GET=read, POST=create, etc.)
- URLs = resources (studies, users, etc.)

---

### Step 5.2: Create Study Model

**Why?** SQLAlchemy needs models to interact with database.

**What to do:**

1. Update `api/src/utils/connectors/supabase.py` to add Study model:

```python
def _setup_models(self):
    class User(self.Base):
        __tablename__ = 'users'
        id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
        created_at = Column(Text, nullable=False)
        updated_at = Column(Text, nullable=False)
        email = Column(Text, nullable=False, unique=True)
        organization_id = Column(UUID(as_uuid=True), nullable=True)

    class Study(self.Base):
        __tablename__ = 'studies'
        id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
        organization_id = Column(UUID(as_uuid=True), nullable=False)
        created_by = Column(UUID(as_uuid=True), nullable=False)
        name = Column(Text, nullable=False)
        objective = Column(Text, nullable=True)
        study_type = Column(Text, nullable=True)
        status = Column(Text, nullable=False, default='draft')
        target_participants = Column(Integer, default=50)
        duration_days = Column(Integer, default=7)
        start_date = Column(Text, nullable=True)
        end_date = Column(Text, nullable=True)
        segment_criteria = Column(JSONB, nullable=True)
        created_at = Column(Text, nullable=False)
        updated_at = Column(Text, nullable=False)

    self.User = User
    self.Study = Study
```

**Learning Point:**
- Models = Python classes representing database tables
- Columns = fields in the table
- Types match database schema (UUID, Text, Integer, JSONB)

---

### Step 5.3: Create Study Component (Business Logic)

**Why?** Separate business logic from API routes.

**What to do:**

1. Create `api/src/components/studies.py`:

```python
from src.utils.exception import handle_exception
from src.utils.connectors.supabase import db
from src.utils.logger import logger
from datetime import datetime

logger.announcement('Initializing Studies Service', type='info')

@handle_exception
def create_study(study: dict = None):
    """Create a new study"""
    if not study:
        raise Exception("Study data is required")
    
    # Add timestamps
    current_time = datetime.now().strftime('%Y%m%d%H%M%S')
    study['created_at'] = current_time
    study['updated_at'] = current_time
    
    study_id = db.create(table='studies', data=study)
    return study_id

@handle_exception
def read_studies(query=None):
    """Read studies with optional filters"""
    if query is None:
        query = {}
    
    studies = db.read(table='studies', query=query)
    return studies

@handle_exception
def update_study(study_id: str, data: dict = None):
    """Update an existing study"""
    if not data:
        raise Exception("Update data is required")
    
    data['updated_at'] = datetime.now().strftime('%Y%m%d%H%M%S')
    
    updated_id = db.update(table='studies', query={'id': study_id}, data=data)
    return updated_id

@handle_exception
def delete_study(study_id: str):
    """Delete a study"""
    deleted_id = db.delete(table='studies', query={'id': study_id})
    return deleted_id
```

**Learning Point:**
- Components = business logic layer
- `@handle_exception` = automatic error handling
- `db.create/read/update/delete` = database operations 

---

### Step 5.4: Create Study API Routes

**Why?** Routes expose your business logic as HTTP endpoints.

**What to do:**

1. Create `api/src/app/studies.py`:

```python
from flask import Blueprint, request
from src.components.studies import create_study, read_studies, update_study, delete_study
from src.utils.response import format_response
from src.utils.logger import logger
import uuid

bp = Blueprint('studies', __name__)

@bp.route('/create', methods=['POST'])
@format_response
def create():
    """Create a new study"""
    payload = request.get_json(force=True)
    study_data = payload.get('study', {})
    
    # Generate ID if not provided
    if 'id' not in study_data:
        study_data['id'] = str(uuid.uuid4())
    
    study_id = create_study(study=study_data)
    return {'id': study_id, 'message': 'Study created successfully'}

@bp.route('/read', methods=['GET'])
@format_response
def read():
    """Read studies with optional filters"""
    query = {}
    
    # Get query parameters from URL
    study_id = request.args.get('id', None)
    organization_id = request.args.get('organization_id', None)
    status = request.args.get('status', None)
    
    if study_id:
        query['id'] = study_id
    if organization_id:
        query['organization_id'] = organization_id
    if status:
        query['status'] = status
    
    studies = read_studies(query=query)
    return studies

@bp.route('/update', methods=['POST'])
@format_response
def update():
    """Update an existing study"""
    payload = request.get_json(force=True)
    study_id = payload.get('id')
    update_data = payload.get('data', {})
    
    if not study_id:
        raise Exception("Study ID is required")
    
    updated_id = update_study(study_id=study_id, data=update_data)
    return {'id': updated_id, 'message': 'Study updated successfully'}

@bp.route('/delete', methods=['POST'])
@format_response
def delete():
    """Delete a study"""
    payload = request.get_json(force=True)
    study_id = payload.get('id')
    
    if not study_id:
        raise Exception("Study ID is required")
    
    deleted_id = delete_study(study_id=study_id)
    return {'id': deleted_id, 'message': 'Study deleted successfully'}
```

2. Register the blueprint in `api/run.py`:

```python
# Add this import at the top
from src.app import users, studies

# Add this after users blueprint registration
app.register_blueprint(studies.bp, url_prefix='/studies')
```

**Learning Point:**
- Blueprints = organize routes into modules
- `@format_response` = standardizes JSON responses
- Query params (`?id=123`) = filters for GET requests
- Request body = data for POST/PUT requests

---

### Step 5.5: Test Your Studies API

**Why?** Verify it works before building frontend.

**What to do:**

1. Restart Flask server:
```bash
cd api
python run.py
```

2. **First, get an authentication token** (required for all API calls):
```bash
curl -X POST http://localhost:5000/token \
  -H "Content-Type: application/json" \
  -d '{"token": "all"}'
```

You should get a response like:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600
}
```

**Copy the `access_token` value** - you'll need it for the next steps.

3. **Create an organization** (required for studies):
```bash
curl -X POST http://localhost:5000/organizations/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "organization": {
      "name": "Test Organization"
    }
  }'
```

Copy the `id` from the response - you'll need it for the next steps.

4. **Create a user** (required for studies):
```bash
curl -X POST http://localhost:5000/users/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "user": {
      "email": "test@example.com",
      "organization_id": "YOUR_ORGANIZATION_ID_HERE",
      "role": "admin"
    }
  }'
```

Copy the `id` from the response - you'll need it for creating studies.

5. **Test creating a study** (replace `YOUR_ACCESS_TOKEN`, `YOUR_ORGANIZATION_ID`, and `YOUR_USER_ID`):
```bash
curl -X POST http://localhost:5000/studies/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "study": {
      "organization_id": "YOUR_ORGANIZATION_ID_HERE",
      "created_by": "YOUR_USER_ID_HERE",
      "name": "My First Study",
      "objective": "Learn how to build APIs",
      "status": "draft"
    }
  }'
```

6. Test reading studies (replace `YOUR_ACCESS_TOKEN` with your token):
```bash
curl -X GET "http://localhost:5000/studies/read?status=draft" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Alternative: Use the test script**

For easier testing, you can use the provided test script:
```bash
cd api
./test_studies_api.sh
```

**Learning Point:**
- JWT tokens are required for authentication
- Always get a token first from `/token` endpoint
- Include token in `Authorization: Bearer <token>` header
- JSON in request body for POST
- Query parameters for GET filters
- Token expires after 1 hour (3600 seconds)
- **Foreign Key Constraints**: Studies require valid `organization_id` and `created_by` (user_id) that exist in the database
- Always create dependent records (organizations, users) before creating studies

---

## 🎨 Phase 6: Connect Frontend to Backend (Day 6-7)

### Step 6.1: Update API Utility to Handle Studies

**Why?** Frontend needs functions to call your new API.

**What to do:**

1. Update `frontend/src/utils/api.ts` to add study functions:

```typescript
// Add these new functions

export async function createStudy(studyData: any) {
    return await accessAPI('/studies/create', 'POST', { study: studyData });
}

export async function getStudies(filters?: { id?: string; status?: string; organization_id?: string }) {
    const queryParams = new URLSearchParams();
    if (filters?.id) queryParams.append('id', filters.id);
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.organization_id) queryParams.append('organization_id', filters.organization_id);
    
    const queryString = queryParams.toString();
    const url = `/studies/read${queryString ? '?' + queryString : ''}`;
    return await accessAPI(url, 'GET');
}

export async function updateStudy(studyId: string, updateData: any) {
    return await accessAPI('/studies/update', 'POST', { id: studyId, data: updateData });
}

export async function deleteStudy(studyId: string) {
    return await accessAPI('/studies/delete', 'POST', { id: studyId });
}
```

**Learning Point:**
- TypeScript = JavaScript with types (catches errors early)
- `async/await` = handle asynchronous operations (API calls)
- URLSearchParams = build query strings safely

---

### Step 6.2: Replace Mock Data with Real API Calls

**Why?** Connect your UI to real data.

**What to do:**

1. Update `frontend/src/app/dashboard/page.tsx`:

```typescript
'use client'

import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"
// ... other imports
import { getStudies } from "@/utils/api"

export default function DashboardPage() {
  const [studies, setStudies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStudies() {
      try {
        const data = await getStudies()
        setStudies(data)
      } catch (error) {
        console.error('Failed to fetch studies:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchStudies()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  const activeStudies = studies.filter((s: any) => s.status === "active")
  // ... rest of component
}
```

**Learning Point:**
- `useState` = store component state (data)
- `useEffect` = run code when component loads
- `async/await` = wait for API response
- Error handling = graceful failures

---

## 🎯 Next Steps After This

Once you complete these phases, you'll have:
- ✅ Working database
- ✅ Secure credentials
- ✅ Studies API
- ✅ Frontend-backend connection

**Then continue with:**
1. Authentication (Supabase Auth integration)
2. Task management API
3. Participant management
4. Response collection
5. AI analysis service

---

## 📖 Learning Resources

- **Flask**: [flask.palletsprojects.com](https://flask.palletsprojects.com/)
- **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)
- **Supabase**: [supabase.com/docs](https://supabase.com/docs)
- **SQL**: [sqlbolt.com](https://sqlbolt.com/) (interactive SQL tutorial)
- **REST APIs**: [restfulapi.net](https://restfulapi.net/)

---

## ❓ Common Questions

**Q: What if I get an error?**
A: Read the error message carefully. Check:
- Are environment variables set?
- Is the database running?
- Are credentials correct?
- Check server logs for details

**Q: How do I debug?**
A: 
- Backend: Check terminal where Flask is running
- Frontend: Check browser console (F12)
- Database: Use Supabase SQL Editor to query tables

**Q: Should I commit .env files?**
A: NO! They're in `.gitignore` for a reason. Never commit secrets.

---

**Ready to start? Begin with Phase 1, Step 1.1!** 🚀

