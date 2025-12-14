# Echo Platform - Phase 2 Learning Guide
## Completing MVP Features

## 🎯 Overview

Congratulations on completing Phase 1! You now have:
- ✅ Database setup and schema
- ✅ Backend foundation with Flask
- ✅ Studies CRUD API
- ✅ Basic frontend dashboard
- ✅ Frontend-backend connection

**Phase 2 Goal:** Complete the remaining MVP features to make Echo a fully functional research platform.

---

## 📋 Phase 2 Checklist

### What We'll Build:
1. **Tasks Management** - Create, read, update, delete tasks for studies
2. **Participants Management** - Add, invite, and track participants
3. **Response Collection** - Handle participant responses to tasks
4. **AI Service** - Integrate OpenAI/Anthropic for study suggestions and analysis
5. **Storage Setup** - Configure Supabase Storage for media files
6. **Complete Frontend Integration** - Connect all UI components to APIs

---

## 🗄️ Phase 2.1: Tasks Management (Days 1-2)

### Step 2.1.1: Understand Tasks

**Why?** Tasks are the individual activities participants complete in a study. Each study can have multiple tasks of different types.

**Task Types:**
- `camera` - Video responses
- `discussion` - Text responses to questions
- `gallery` - Image reactions/selection
- `collage` - Creative image assembly
- `classification` - Ranking/sorting items
- `fill_blanks` - Fill-in-the-blank questions

**Database Schema (already exists):**
```sql
CREATE TABLE tasks (
    id UUID PRIMARY KEY,
    study_id UUID REFERENCES studies(id),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    instructions TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Learning Point:** Tasks belong to studies (one-to-many relationship). The `order_index` determines the sequence participants see tasks.

---

### Step 2.1.2: Create Task Model

**What to do:**

1. Update `api/src/utils/connectors/supabase.py` to add Task model:

```python
def _setup_models(self):
    # ... existing User and Study models ...
    
    class Task(self.Base):
        __tablename__ = 'tasks'
        id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
        study_id = Column(UUID(as_uuid=True), nullable=False)
        type = Column(Text, nullable=False)
        title = Column(Text, nullable=False)
        instructions = Column(Text, nullable=True)
        order_index = Column(Integer, default=0)
        created_at = Column(Text, nullable=False)
        updated_at = Column(Text, nullable=False)
    
    self.Task = Task
```

**Learning Point:** Models define the structure of database tables in Python code.

---

### Step 2.1.3: Create Task Component (Business Logic)

**What to do:**

1. Create `api/src/components/tasks.py`:

```python
"""
Tasks Component - Business Logic Layer
"""

from src.utils.exception import handle_exception
from src.utils.connectors.supabase import db
from src.utils.logger import logger
from datetime import datetime

logger.announcement('Initializing Tasks Service', type='info')

@handle_exception
def create_task(task: dict = None):
    """
    Create a new task for a study.
    
    Args:
        task (dict): Task data including:
            - study_id (required)
            - type (required): camera, discussion, gallery, collage, classification, fill_blanks
            - title (required)
            - instructions (optional)
            - order_index (optional, defaults to 0)
    
    Returns:
        str: The ID of the created task
    """
    if not task:
        raise Exception("Task data is required")
    
    # Validate required fields
    if not task.get('study_id'):
        raise Exception("study_id is required")
    if not task.get('type'):
        raise Exception("type is required")
    if not task.get('title'):
        raise Exception("title is required")
    
    # Validate task type
    valid_types = ['camera', 'discussion', 'gallery', 'collage', 'classification', 'fill_blanks']
    if task.get('type') not in valid_types:
        raise Exception(f"Invalid task type. Must be one of: {', '.join(valid_types)}")
    
    # Add timestamps
    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    task['created_at'] = current_time
    task['updated_at'] = current_time
    
    # Set defaults
    if 'order_index' not in task:
        # Get max order_index for this study and add 1
        existing_tasks = db.read(table='tasks', query={'study_id': task['study_id']})
        max_order = max([t.get('order_index', 0) for t in existing_tasks] + [0])
        task['order_index'] = max_order + 1
    
    task_id = db.create(table='tasks', data=task)
    logger.success(f'Created task with id: {task_id}')
    return task_id

