# Echo Platform - Phase 2 Learning Guide
## Completing MVP Features

## 🎯 Overview

Congratulations on completing Phase 1! You now have:
- ✅ Database setup and schema
- ✅ Backend foundation with Flask
- ✅ Studies CRUD API
- ✅ Basic frontend dashboard
- ✅ Frontend-backend connection

**Phase 2 Goal:** Complete all non-AI MVP features first. We'll skip AI implementation for now and add it at the very end once all core functionalities are working.

**Important:** According to the project analysis, backend APIs for Tasks, Participants, and Responses may already exist. We'll verify and complete the frontend integration first, then add AI capabilities at the end.

---

## 📋 Phase 2 Checklist

### What We'll Build (In Order):
1. **Tasks Management** - Verify backend, complete frontend integration for task management
2. **Participants Management** - Verify backend, complete frontend integration for participant management
3. **Response Collection** - Verify backend, complete frontend integration for response handling
4. **Storage Setup** - Configure Supabase Storage for media files (videos, images)
5. **Complete Frontend Integration** - Connect all UI components to APIs, create participant interface
6. **AI Service** ⏸️ - **SKIPPED FOR NOW** - Will be implemented at the end (Phase 2.6)

---

## 🗄️ Phase 2.1: Tasks Management - Verify & Complete Frontend Integration (Days 1-2)

### Step 2.1.1: Verify Backend API Exists

**Why?** Before building frontend, we need to ensure the backend is ready.

**What to do:**

1. Check if `api/src/components/tasks.py` exists and has all CRUD functions
2. Check if `api/src/app/tasks.py` exists and has all API routes
3. Verify the tasks blueprint is registered in `api/run.py`

**If backend already exists:** Great! Skip to Step 2.1.6 (Frontend Integration)
**If backend doesn't exist:** Follow Steps 2.1.2-2.1.5 below to create it

---

### Step 2.1.2: Understand Tasks

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

### Step 2.1.3: Create Task Model (Skip if already exists)

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

### Step 2.1.4: Create Task Component (Business Logic) - Skip if already exists

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

### Step 2.1.5: Create Task API Routes (Skip if already exists)

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

### Step 2.1.5b: Test Tasks API (Verify Backend Works)

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

3. **Get a valid study_id first** (you need a valid UUID format):
   
   Option A: Create a study first to get a valid UUID:
   ```bash
   curl -X POST http://localhost:5000/studies/create \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "study": {
         "name": "Test Study",
         "objective": "Testing tasks API",
         "organization_id": "YOUR_ORG_ID",
         "created_by": "YOUR_USER_ID"
       }
     }'
   ```
   This will return a study with an `id` field - use that UUID as your `study_id`.
   
   Option B: List existing studies to get a study_id:
   ```bash
   curl -X GET "http://localhost:5000/studies/read" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

4. Create a task (replace `YOUR_STUDY_ID` with a valid UUID and `YOUR_TOKEN`):
   ```bash
   curl -X POST http://localhost:5000/tasks/create \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "task": {
         "study_id": "451ac7d9-ac27-4229-9537-22214779443a",
         "type": "discussion",
         "title": "What are your thoughts on our product?",
         "instructions": "Please share your honest feedback"
       }
     }'
   ```
   
   **Important:** `study_id` must be a valid UUID format (e.g., `550e8400-e29b-41d4-a716-446655440000`). 
   Using invalid formats like `"12345643"` will result in an error.

5. Read tasks for a study:
   ```bash
   curl -X GET "http://localhost:5000/tasks/read?study_id=451ac7d9-ac27-4229-9537-22214779443a" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

**Learning Point:** 
- UUIDs must be in the format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- Always use valid UUIDs from your database (create a study first, or use an existing one)
- Test each endpoint before building frontend to catch errors early

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

### Step 2.1.7: Update Create Study Page to Save Tasks (CRITICAL)

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

