"""
Public Participant API Routes

These endpoints are publicly accessible (no JWT required) and allow
participants to access their studies and submit responses using their access code.
"""

from flask import Blueprint, request
from src.components.participants import get_participant_by_access_code, update_participant, create_participant, read_participants
from src.components.studies import read_studies
from src.components.tasks import read_tasks
from src.components.responses import create_response, read_responses
from src.utils.response import format_response
from src.utils.logger import logger
import uuid
import os

bp = Blueprint('participant_public', __name__)

def verify_participant_access(access_code: str, study_id: str = None):
    """
    Verify participant access code and return participant data.
    Raises exception if invalid.
    """
    if not access_code:
        raise Exception("Access code is required")
    
    participant = get_participant_by_access_code(access_code=access_code, study_id=study_id)
    if not participant:
        raise Exception("Invalid access code")
    
    return participant

@bp.route('/validate-study-code', methods=['POST'])
@format_response
def validate_study_code():
    """
    Validate a study access code (public, for registration form validation).
    
    Request body:
    {
        "study_id": "uuid",
        "study_access_code": "ABC123XYZW"
    }
    
    Returns:
    {
        "valid": true/false,
        "study": {...} // if valid
    }
    """
    logger.info('Public request to validate study code')
    payload = request.get_json(force=True)
    study_id = payload.get('study_id')
    study_access_code = payload.get('study_access_code')
    
    if not study_id:
        raise Exception("Study ID is required")
    if not study_access_code:
        raise Exception("Study access code is required")
    
    # Get study
    studies = read_studies(query={'id': study_id})
    if not studies or len(studies) == 0:
        return {'valid': False, 'message': 'Study not found'}
    
    study = studies[0]
    
    # Validate study access code
    if study.get('study_access_code') != study_access_code:
        return {'valid': False, 'message': 'Invalid study access code'}
    
    # Check if study is accessible (active or draft)
    if study.get('status') not in ['active', 'draft']:
        return {'valid': False, 'message': 'Study is not currently accepting participants'}
    
    return {
        'valid': True,
        'study': {
            'id': study.get('id'),
            'name': study.get('name'),
            'status': study.get('status')
        }
    }

@bp.route('/study/<study_id>', methods=['GET'])
@format_response
def get_study_by_id(study_id: str):
    """
    Get study details by ID (public access with access code).
    
    Query parameters:
    - access_code: Participant's access code (required)
    
    Returns:
    {
        "study": {...},
        "participant": {...},
        "tasks": [...]
    }
    """
    logger.info(f'Public request to get study: {study_id}')
    access_code = request.args.get('access_code')
    
    # Verify participant access
    participant = verify_participant_access(access_code=access_code, study_id=study_id)
    
    # Get study
    studies = read_studies(query={'id': study_id})
    if not studies or len(studies) == 0:
        raise Exception("Study not found")
    
    study = studies[0]
    
    # Check if participant belongs to this study
    if participant.get('study_id') != study_id:
        raise Exception("Participant does not belong to this study")
    
    # Only return study if it's active (participants can't access draft/completed studies)
    if study.get('status') not in ['active', 'draft']:
        raise Exception("Study is not accessible")
    
    # Get tasks for this study
    tasks = read_tasks(query={'study_id': study_id})
    tasks = sorted(tasks, key=lambda x: x.get('order_index', 0))
    
    # Get participant's existing responses
    responses = read_responses(query={'participant_id': participant['id']})
    
    # Mark which tasks are completed
    completed_task_ids = {r.get('task_id') for r in responses}
    for task in tasks:
        task['completed'] = task.get('id') in completed_task_ids
    
    return {
        'study': study,
        'participant': participant,
        'tasks': tasks,
        'responses': responses
    }