@handle_exception
def read_tasks(query=None):
    """
    Read tasks with optional filters.
    
    Args:
        query (dict): Optional filters such as:
            - id: Filter by task ID
            - study_id: Filter by study
            - type: Filter by task type
    
    Returns:
        list: List of task dictionaries, ordered by order_index
    """
    if query is None:
        query = {}
    
    tasks = db.read(table='tasks', query=query)
    
    # Sort by order_index
    tasks.sort(key=lambda x: x.get('order_index', 0))
    
    logger.info(f'Retrieved {len(tasks)} tasks')
    return tasks

@handle_exception
def update_task(task_id: str, data: dict = None):
    """
    Update an existing task.
    
    Args:
        task_id (str): The ID of the task to update
        data (dict): Fields to update
    
    Returns:
        str: The ID of the updated task
    """
    if not task_id:
        raise Exception("Task ID is required")
    if not data:
        raise Exception("Update data is required")
    
    # Validate task type if being updated
    if 'type' in data:
        valid_types = ['camera', 'discussion', 'gallery', 'collage', 'classification', 'fill_blanks']
        if data['type'] not in valid_types:
            raise Exception(f"Invalid task type. Must be one of: {', '.join(valid_types)}")
    
    # Update timestamp
    data['updated_at'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    updated_id = db.update(table='tasks', query={'id': task_id}, data=data)
    logger.success(f'Updated task with id: {updated_id}')
    return updated_id

@handle_exception
def delete_task(task_id: str):
    """
    Delete a task.
    
    Args:
        task_id (str): The ID of the task to delete
    
    Returns:
        str: The ID of the deleted task
    """
    if not task_id:
        raise Exception("Task ID is required")
    
    deleted_id = db.delete(table='tasks', query={'id': task_id})
    logger.success(f'Deleted task with id: {deleted_id}')
    return deleted_id

@handle_exception
def reorder_tasks(study_id: str, task_ids: list):
    """
    Reorder tasks for a study.
    
    Args:
        study_id (str): The study ID
        task_ids (list): List of task IDs in desired order
    
    Returns:
        dict: Success message
    """
    if not study_id:
        raise Exception("Study ID is required")
    if not task_ids:
        raise Exception("Task IDs list is required")
    
    # Update order_index for each task
    for index, task_id in enumerate(task_ids, start=1):
        db.update(
            table='tasks',
            query={'id': task_id, 'study_id': study_id},
            data={'order_index': index, 'updated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
        )
    
    logger.success(f'Reordered {len(task_ids)} tasks for study {study_id}')
    return {'message': 'Tasks reordered successfully'}

logger.announcement('Initialized Tasks Service', type='success')
```

**Learning Point:**
- Business logic validates data before database operations
- `order_index` helps maintain task sequence
- Reordering allows drag-and-drop functionality later

---

### Step 2.1.4: Create Task API Routes

**What to do:**

1. Create `api/src/app/tasks.py`:

```python
"""
Tasks API Routes
"""

from flask import Blueprint, request
from src.components.tasks import (
    create_task, read_tasks, update_task, delete_task, reorder_tasks
)
from src.utils.response import format_response
from src.utils.logger import logger
import uuid

bp = Blueprint('tasks', __name__)

@bp.route('/create', methods=['POST'])
@format_response
def create():
    """
    Create a new task.
    
    Request body:
    {
        "task": {
            "study_id": "uuid",
            "type": "camera|discussion|gallery|collage|classification|fill_blanks",
            "title": "Task Title",
            "instructions": "Task instructions",
            "order_index": 0
        }
    }
    """
    logger.info('Received request to create task')
    payload = request.get_json(force=True)
    task_data = payload.get('task', {})
    
    # Generate ID if not provided
    if 'id' not in task_data:
        task_data['id'] = str(uuid.uuid4())
    
    task_id = create_task(task=task_data)
    return {'id': task_id, 'message': 'Task created successfully'}

@bp.route('/read', methods=['GET'])
@format_response
def read():
    """
    Read tasks with optional filters.
    
    Query parameters:
    - id: Filter by task ID
    - study_id: Filter by study
    - type: Filter by task type
    """
    logger.info('Received request to read tasks')
    query = {}
    
    task_id = request.args.get('id', None)
    study_id = request.args.get('study_id', None)
    task_type = request.args.get('type', None)
    
    if task_id:
        query['id'] = task_id
    if study_id:
        query['study_id'] = study_id
    if task_type:
        query['type'] = task_type
    
    tasks = read_tasks(query=query)
    return tasks

@bp.route('/update', methods=['POST'])
@format_response
def update():
    """
    Update an existing task.
    
    Request body:
    {
        "id": "task-uuid",
        "data": {
            "title": "Updated Title",
            "instructions": "Updated instructions",
            ...
        }
    }
    """
    logger.info('Received request to update task')
    payload = request.get_json(force=True)
    task_id = payload.get('id')
    update_data = payload.get('data', {})
    
    if not task_id:
        raise Exception("Task ID is required")
    
    updated_id = update_task(task_id=task_id, data=update_data)
    return {'id': updated_id, 'message': 'Task updated successfully'}

@bp.route('/delete', methods=['POST'])
@format_response
def delete():
    """
    Delete a task.
    
    Request body:
    {
        "id": "task-uuid"
    }
    """
    logger.info('Received request to delete task')
    payload = request.get_json(force=True)
    task_id = payload.get('id')
    
    if not task_id:
        raise Exception("Task ID is required")
    
    deleted_id = delete_task(task_id=task_id)
    return {'id': deleted_id, 'message': 'Task deleted successfully'}

@bp.route('/reorder', methods=['POST'])
@format_response
def reorder():
    """
    Reorder tasks for a study.
    
    Request body:
    {
        "study_id": "study-uuid",
        "task_ids": ["task-uuid-1", "task-uuid-2", ...]
    }
    """
    logger.info('Received request to reorder tasks')
    payload = request.get_json(force=True)
    study_id = payload.get('study_id')
    task_ids = payload.get('task_ids', [])
    
    if not study_id:
        raise Exception("Study ID is required")
    if not task_ids:
        raise Exception("Task IDs list is required")
    
    result = reorder_tasks(study_id=study_id, task_ids=task_ids)
    return result
```

2. Register the blueprint in `api/run.py`:

```python
# Add import
from src.app import users, studies, organizations, tasks

# Add registration
app.register_blueprint(tasks.bp, url_prefix='/tasks')
```

**Learning Point:**
- API routes handle HTTP requests/responses
- Business logic stays in components
- Blueprints organize routes by feature

---

### Step 2.1.5: Test Tasks API

**What to do:**

1. Restart Flask server:
```bash
cd api
python run.py
```

2. Get a token:
```bash
curl -X POST http://localhost:5000/token \
  -H "Content-Type: application/json" \
  -d '{"token": "all"}'
```

3. Create a task (replace `YOUR_STUDY_ID` and `YOUR_TOKEN`):
```bash
curl -X POST http://localhost:5000/tasks/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "task": {
      "study_id": "YOUR_STUDY_ID",
      "type": "discussion",
      "title": "What are your thoughts on our product?",
      "instructions": "Please share your honest feedback"
    }
  }'
