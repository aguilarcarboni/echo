# Echo Platform - Complete Implementation README

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Prerequisites](#prerequisites)
3. [Step-by-Step Implementation](#step-by-step-implementation)
4. [Database Setup](#database-setup)
5. [Backend Setup](#backend-setup)
6. [Frontend Setup](#frontend-setup)
7. [Integration & Testing](#integration--testing)
8. [Deployment](#deployment)
9. [Features Implementation Roadmap](#features-implementation-roadmap)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

**Echo** is an AI-powered consumer research platform that enables companies to:
- Design custom research studies with AI assistance
- Collect multimedia responses (video, text, images, collages)
- Analyze responses automatically using AI
- Generate actionable insights and strategic recommendations
- Complete research cycles in hours instead of weeks

### Technology Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Shadcn/ui
- **Backend**: Flask (Python), Celery, Redis
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4 / Anthropic Claude
- **Storage**: Supabase Storage
- **Deployment**: Vercel (Frontend), Railway/Render (Backend)

---

## 📦 Prerequisites

### Required Software

```bash
# 1. Node.js (v18 or higher)
node --version  # Should be v18.x.x or higher

# 2. Python (v3.11 or higher)
python3 --version  # Should be 3.11.x or higher

# 3. Git
git --version

# 4. Redis (for Celery task queue)
redis-server --version

# 5. Package managers
npm --version
pip --version
```

### Required Accounts

1. **Supabase Account**: [supabase.com](https://supabase.com)
2. **OpenAI API Key**: [platform.openai.com](https://platform.openai.com)
3. **Anthropic API Key** (optional): [console.anthropic.com](https://console.anthropic.com)
4. **Vercel Account** (for deployment): [vercel.com](https://vercel.com)
5. **Railway/Render Account** (for backend): [railway.app](https://railway.app) or [render.com](https://render.com)

---

## 🚀 Step-by-Step Implementation

### WEEK 1: Project Setup & Database

#### Day 1-2: Initial Project Structure

```bash
# 1. Create root directory
mkdir echo-platform
cd echo-platform

# 2. Initialize Git repository
git init
echo "node_modules/" > .gitignore
echo "venv/" >> .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo "__pycache__/" >> .gitignore
echo "*.pyc" >> .gitignore

# 3. Create frontend with Next.js
npx create-next-app@latest frontend \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

# 4. Create backend directory structure
mkdir -p backend/{app/{api,services,models,tasks,utils},tests}
cd backend
```

#### Day 3-4: Supabase Setup

**Step 1: Create Supabase Project**

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in:
   - **Name**: echo-platform
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to your users
4. Wait for project to initialize (~2 minutes)

**Step 2: Copy Project Credentials**

Navigate to Project Settings > API and copy:
- **Project URL** (e.g., `https://xxxxx.supabase.co`)
- **anon public key** (starts with `eyJhbG...`)
- **service_role key** (starts with `eyJhbG...`) - **Keep this secret!**

**Step 3: Execute Database Schema**

1. Go to SQL Editor in Supabase Dashboard
2. Click "New Query"
3. Copy the entire database schema from the first artifact
4. Click "Run" to execute
5. Verify tables created:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

**Step 4: Configure Storage Buckets**

1. Go to Storage in Supabase Dashboard
2. Create these buckets:

```sql
-- Click "New Bucket" for each:

-- 1. study-assets (Public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('study-assets', 'study-assets', true);

-- 2. participant-uploads (Private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('participant-uploads', 'participant-uploads', false);

-- 3. company-data (Private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-data', 'company-data', false);
```

3. Set up storage policies (SQL Editor):

```sql
-- Allow authenticated users to upload study assets
CREATE POLICY "Authenticated users can upload study assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'study-assets');

-- Allow public read for study assets
CREATE POLICY "Public can view study assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'study-assets');

-- Allow participants to upload responses
CREATE POLICY "Participants can upload responses"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'participant-uploads');

-- Allow org members to read participant uploads
CREATE POLICY "Org members can view participant uploads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'participant-uploads');
```

#### Day 5-7: Backend Foundation

```bash
# In backend/ directory

# 1. Create Python virtual environment
python3 -m venv venv

# 2. Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# 3. Create requirements.txt
cat > requirements.txt << 'EOF'
Flask==3.0.0
flask-cors==4.0.0
flask-restx==1.3.0
python-dotenv==1.0.0
supabase==2.3.0
openai==1.6.1
anthropic==0.8.1
celery==5.3.4
redis==5.0.1
gunicorn==21.2.0
Pillow==10.1.0
pandas==2.1.4
numpy==1.26.2
pytest==7.4.3
python-multipart==0.0.6
EOF

# 4. Install dependencies
pip install -r requirements.txt

# 5. Create .env file
cat > .env << 'EOF'
FLASK_ENV=development
SECRET_KEY=your-secret-key-generate-new-one
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_service_role_key_here
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
REDIS_URL=redis://localhost:6379/0
EOF

# 6. Create basic Flask structure
# Create app/__init__.py
mkdir -p app/{api,services,models,tasks,utils}
touch app/__init__.py
```

**Create `app/__init__.py`:**

```python
from flask import Flask
from flask_cors import CORS
from flask_restx import Api
from app.config import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Enable CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000", "http://localhost:3001"],
            "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "expose_headers": ["Content-Range", "X-Content-Range"],
            "supports_credentials": True
        }
    })
    
    # Initialize API with Swagger documentation
    api = Api(
        app,
        version='1.0',
        title='Echo API',
        description='AI-Powered Consumer Research Platform',
        doc='/api/docs',
        prefix='/api'
    )
    
    # Register API namespaces
    from app.api import register_namespaces
    register_namespaces(api)
    
    # Health check endpoint
    @app.route('/health')
    def health():
        return {'status': 'healthy', 'service': 'echo-backend'}, 200
    
    return app
```

**Create `app/config.py`:**

```python
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    DEBUG = FLASK_ENV == 'development'
    
    # Supabase
    SUPABASE_URL = os.getenv('SUPABASE_URL')
    SUPABASE_KEY = os.getenv('SUPABASE_KEY')
    
    # AI APIs
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')
    
    # Redis & Celery
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    CELERY_BROKER_URL = REDIS_URL
    CELERY_RESULT_BACKEND = REDIS_URL
    
    # File Upload
    MAX_CONTENT_LENGTH = 100 * 1024 * 1024  # 100MB max file size
```

**Create `app/services/supabase_client.py`:**

```python
from supabase import create_client, Client
from app.config import Config
from typing import Optional

class SupabaseService:
    """Singleton Supabase client"""
    _instance: Optional[Client] = None
    
    @classmethod
    def get_client(cls) -> Client:
        if cls._instance is None:
            if not Config.SUPABASE_URL or not Config.SUPABASE_KEY:
                raise ValueError("Supabase credentials not configured")
            
            cls._instance = create_client(
                Config.SUPABASE_URL,
                Config.SUPABASE_KEY
            )
        return cls._instance

# Global instance
supabase = SupabaseService.get_client()
```

**Create `run.py` in backend root:**

```python
from app import create_app
import os

app = create_app()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(
        debug=True,
        host='0.0.0.0',
        port=port
    )
```

**Test Backend:**

```bash
# Terminal 1: Start Redis (if not running as service)
redis-server

# Terminal 2: Start Flask
python run.py

# Terminal 3: Test health endpoint
curl http://localhost:5000/health
# Should return: {"status":"healthy","service":"echo-backend"}
```

---

### WEEK 2-3: Core Backend Implementation

#### Implement API Endpoints

**Create `app/api/__init__.py`:**

```python
def register_namespaces(api):
    """Register all API namespaces"""
    from app.api.studies import ns as studies_ns
    from app.api.tasks import ns as tasks_ns
    from app.api.participants import ns as participants_ns
    from app.api.responses import ns as responses_ns
    from app.api.analysis import ns as analysis_ns
    from app.api.ai import ns as ai_ns
    
    api.add_namespace(studies_ns)
    api.add_namespace(tasks_ns)
    api.add_namespace(participants_ns)
    api.add_namespace(responses_ns)
    api.add_namespace(analysis_ns)
    api.add_namespace(ai_ns)
```

**Create `app/api/studies.py`:**

```python
from flask_restx import Namespace, Resource, fields
from flask import request
from app.services.supabase_client import supabase
from app.utils.auth import require_auth
import uuid
from datetime import datetime

ns = Namespace('studies', description='Study management operations')

# API Models for Swagger
study_input = ns.model('StudyInput', {
    'name': fields.String(required=True, description='Study name'),
    'objective': fields.String(description='Research objective'),
    'study_type': fields.String(description='Type of study'),
    'target_participants': fields.Integer(default=50),
    'duration_days': fields.Integer(default=7),
    'segment_criteria': fields.Raw(description='Participant segmentation'),
})

@ns.route('/')
class StudyList(Resource):
    @require_auth
    def get(self, current_user):
        """List all studies for user's organization"""
        try:
            response = supabase.table('studies')\
                .select('*')\
                .eq('organization_id', current_user['organization_id'])\
                .order('created_at', desc=True)\
                .execute()
            
            return {'studies': response.data}, 200
        except Exception as e:
            return {'error': str(e)}, 500
    
    @ns.expect(study_input)
    @require_auth
    def post(self, current_user):
        """Create a new study"""
        try:
            data = request.json
            
            study_data = {
                'id': str(uuid.uuid4()),
                'organization_id': current_user['organization_id'],
                'created_by': current_user['id'],
                'name': data['name'],
                'objective': data.get('objective'),
                'study_type': data.get('study_type'),
                'status': 'draft',
                'target_participants': data.get('target_participants', 50),
                'duration_days': data.get('duration_days', 7),
                'segment_criteria': data.get('segment_criteria', {}),
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat(),
            }
            
            response = supabase.table('studies')\
                .insert(study_data)\
                .execute()
            
            return response.data[0], 201
        except Exception as e:
            return {'error': str(e)}, 500

@ns.route('/<string:study_id>')
class Study(Resource):
    @require_auth
    def get(self, current_user, study_id):
        """Get study details with tasks and participants"""
        try:
            response = supabase.table('studies')\
                .select('*, tasks(*), participants(*)')\
                .eq('id', study_id)\
                .eq('organization_id', current_user['organization_id'])\
                .single()\
                .execute()
            
            if not response.data:
                return {'error': 'Study not found'}, 404
            
            return response.data, 200
        except Exception as e:
            return {'error': str(e)}, 500
    
    @ns.expect(study_input)
    @require_auth
    def put(self, current_user, study_id):
        """Update study"""
        try:
            data = request.json
            data['updated_at'] = datetime.utcnow().isoformat()
            
            response = supabase.table('studies')\
                .update(data)\
                .eq('id', study_id)\
                .eq('organization_id', current_user['organization_id'])\
                .execute()
            
            if not response.data:
                return {'error': 'Study not found'}, 404
            
            return response.data[0], 200
        except Exception as e:
            return {'error': str(e)}, 500
    
    @require_auth
    def delete(self, current_user, study_id):
        """Delete study"""
        try:
            response = supabase.table('studies')\
                .delete()\
                .eq('id', study_id)\
                .eq('organization_id', current_user['organization_id'])\
                .execute()
            
            return {'message': 'Study deleted successfully'}, 200
        except Exception as e:
            return {'error': str(e)}, 500

@ns.route('/<string:study_id>/activate')
class StudyActivate(Resource):
    @require_auth
    def post(self, current_user, study_id):
        """Activate study and send invitations"""
        try:
            # Update study status
            supabase.table('studies')\
                .update({
                    'status': 'active',
                    'start_date': datetime.utcnow().isoformat()
                })\
                .eq('id', study_id)\
                .execute()
            
            # TODO: Trigger participant invitation emails
            # from app.tasks.notifications import send_invitations
            # send_invitations.delay(study_id)
            
            return {'message': 'Study activated'}, 200
        except Exception as e:
            return {'error': str(e)}, 500
```

**Create `app/utils/auth.py`:**

```python
from functools import wraps
from flask import request
from app.services.supabase_client import supabase

def require_auth(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return {'error': 'Missing or invalid authorization header'}, 401
        
        token = auth_header.split(' ')[1]
        
        try:
            # Verify token with Supabase
            user = supabase.auth.get_user(token)
            
            if not user:
                return {'error': 'Invalid token'}, 401
            
            # Get full user data with organization
            user_data = supabase.table('users')\
                .select('*')\
                .eq('id', user.user.id)\
                .single()\
                .execute()
            
            if not user_data.data:
                return {'error': 'User not found'}, 404
            
            # Pass user to endpoint
            return f(current_user=user_data.data, *args, **kwargs)
            
        except Exception as e:
            return {'error': f'Authentication failed: {str(e)}'}, 401
    
    return decorated_function
```

#### Implement AI Service

**Create `app/services/ai_service.py`:**

```python
from openai import OpenAI
from anthropic import Anthropic
from app.config import Config
import json
from typing import Dict, List, Optional

class AIService:
    """Service for AI-powered analysis and suggestions"""
    
    def __init__(self):
        self.openai_client = OpenAI(api_key=Config.OPENAI_API_KEY) if Config.OPENAI_API_KEY else None
        self.anthropic_client = Anthropic(api_key=Config.ANTHROPIC_API_KEY) if Config.ANTHROPIC_API_KEY else None
    
    def suggest_study_design(self, objective: str, company_data: Optional[Dict] = None) -> Dict:
        """Generate AI-powered study design suggestions"""
        
        if not self.openai_client:
            raise ValueError("OpenAI API key not configured")
        
        context = f"Company Context: {json.dumps(company_data)}" if company_data else "No company data provided"
        
        prompt = f"""You are an expert market researcher. Based on the research objective below, provide a comprehensive study design recommendation.

OBJECTIVE: {objective}

{context}

Please provide your recommendations in the following JSON format:
{{
    "study_type": "<recommended study type>",
    "reasoning": "<why this study type is appropriate>",
    "recommended_tasks": [
        {{
            "type": "<camera|discussion|gallery|collage|classification|fill_blanks>",
            "title": "<task title>",
            "instructions": "<detailed instructions for participants>",
            "rationale": "<why this task is valuable>"
        }}
    ],
    "target_participants": <recommended number>,
    "duration_days": <recommended duration>,
    "segment_suggestions": {{
        "age_range": "<suggested age range>",
        "demographics": ["<key demographic factors>"]
    }},
    "key_questions": ["<3-5 key questions this study should answer>"]
}}

Ensure the tasks are diverse and will capture both qualitative and quantitative insights."""

        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": "You are an expert consumer research consultant with 20 years of experience designing effective research studies. Always provide practical, actionable recommendations."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.7
            )
            
            return json.loads(response.choices[0].message.content)
            
        except Exception as e:
            raise Exception(f"AI suggestion failed: {str(e)}")
    
    def analyze_text_response(self, text: str, context: Optional[str] = None) -> Dict:
        """Analyze a text response for sentiment, themes, and key phrases"""
        
        if not self.anthropic_client:
            raise ValueError("Anthropic API key not configured")
        
        prompt = f"""Analyze the following participant response and extract insights:

RESPONSE: {text}

{f'CONTEXT: {context}' if context else ''}

Provide a JSON analysis with:
1. sentiment: object with score (-1 to 1), label (positive/neutral/negative), and confidence (0-1)
2. themes: array of 3-5 main themes/topics mentioned
3. key_phrases: array of 5-10 notable quotes or phrases (extract verbatim)
4. emotions: array of detected emotions (joy, frustration, excitement, concern, etc.)
5. insights: array of 2-3 key takeaways

Format as valid JSON."""

        try:
            response = self.anthropic_client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=2000,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            # Extract JSON from response
            content = response.content[0].text
            # Find JSON in response (may be wrapped in markdown)
            if '```json' in content:
                content = content.split('```json')[1].split('```')[0]
            elif '```' in content:
                content = content.split('```')[1].split('```')[0]
            
            return json.loads(content.strip())
            
        except Exception as e:
            raise Exception(f"Text analysis failed: {str(e)}")
    
    def synthesize_study_insights(self, study_data: Dict) -> Dict:
        """Generate comprehensive study analysis and strategic recommendations"""
        
        if not self.openai_client:
            raise ValueError("OpenAI API key not configured")
        
        prompt = f"""You are analyzing a completed consumer research study. Based on all participant responses and data, provide a comprehensive analysis.

STUDY DATA:
{json.dumps(study_data, indent=2)}

Provide a comprehensive JSON analysis with:

1. executive_summary: 3-4 sentence overview of key findings
2. key_insights: array of 7-10 most important discoveries
3. themes: array of objects with:
   - theme: theme name
   - frequency: how common (high/medium/low)
   - sentiment: overall sentiment
   - description: what this theme reveals
   - examples: 2-3 supporting quotes
4. sentiment_analysis:
   - overall: percentage breakdown
   - by_segment: if segments exist
   - trends: notable patterns
5. recommendations: array of 5-7 strategic actions with:
   - priority: high/medium/low
   - category: product/marketing/experience/other
   - recommendation: what to do
   - rationale: why this matters
   - expected_impact: potential outcome
6. opportunities: areas for growth or innovation
7. risks: concerns or challenges identified
8. next_steps: specific actions to take

Be specific, actionable, and business-focused."""

        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": "You are a senior consumer insights analyst who translates research data into actionable business strategy."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.6
            )
            
            return json.loads(response.choices[0].message.content)
            
        except Exception as e:
            raise Exception(f"Study synthesis failed: {str(e)}")

# Global instance
ai_service = AIService()
```

---

### WEEK 4-6: Frontend Implementation

#### Setup Frontend Dependencies

```bash
cd frontend

# Install core dependencies
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install zustand react-hook-form @hookform/resolvers zod
npm install @tanstack/react-query axios
npm install date-fns clsx tailwind-merge
npm install recharts
npm install lucide-react

# Install Shadcn/ui
npx shadcn-ui@latest init

# Add required shadcn components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add select
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add table
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add toast
```

#### Configure Environment

**Create `frontend/.env.local`:**

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Run Development Servers

```bash
# Terminal 1: Backend
cd backend
source venv/bin/activate
python run.py

# Terminal 2: Frontend
cd frontend
npm run dev

# Access:
# - Frontend: http://localhost:3000
# - Backend API Docs: http://localhost:5000/api/docs
# - Supabase Studio: https://app.supabase.com/project/your-project
```

---

## 🎯 Features Implementation Roadmap

### MVP (Weeks 1-6)
- ✅ Database schema
- ✅ Authentication (Supabase Auth)
- ✅ Study CRUD operations
- ✅ Task builder (all 6 types)
- ✅ Participant management
- ✅ Response collection
- ✅ Basic AI analysis
- ✅ Simple dashboard

### Phase 2 (Weeks 7-10)
- [ ] AI-powered follow-ups
- [ ] Advanced analytics dashboard
- [ ] Real-time collaboration
- [ ] Email/WhatsApp distribution
- [ ] Export functionality (PDF reports)
- [ ] Participant panel integration

### Phase 3 (Weeks 11-14)
- [ ] Web scraping module
- [ ] Social listening integration
- [ ] Advanced segmentation
- [ ] A/B testing features
- [ ] API for third-party integrations
- [ ] White-label capabilities

---

## 🐛 Troubleshooting

### Common Issues

**1. Supabase Connection Errors**
```bash
# Check environment variables
cat .env | grep SUPABASE

# Test connection
python -c "from app.services.supabase_client import supabase; print(supabase.table('users').select('*').limit(1).execute())"
```

**2. CORS Errors**
- Ensure Flask CORS is configured for `http://localhost:3000`
- Check browser console for specific origin
- Verify API_URL in frontend `.env.local`

**3. Redis Connection Failed**
```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# If not running:
# macOS: brew services start redis
# Linux: sudo systemctl start redis
# Windows: Use Redis for Windows or WSL
```

**4. AI API Errors**
- Verify API keys are set correctly
- Check API quota/billing status
- Test with simple curl request
- Review error messages in logs

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Anthropic Claude API](https://docs.anthropic.com/)

---

## 🤝 Support

For issues or questions:
1. Check troubleshooting section above
2. Review console/server logs
3. Verify environment variables
4. Test each component individually

---

## 📝 License

[Your chosen license]

---

**Built with ❤️ for better consumer research**