@bp.route('/task/<task_id>', methods=['GET'])
@format_response
def get_task_by_id(task_id: str):
    """
    Get task details by ID (public access with access code).
    
    Query parameters:
    - access_code: Participant's access code (required)
    - study_id: Study ID (optional, for verification)
    
    Returns:
    {
        "task": {...},
        "participant": {...},
        "existing_response": {...} // if participant already responded
    }
    """
    logger.info(f'Public request to get task: {task_id}')
    access_code = request.args.get('access_code')
    study_id = request.args.get('study_id')
    
    # Verify participant access
    participant = verify_participant_access(access_code=access_code, study_id=study_id)
    
    # Get task
    tasks = read_tasks(query={'id': task_id})
    if not tasks or len(tasks) == 0:
        raise Exception("Task not found")
    
    task = tasks[0]
    
    # Verify task belongs to participant's study
    if participant.get('study_id') != task.get('study_id'):
        raise Exception("Task does not belong to participant's study")
    
    # Get existing response if any
    responses = read_responses(query={
        'participant_id': participant['id'],
        'task_id': task_id
    })
    existing_response = responses[0] if responses else None
    
    return {
        'task': task,
        'participant': participant,
        'existing_response': existing_response
    }

@bp.route('/submit-response', methods=['POST'])
@format_response
def submit_response():
    """
    Submit a response to a task (public access with access code).
    
    Request body:
    {
        "access_code": "PARTICIPANT_ACCESS_CODE",
        "task_id": "uuid",
        "response_data": {
            "text": "...",
            "videoUrl": "...",
            "images": [...],
            ...
        }
    }
    
    Returns:
    {
        "id": "response-uuid",
        "message": "Response submitted successfully"
    }
    """
    logger.info('Public request to submit response')
    payload = request.get_json(force=True)
    access_code = payload.get('access_code')
    task_id = payload.get('task_id')
    response_data = payload.get('response_data', {})
    
    if not access_code:
        raise Exception("Access code is required")
    if not task_id:
        raise Exception("Task ID is required")
    if not response_data:
        raise Exception("Response data is required")
    
    # Verify participant access
    participant = verify_participant_access(access_code=access_code)
    
    # Get task to verify it belongs to participant's study
    tasks = read_tasks(query={'id': task_id})
    if not tasks or len(tasks) == 0:
        raise Exception("Task not found")
    
    task = tasks[0]
    if participant.get('study_id') != task.get('study_id'):
        raise Exception("Task does not belong to participant's study")
    
    # Create response
    response_payload = {
        'id': str(uuid.uuid4()),
        'participant_id': participant['id'],
        'task_id': task_id,
        'response_data': response_data
    }
    
    response_id = create_response(response=response_payload)
    
    # Update participant status to 'started' if still 'invited'
    if participant.get('status') == 'invited':
        update_participant(participant_id=participant['id'], data={'status': 'started'})
    
    logger.success(f'Participant {participant["id"]} submitted response for task {task_id}')
    return {'id': response_id, 'message': 'Response submitted successfully'}

@bp.route('/my-responses', methods=['GET'])
@format_response
def get_my_responses():
    """
    Get all responses for the authenticated participant.
    
    Query parameters:
    - access_code: Participant's access code (required)
    - study_id: Study ID (optional, to filter by study)
    
    Returns:
    [
        {
            "id": "uuid",
            "task_id": "uuid",
            "response_data": {...},
            "submitted_at": "...",
            ...
        },
        ...
    ]
    """
    logger.info('Public request to get participant responses')
    access_code = request.args.get('access_code')
    study_id = request.args.get('study_id')
    
    # Verify participant access
    participant = verify_participant_access(access_code=access_code, study_id=study_id)
    
    # Get responses
    query = {'participant_id': participant['id']}
    if study_id:
        # Verify study_id matches participant's study
        if participant.get('study_id') != study_id:
            raise Exception("Study ID does not match participant's study")
    
    responses = read_responses(query=query)
    return responses