## 👥 Phase 2.2: Participants Management - Verify & Complete Frontend Integration (Days 3-4)

### Step 2.2.1: Verify Backend API Exists

**What to do:**

1. Check if `api/src/components/participants.py` exists
2. Check if `api/src/app/participants.py` exists  
3. Verify participants blueprint is registered in `api/run.py`

**If backend exists:** Skip to Step 2.2.4 (Frontend Integration)
**If backend doesn't exist:** Follow the steps below

---

### Step 2.2.2: Understand Participants

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

### Step 2.2.3: Create Participant Component (Skip if already exists)

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

### Step 2.2.4: Create Participant API Routes (Skip if already exists)

**What to do:**

1. Create `api/src/app/participants.py` (similar structure to tasks.py)

2. Register in `api/run.py`

3. Add frontend API functions in `frontend/src/utils/api.ts`

**Exercise:** Follow the same pattern as tasks to create the participants API. This reinforces the pattern!

---

### Step 2.2.5: Frontend Integration for Participants

**What to do:**

1. Add participant API functions to `frontend/src/utils/api.ts`:
```typescript
export async function createParticipant(participantData: any) {
    return await accessAPI('/participants/create', 'POST', { participant: participantData });
}

export async function getParticipants(filters?: { id?: string; study_id?: string; status?: string }) {
    const queryParams = new URLSearchParams();
    if (filters?.id) queryParams.append('id', filters.id);
    if (filters?.study_id) queryParams.append('study_id', filters.study_id);
    if (filters?.status) queryParams.append('status', filters.status);
    
    const queryString = queryParams.toString();
    const url = `/participants/read${queryString ? '?' + queryString : ''}`;
    return await accessAPI(url, 'GET');
}

export async function bulkCreateParticipants(studyId: string, contacts: string[], demographics?: any) {
    return await accessAPI('/participants/bulk-create', 'POST', { 
        study_id: studyId, 
        contacts, 
        demographics 
    });
}
```

2. Update Study Detail page to show and manage participants
3. Add participant invitation UI to study detail page

---

## 📝 Phase 2.3: Response Collection - Verify & Complete Frontend Integration (Days 5-6)

### Step 2.3.1: Verify Backend API Exists

**What to do:**

1. Check if `api/src/components/responses.py` exists
2. Check if `api/src/app/responses.py` exists
3. Verify responses blueprint is registered in `api/run.py`

**If backend exists:** Skip to Step 2.3.3 (Frontend Integration)
**If backend doesn't exist:** Follow Step 2.3.2 below

---

### Step 2.3.2: Understand Responses

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

### Step 2.3.3: Create Response Component & API (Skip if already exists)

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

### Step 2.3.4: Frontend Integration for Responses

**What to do:**

1. Add response API functions to `frontend/src/utils/api.ts`:
```typescript
export async function createResponse(responseData: any) {
    return await accessAPI('/responses/create', 'POST', { response: responseData });
}

export async function getResponses(filters?: { 
    id?: string; 
    participant_id?: string; 
    task_id?: string;
    study_id?: string;
}) {
    const queryParams = new URLSearchParams();
    if (filters?.id) queryParams.append('id', filters.id);
    if (filters?.participant_id) queryParams.append('participant_id', filters.participant_id);
    if (filters?.task_id) queryParams.append('task_id', filters.task_id);
    if (filters?.study_id) queryParams.append('study_id', filters.study_id);
    
    const queryString = queryParams.toString();
    const url = `/responses/read${queryString ? '?' + queryString : ''}`;
    return await accessAPI(url, 'GET');
}
```

2. Create participant response interface (see Phase 2.5.2)
3. Add response viewing to study detail page

---

## 📦 Phase 2.4: Storage Setup (Day 7)

**Why Now?** We need storage configured before building the participant response interface that handles file uploads.

### Step 2.4.1: Configure Supabase Storage Buckets

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

### Step 2.4.2: Add File Upload Utility Functions