```

4. Read tasks for a study:
```bash
curl -X GET "http://localhost:5000/tasks/read?study_id=YOUR_STUDY_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Learning Point:** Test each endpoint before building frontend to catch errors early.

---

### Step 2.1.6: Add Tasks to Frontend API Utility

**What to do:**

1. Update `frontend/src/utils/api.ts`:

```typescript
// Add these functions after the study functions

export async function createTask(taskData: any) {
    return await accessAPI('/tasks/create', 'POST', { task: taskData });
}

export async function getTasks(filters?: { id?: string; study_id?: string; type?: string }) {
    const queryParams = new URLSearchParams();
    if (filters?.id) queryParams.append('id', filters.id);
    if (filters?.study_id) queryParams.append('study_id', filters.study_id);
    if (filters?.type) queryParams.append('type', filters.type);
    
    const queryString = queryParams.toString();
    const url = `/tasks/read${queryString ? '?' + queryString : ''}`;
    return await accessAPI(url, 'GET');
}

export async function updateTask(taskId: string, updateData: any) {
    return await accessAPI('/tasks/update', 'POST', { id: taskId, data: updateData });
}

export async function deleteTask(taskId: string) {
    return await accessAPI('/tasks/delete', 'POST', { id: taskId });
}

export async function reorderTasks(studyId: string, taskIds: string[]) {
    return await accessAPI('/tasks/reorder', 'POST', { study_id: studyId, task_ids: taskIds });
}
```