@bp.route('/upload-url', methods=['POST'])
@format_response
def get_upload_url():
    """
    Generate a signed upload URL for participant file uploads.
    
    Request body:
    {
        "access_code": "PARTICIPANT_ACCESS_CODE",
        "filename": "video.mp4",
        "file_type": "video/mp4" // or "image/jpeg", etc.
    }
    
    Returns:
    {
        "upload_url": "https://signed-url...",
        "file_path": "participant-uploads/{study_id}/{participant_id}/{filename}",
        "expires_in": 3600
    }
    
    Note: For now, this returns instructions for frontend direct upload.
    In production, you'd generate a signed URL from Supabase Storage API.
    """
    logger.info('Public request to get upload URL')
    payload = request.get_json(force=True)
    access_code = payload.get('access_code')
    filename = payload.get('filename')
    file_type = payload.get('file_type', 'application/octet-stream')
    
    if not access_code:
        raise Exception("Access code is required")
    if not filename:
        raise Exception("Filename is required")
    
    # Verify participant access
    participant = verify_participant_access(access_code=access_code)
    
    # Generate file path
    import uuid
    import os
    from datetime import datetime
    
    # Create a unique filename to avoid conflicts
    file_ext = os.path.splitext(filename)[1] or '.tmp'
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = f"participant-uploads/{participant['study_id']}/{participant['id']}/{unique_filename}"
    
    # In production, you would:
    # 1. Use Supabase Storage API to generate a signed upload URL
    # 2. Set expiration (e.g., 1 hour)
    # 3. Return the signed URL
    
    # For now, return the path and let frontend handle direct upload
    # The frontend should use Supabase client to upload directly
    return {
        'file_path': file_path,
        'filename': unique_filename,
        'bucket': 'participant-uploads',
        'message': 'Use frontend Supabase client to upload to this path'
    }

@bp.route('/join-study', methods=['POST'])
@format_response
def join_study():
    """
    Join a study by registering with email and demographics (public, uses study_access_code).
    
    Request body:
    {
        "study_id": "uuid",
        "study_access_code": "ABC123XYZW",
        "email": "participant@example.com",
        "demographics": {
            "age": 30,
            "gender": "female",
            "location": "New York"
        } // optional
    }
    
    Returns:
    {
        "participant_id": "uuid",
        "access_code": "PARTICIPANT_ACCESS_CODE",
        "study_id": "uuid",
        "message": "Successfully registered for study"
    }
    """
    logger.info('Public request to join study')
    payload = request.get_json(force=True)
    study_id = payload.get('study_id')
    study_access_code = payload.get('study_access_code')
    email = payload.get('email')
    demographics = payload.get('demographics', {})
    
    if not study_id:
        raise Exception("Study ID is required")
    if not study_access_code:
        raise Exception("Study access code is required")
    if not email:
        raise Exception("Email is required")
    
    # Get study and validate access code
    studies = read_studies(query={'id': study_id})
    if not studies or len(studies) == 0:
        raise Exception("Study not found")
    
    study = studies[0]
    
    # Validate study access code
    if study.get('study_access_code') != study_access_code:
        raise Exception("Invalid study access code")
    
    # Check if study is accessible (active or draft)
    if study.get('status') not in ['active', 'draft']:
        raise Exception("Study is not accessible")
    
    # Check if participant already exists for this study (by email)
    existing_participants = read_participants(query={
        'study_id': study_id,
        'contact': email
    })
    
    if existing_participants and len(existing_participants) > 0:
        # Participant already registered, return existing participant
        participant = existing_participants[0]
        logger.info(f'Participant already registered: {participant["id"]}')
        return {
            'participant_id': participant['id'],
            'access_code': participant.get('access_code'),
            'study_id': study_id,
            'message': 'You are already registered for this study',
            'existing': True
        }
    
    # Create new participant
    participant_data = {
        'study_id': study_id,
        'contact': email,
        'demographics': demographics,
        'status': 'invited'
    }
    
    participant_id = create_participant(participant=participant_data)
    
    # Get the created participant to return access_code
    created_participants = read_participants(query={'id': participant_id})
    if not created_participants or len(created_participants) == 0:
        raise Exception("Failed to create participant")
    
    participant = created_participants[0]
    
    logger.success(f'Participant {email} registered for study {study_id}')
    return {
        'participant_id': participant_id,
        'access_code': participant.get('access_code'),
        'study_id': study_id,
        'message': 'Successfully registered for study',
        'existing': False
    }