**What to do:**

Create a utility for handling file uploads to Supabase Storage. You can add this to `frontend/src/utils/storage.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function uploadFile(
  bucket: string,
  file: File,
  path: string
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return publicUrl
}
```

---

**Note:** The AI Service section has been moved to Phase 2.6 (the end). Continue with Phase 2.5 below.

---

## 🎨 Phase 2.5: Complete Frontend Integration (Days 8-10)

**What to do:**

1. If not exists, create `api/src/app/ai.py`:

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

2. Register AI blueprint in `api/run.py`:
```python
# Add import
from src.app import users, studies, organizations, tasks, participants, responses, ai

# Add registration
app.register_blueprint(ai.bp, url_prefix='/ai')
```

3. Add frontend API functions to `frontend/src/utils/api.ts`:
```typescript
export async function getAISuggestions(objective: string, companyData?: any) {
    return await accessAPI('/ai/suggest-study-design', 'POST', { 
        objective, 
        company_data: companyData 
    });
}

export async function analyzeTextResponse(text: string, context?: string) {
    return await accessAPI('/ai/analyze-text', 'POST', { text, context });
}

export async function synthesizeStudyInsights(studyData: any) {
    return await accessAPI('/ai/synthesize-study', 'POST', { study_data: studyData });
}
```

---

### Step 2.6.4: Integrate AI into Create Study Page (Optional)

**What to do:**

Update the "AI Suggestion" button in `frontend/src/app/studies/create/page.tsx` to call the AI API (if implemented):

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

**Note:** If you haven't implemented AI service yet, you can disable or hide the AI suggestion button in the UI until later.

---

## ✅ Phase 2 Completion Checklist

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

## 🎨 Phase 2.5: Complete Frontend Integration (Days 8-10)

### Step 2.5.1: Update Study Detail Page

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

### Step 2.5.2: Create Participant Response Page

**What to do:**

Create a new page `frontend/src/app/participant/[studyId]/[participantId]/page.tsx` where participants can:
1. View study information
2. Complete tasks in order
3. Upload videos/images
4. Submit responses
5. See progress

This is the participant-facing interface.

**Key features to implement:**
- Video recording/upload for camera tasks
- Image upload for gallery/collage tasks
- Text input for discussion/fill_blanks tasks
- Drag-and-drop for classification tasks
- Progress indicator (how many tasks completed)
- Save draft functionality
- Submit all responses

---

## 🤖 Phase 2.6: AI Service Integration (Days 11-12) - **OPTIONAL, DO THIS LAST**

**Note:** AI functionality is being implemented at the end. You can skip this phase entirely if you want to focus on core functionality first. The platform will work without AI - it just won't have AI-powered suggestions and analysis.

### Step 2.6.1: Set Up AI API Keys (Optional)

**What to do:**