**Learning Point:** Frontend API functions wrap HTTP calls for easy use in components.

---

### Step 2.1.7: Update Create Study Page to Save Tasks

**What to do:**

1. Update `frontend/src/app/studies/create/page.tsx` to actually create the study and tasks:

```typescript
// Add import
import { createStudy, createTask } from "@/utils/api"

// Update handleSubmit function
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
        // First, create the study
        const studyResult = await createStudy({
            name,
            objective,
            study_type: researchType,
            target_participants: parseInt(numParticipants) || 50,
            duration_days: parseInt(duration) || 7,
            segment_criteria: segment ? JSON.parse(segment) : {},
            status: 'draft',
            // You'll need to get these from your auth/user context
            organization_id: 'YOUR_ORG_ID', // TODO: Get from user context
            created_by: 'YOUR_USER_ID', // TODO: Get from user context
        })
        
        const studyId = studyResult.id
        
        // Then, create all tasks
        for (const task of tasks) {
            await createTask({
                study_id: studyId,
                type: getTaskTypeFromId(task.taskTypeId), // Map your task type IDs
                title: task.prompt,
                instructions: task.prompt,
            })
        }
        
        toast({
            title: "Study Created!",
            description: "Your study has been created successfully.",
        })
        
        router.push(`/studies/${studyId}`)
    } catch (error) {
        console.error('Failed to create study:', error)
        toast({
            title: "Error",
            description: "Failed to create study. Please try again.",
            variant: "destructive",
        })
    }
}

// Helper function to map task type IDs to strings
function getTaskTypeFromId(id: number): string {
    const typeMap: { [key: number]: string } = {
        1: 'camera',
        2: 'discussion',
        3: 'gallery',
        4: 'collage',
        5: 'classification',
        6: 'fill_blanks',
    }
    return typeMap[id] || 'discussion'
}
```

**Learning Point:** Create the study first, then create tasks that reference it.

---

## 👥 Phase 2.2: Participants Management (Days 3-4)

### Step 2.2.1: Understand Participants

**Why?** Participants are the people who complete studies. They need to be invited, tracked, and their responses collected.

**Database Schema (already exists):**
```sql
CREATE TABLE participants (
    id UUID PRIMARY KEY,
    study_id UUID REFERENCES studies(id),
    contact TEXT NOT NULL, -- email or phone
    demographics JSONB, -- age, gender, location, etc.
    status TEXT DEFAULT 'invited', -- invited, started, completed, dropped
    invited_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Learning Point:** Participants are linked to studies. Status tracks their progress through the study.

---

### Step 2.2.2: Create Participant Component

**What to do:**

1. Create `api/src/components/participants.py`:

```python
"""
Participants Component - Business Logic Layer
"""

