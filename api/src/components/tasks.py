"""
Tasks Component - Business Logic Layer
"""

from src.utils.exception import handle_exception
from src.utils.connectors.supabase import db
from src.utils.logger import logger
from datetime import datetime
import uuid

logger.announcement('Initializing Tasks Service', type='info')

def _validate_uuid(value: str, field_name: str = "ID"):
    """
    Validate that a string is a valid UUID format.
    
    Args:
        value: The value to validate
        field_name: Name of the field for error messages
    
    Raises:
        Exception: If value is not a valid UUID format
    """
    if not value:
        return
    
    try:
        uuid.UUID(str(value))
    except (ValueError, TypeError):
        raise Exception(f"Invalid {field_name} format. Expected a valid UUID (e.g., '550e8400-e29b-41d4-a716-446655440000'), got: '{value}'")

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
    
    # Validate UUID format
    _validate_uuid(task.get('study_id'), "study_id")
    
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
    
    # Validate UUID format for id and study_id if present in query
    if 'id' in query:
        _validate_uuid(query['id'], "id")
    if 'study_id' in query:
        _validate_uuid(query['study_id'], "study_id")
    
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
    
    # Validate UUID format
    _validate_uuid(task_id, "task_id")
    
    if not data:
        raise Exception("Update data is required")
    
    # Validate UUID format for study_id if being updated
    if 'study_id' in data:
        _validate_uuid(data['study_id'], "study_id")
    
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
    
    # Validate UUID format
    _validate_uuid(task_id, "task_id")
    
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
    
    # Validate UUID format
    _validate_uuid(study_id, "study_id")
    
    if not task_ids:
        raise Exception("Task IDs list is required")
    
    # Validate all task IDs are valid UUIDs
    for task_id in task_ids:
        _validate_uuid(task_id, "task_id")
    
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