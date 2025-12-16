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