from src.utils.exception import handle_exception
from src.utils.connectors.supabase import db
from src.utils.logger import logger
from datetime import datetime

logger.announcement('Initializing Participants Service', type='info')

@handle_exception
def create_participant(participant: dict = None):
    """
    Create a new participant for a study.
    
    Args:
        participant (dict): Participant data including:
            - study_id (required)
            - contact (required): email or phone
            - demographics (optional): JSON object with age, gender, location, etc.
            - status (optional, defaults to 'invited')
    
    Returns:
        str: The ID of the created participant
    """
    if not participant:
        raise Exception("Participant data is required")
    
    # Validate required fields
    if not participant.get('study_id'):
        raise Exception("study_id is required")
    if not participant.get('contact'):
        raise Exception("contact is required")
    
    # Add timestamps
    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    participant['created_at'] = current_time
    participant['updated_at'] = current_time
    
    # Set defaults
    if 'status' not in participant:
        participant['status'] = 'invited'
    if 'invited_at' not in participant:
        participant['invited_at'] = current_time
    
    participant_id = db.create(table='participants', data=participant)
    logger.success(f'Created participant with id: {participant_id}')
    return participant_id

@handle_exception
def read_participants(query=None):
    """
    Read participants with optional filters.
    
    Args:
        query (dict): Optional filters such as:
            - id: Filter by participant ID
            - study_id: Filter by study
            - status: Filter by status
    
    Returns:
        list: List of participant dictionaries
    """
    if query is None:
        query = {}
    
    participants = db.read(table='participants', query=query)
    logger.info(f'Retrieved {len(participants)} participants')
    return participants