1. Decide which AI provider to use (see `AI_PROVIDER_COMPARISON.md` and `RESPONSE_PROCESSING_STRATEGY.md`)
2. Get API key(s) from your chosen provider:
   - OpenAI: [platform.openai.com](https://platform.openai.com)
   - Anthropic: [console.anthropic.com](https://console.anthropic.com) (optional)
   - Hugging Face: [huggingface.co](https://huggingface.co) (free tier available)
3. Add to `api/.env`:
```env
OPENAI_API_KEY=sk-... # Optional
ANTHROPIC_API_KEY=sk-ant-... # Optional
HUGGINGFACE_API_KEY=... # Optional
```

**Important:** You don't need AI to complete the MVP. This is optional functionality that can be added later.

---

### Step 2.6.2: Create AI Service (Optional)

**Note:** The AI service file may already exist at `api/src/services/ai_service.py`. Check if it's already implemented.

**What to do:**

1. If not exists, create `api/src/services/ai_service.py` with the AI service implementation (see Phase 2.4.2 in the original guide or refer to `RESPONSE_PROCESSING_STRATEGY.md` for implementation details).

---

### Step 2.6.3: Create AI API Endpoints (Optional)

**What to do:**

1. If not exists, create `api/src/app/ai.py` with AI API routes (study design suggestions, text analysis, study synthesis).

2. Register AI blueprint in `api/run.py`:
```python
# Add import
from src.app import users, studies, organizations, tasks, participants, responses, ai

# Add registration
app.register_blueprint(ai.bp, url_prefix='/ai')
```

3. Add frontend API functions to `frontend/src/utils/api.ts`:
```typescript
export async function getAISuggestions(objective: string, companyData?: any) {
    return await accessAPI('/ai/suggest-study-design', 'POST', { 
        objective, 
        company_data: companyData 
    });
}

export async function analyzeTextResponse(text: string, context?: string) {
    return await accessAPI('/ai/analyze-text', 'POST', { text, context });
}

export async function synthesizeStudyInsights(studyData: any) {
    return await accessAPI('/ai/synthesize-study', 'POST', { study_data: studyData });
}
```

---

### Step 2.6.4: Integrate AI into Create Study Page (Optional)

**What to do:**

Update the "AI Suggestion" button in `frontend/src/app/studies/create/page.tsx` to call the AI API (if implemented). See the original Phase 2.4.4 for detailed implementation.

**Note:** If you haven't implemented AI service yet, you can disable or hide the AI suggestion button in the UI until later.

---

## ✅ Phase 2 Completion Checklist

Before considering MVP complete, ensure you have:

**Core Functionality (REQUIRED):**
- [ ] Tasks API fully functional (CRUD + reorder)
- [ ] Participants API fully functional (CRUD + bulk create)
- [ ] Responses API fully functional (CRUD)
- [ ] Storage buckets configured
- [ ] Create Study page saves study AND tasks to database
- [ ] Study Detail page shows tasks and participants
- [ ] Can add/edit/delete tasks from UI
- [ ] Can invite participants from UI (bulk import supported)
- [ ] Participant response page works (all task types)
- [ ] File upload works (videos, images)
- [ ] Response viewing in study detail page
- [ ] All API endpoints tested with curl/Postman

**AI Functionality (OPTIONAL - Can be added later):**
- [ ] AI Service implemented (optional)
- [ ] AI suggestions work in create study page (optional)
- [ ] Text response analysis works (optional)
- [ ] Study insights synthesis works (optional)

---

## 🚀 Next Steps: Phase 3

Once Phase 2 core functionality is complete, you'll have a fully functional MVP that works without AI! Phase 3 will add:
- Advanced analytics dashboard
- Real-time collaboration
- Email/WhatsApp distribution
- PDF report generation
- Enhanced AI features (if you skipped Phase 2.6)
- And more!

**Note:** You can continue building Phase 3 features even if you haven't implemented AI yet. The platform is fully functional for research studies without AI - it just provides manual workflows instead of AI-assisted ones.

---

## 📚 Learning Resources

- **Supabase Storage**: [supabase.com/docs/guides/storage](https://supabase.com/docs/guides/storage)
- **React Hooks**: [react.dev/reference/react](https://react.dev/reference/react)
- **File Uploads in React**: [react-dropzone.js.org](https://react-dropzone.js.org/)
- **AI Provider Comparison**: See `AI_PROVIDER_COMPARISON.md` and `RESPONSE_PROCESSING_STRATEGY.md` (when ready for AI)

---

## ⚠️ Important Reminders

1. **AI is Optional:** You don't need AI to have a working MVP. Focus on core functionality first.
2. **Verify Backend First:** Check if backend APIs already exist before creating them from scratch.
3. **Test as You Go:** Test each feature before moving to the next.
4. **Frontend Integration is Critical:** The backend APIs are useless without frontend integration.

---

**Ready to start Phase 2? Begin with Step 2.1.1 - Verify Backend!** 🚀