@handle_exception
def update_participant(participant_id: str, data: dict = None):
    """
    Update an existing participant.
    
    Args:
        participant_id (str): The ID of the participant to update
        data (dict): Fields to update
    
    Returns:
        str: The ID of the updated participant
    """
    if not participant_id:
        raise Exception("Participant ID is required")
    if not data:
        raise Exception("Update data is required")
    
    # Update timestamp
    data['updated_at'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    # Handle status changes
    if 'status' in data:
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        if data['status'] == 'started' and 'started_at' not in data:
            data['started_at'] = current_time
        elif data['status'] == 'completed' and 'completed_at' not in data:
            data['completed_at'] = current_time
    
    updated_id = db.update(table='participants', query={'id': participant_id}, data=data)
    logger.success(f'Updated participant with id: {updated_id}')
    return updated_id

@handle_exception
def delete_participant(participant_id: str):
    """
    Delete a participant.
    
    Args:
        participant_id (str): The ID of the participant to delete
    
    Returns:
        str: The ID of the deleted participant
    """
    if not participant_id:
        raise Exception("Participant ID is required")
    
    deleted_id = db.delete(table='participants', query={'id': participant_id})
    logger.success(f'Deleted participant with id: {deleted_id}')
    return deleted_id

@handle_exception
def bulk_create_participants(study_id: str, contacts: list, demographics: dict = None):
    """
    Create multiple participants at once.
    
    Args:
        study_id (str): The study ID
        contacts (list): List of contact strings (emails/phones)
        demographics (dict): Optional default demographics for all participants
    
    Returns:
        dict: Count of created participants
    """
    if not study_id:
        raise Exception("Study ID is required")
    if not contacts:
        raise Exception("Contacts list is required")
    
    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    created_count = 0
    
    for contact in contacts:
        participant_data = {
            'study_id': study_id,
            'contact': contact,
            'status': 'invited',
            'invited_at': current_time,
            'created_at': current_time,
            'updated_at': current_time,
        }
        
        if demographics:
            participant_data['demographics'] = demographics
        
        try:
            db.create(table='participants', data=participant_data)
            created_count += 1
        except Exception as e:
            logger.error(f'Failed to create participant {contact}: {str(e)}')
    
    logger.success(f'Created {created_count} participants for study {study_id}')
    return {'created_count': created_count, 'total_requested': len(contacts)}

logger.announcement('Initialized Participants Service', type='success')
```

---

### Step 2.2.3: Create Participant API Routes

**What to do:**

1. Create `api/src/app/participants.py` (similar structure to tasks.py)

2. Register in `api/run.py`

3. Add frontend API functions in `frontend/src/utils/api.ts`

**Exercise:** Follow the same pattern as tasks to create the participants API. This reinforces the pattern!

---

## 📝 Phase 2.3: Response Collection (Days 5-6)

### Step 2.3.1: Understand Responses

**Why?** Responses store what participants submit for each task. They can be text, video URLs, images, or structured data.

**Database Schema:**
```sql
CREATE TABLE responses (
    id UUID PRIMARY KEY,
    participant_id UUID REFERENCES participants(id),
    task_id UUID REFERENCES tasks(id),
    response_data JSONB NOT NULL, -- Flexible: {text, videoUrl, images, etc.}
    submitted_at TIMESTAMP,
    created_at TIMESTAMP
);
```

**Learning Point:** `response_data` is JSONB to handle different response types flexibly.

---

### Step 2.3.2: Create Response Component & API

**Exercise:** Create `api/src/components/responses.py` and `api/src/app/responses.py` following the same pattern.

**Key functions needed:**
- `create_response()` - Save a participant's response to a task
- `read_responses()` - Get responses (filter by participant, task, or study)
- `update_response()` - Update a response (if allowed)
- `delete_response()` - Delete a response

**Response data structure examples:**
```json
// Text response
{"text": "I love this product!"}

// Video response
{"videoUrl": "https://storage.supabase.co/...", "duration": 120}

// Image response
{"images": ["url1", "url2"], "selectedImage": "url1"}

// Classification response
{"rankings": [{"item": "A", "rank": 1}, {"item": "B", "rank": 2}]}
```

---

## 🤖 Phase 2.4: AI Service Integration (Days 7-8)

### Step 2.4.1: Set Up AI API Keys

**What to do:**

1. Get OpenAI API key from [platform.openai.com](https://platform.openai.com)
2. Get Anthropic API key from [console.anthropic.com](https://console.anthropic.com) (optional)
3. Add to `api/.env`:
```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

---

### Step 2.4.2: Create AI Service

**What to do:**

1. Create `api/src/services/ai_service.py`:

```python
"""
AI Service - OpenAI and Anthropic Integration
"""

from openai import OpenAI
from anthropic import Anthropic
import os
import json
from typing import Dict, List, Optional
from dotenv import load_dotenv
from src.utils.logger import logger

load_dotenv()

class AIService:
    """Service for AI-powered analysis and suggestions"""
    
    def __init__(self):
        openai_key = os.getenv('OPENAI_API_KEY')
        anthropic_key = os.getenv('ANTHROPIC_API_KEY')
        
        self.openai_client = OpenAI(api_key=openai_key) if openai_key else None
        self.anthropic_client = Anthropic(api_key=anthropic_key) if anthropic_key else None
        
        if not self.openai_client and not self.anthropic_client:
            logger.warning('No AI API keys configured')
    
    def suggest_study_design(self, objective: str, company_data: Optional[Dict] = None) -> Dict:
        """
        Generate AI-powered study design suggestions.
        
        Args:
            objective: Research objective
            company_data: Optional company context
        
        Returns:
            Dict with study design recommendations
        """
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
            
            result = json.loads(response.choices[0].message.content)
            logger.success('Generated AI study design suggestions')
            return result
            
        except Exception as e:
            logger.error(f'AI suggestion failed: {str(e)}')
            raise Exception(f"AI suggestion failed: {str(e)}")
    
    def analyze_text_response(self, text: str, context: Optional[str] = None) -> Dict:
        """
        Analyze a text response for sentiment, themes, and key phrases.
        
        Args:
            text: Participant's text response
            context: Optional context about the task/study
        
        Returns:
            Dict with analysis results
        """
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
            
            content = response.content[0].text
            # Extract JSON from response (may be wrapped in markdown)
            if '```json' in content:
                content = content.split('```json')[1].split('```')[0]
            elif '```' in content:
                content = content.split('```')[1].split('```')[0]
            
            result = json.loads(content.strip())
            logger.success('Analyzed text response with AI')
            return result
            
        except Exception as e:
            logger.error(f'Text analysis failed: {str(e)}')
            raise Exception(f"Text analysis failed: {str(e)}")
    
    def synthesize_study_insights(self, study_data: Dict) -> Dict:
        """
        Generate comprehensive study analysis and strategic recommendations.
        
        Args:
            study_data: Complete study data including all responses
        
        Returns:
            Dict with comprehensive analysis
        """
        if not self.openai_client:
            raise ValueError("OpenAI API key not configured")
        
        prompt = f"""You are analyzing a completed consumer research study. Based on all participant responses and data, provide a comprehensive analysis.

STUDY DATA:
{json.dumps(study_data, indent=2)}

Provide a comprehensive JSON analysis with:

1. executive_summary: 3-4 sentence overview of key findings
2. key_insights: array of 7-10 most important discoveries
3. themes: array of objects with theme, frequency, sentiment, description, examples
4. sentiment_analysis: overall percentages, by_segment, trends
5. recommendations: array of 5-7 strategic actions with priority, category, recommendation, rationale, expected_impact
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
            
            result = json.loads(response.choices[0].message.content)
            logger.success('Generated comprehensive study insights')
            return result
            
        except Exception as e:
            logger.error(f'Study synthesis failed: {str(e)}')
            raise Exception(f"Study synthesis failed: {str(e)}")

# Global instance
ai_service = AIService()
```

---

### Step 2.4.3: Create AI API Endpoints

**What to do:**

1. Create `api/src/app/ai.py`:

```python
"""
AI API Routes
"""

from flask import Blueprint, request
from src.services.ai_service import ai_service
from src.utils.response import format_response
from src.utils.logger import logger

bp = Blueprint('ai', __name__)

@bp.route('/suggest-study-design', methods=['POST'])
@format_response
def suggest_study_design():
    """
    Get AI suggestions for study design.
    
    Request body:
    {
        "objective": "Research objective",
        "company_data": {} // optional
    }
    """
    payload = request.get_json(force=True)
    objective = payload.get('objective')
    company_data = payload.get('company_data')
    
    if not objective:
        raise Exception("Objective is required")
    
    suggestions = ai_service.suggest_study_design(objective, company_data)
    return suggestions

@bp.route('/analyze-text', methods=['POST'])
@format_response
def analyze_text():
    """
    Analyze a text response.
    
    Request body:
    {
        "text": "Participant response text",
        "context": "Optional context"
    }
    """
    payload = request.get_json(force=True)
    text = payload.get('text')
    context = payload.get('context')
    
    if not text:
        raise Exception("Text is required")
    
    analysis = ai_service.analyze_text_response(text, context)
    return analysis

@bp.route('/synthesize-study', methods=['POST'])
@format_response
def synthesize_study():
    """
    Generate comprehensive study insights.
    
    Request body:
    {
        "study_data": {} // Complete study data with responses
    }
    """
    payload = request.get_json(force=True)
    study_data = payload.get('study_data')
    
    if not study_data:
        raise Exception("Study data is required")
    
    insights = ai_service.synthesize_study_insights(study_data)
    return insights
```

2. Register in `api/run.py` and add frontend functions.

---

### Step 2.4.4: Integrate AI into Create Study Page

**What to do:**

Update the "AI Suggestion" button in `frontend/src/app/studies/create/page.tsx` to actually call the API:

```typescript
const handleAISuggestion = async () => {
    if (!objective) {
        toast({
            title: "Error",
            description: "Please enter a study objective first",
            variant: "destructive",
        })
        return
    }
    
    try {
        const suggestions = await accessAPI('/ai/suggest-study-design', 'POST', {
            objective,
            company_data: {} // Add if you have company data
        })
        
        // Populate form with suggestions
        if (suggestions.recommended_tasks) {
            const newTasks = suggestions.recommended_tasks.map((task: any) => ({
                taskTypeId: getTaskTypeIdFromString(task.type),
                prompt: task.title,
            }))
            setTasks(newTasks)
        }
        
        if (suggestions.target_participants) {
            setNumParticipants(suggestions.target_participants.toString())
        }
        
        if (suggestions.duration_days) {
            setDuration(suggestions.duration_days.toString())
        }
        
        toast({
            title: "AI Suggestions Generated!",
            description: "Study design suggestions have been applied.",
        })
    } catch (error) {
        console.error('AI suggestion failed:', error)
        toast({
            title: "Error",
            description: "Failed to get AI suggestions. Please try again.",
            variant: "destructive",
        })
    }
}
```

---

## 📦 Phase 2.5: Storage Setup (Day 9)

### Step 2.5.1: Configure Supabase Storage Buckets

**What to do:**

1. Go to Supabase Dashboard → Storage
2. Create these buckets:
   - `study-assets` (Public) - For study images, videos
   - `participant-uploads` (Private) - For participant responses
   - `company-data` (Private) - For company-specific files

3. Set up storage policies in SQL Editor:

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

**Learning Point:** Storage policies control who can read/write files in each bucket.

---

## 🎨 Phase 2.6: Complete Frontend Integration (Days 10-12)

### Step 2.6.1: Update Study Detail Page

**What to do:**

Update `frontend/src/app/studies/[id]/page.tsx` to:
1. Fetch study data from API
2. Fetch and display tasks
3. Fetch and display participants
4. Show response statistics
5. Add ability to add/edit tasks
6. Add ability to invite participants

**Key features to add:**
- Task list with drag-and-drop reordering
- Participant management table
- Response viewer
- Study activation button

---

### Step 2.6.2: Create Participant Response Page

**What to do:**

Create a new page `frontend/src/app/participant/[studyId]/[participantId]/page.tsx` where participants can:
1. View study information
2. Complete tasks in order
3. Upload videos/images
4. Submit responses
5. See progress

This is the participant-facing interface.

---

## ✅ Phase 2 Completion Checklist

Before moving to Phase 3, ensure you have:

- [ ] Tasks API fully functional (CRUD + reorder)
- [ ] Participants API fully functional (CRUD + bulk create)
- [ ] Responses API fully functional (CRUD)
- [ ] AI Service integrated and working
- [ ] Storage buckets configured
- [ ] Create Study page saves to database
- [ ] Study Detail page shows tasks and participants
- [ ] Can add/edit tasks from UI
- [ ] Can invite participants from UI
- [ ] Participant response page works
- [ ] All API endpoints tested with curl/Postman

---

## 🚀 Next Steps: Phase 3

Once Phase 2 is complete, you'll have a fully functional MVP! Phase 3 will add:
- Advanced analytics dashboard
- Real-time collaboration
- Email/WhatsApp distribution
- PDF report generation
- And more!

---

## 📚 Learning Resources

- **OpenAI API**: [platform.openai.com/docs](https://platform.openai.com/docs)
- **Anthropic API**: [docs.anthropic.com](https://docs.anthropic.com)
- **Supabase Storage**: [supabase.com/docs/guides/storage](https://supabase.com/docs/guides/storage)
- **React Hooks**: [react.dev/reference/react](https://react.dev/reference/react)

---

**Ready to start Phase 2? Begin with Step 2.1.1!** 🚀

