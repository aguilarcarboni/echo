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
    task_type = task.get('type')
    if task_type not in valid_types:
        raise Exception(f"Invalid task type. Must be one of: {', '.join(valid_types)}")
    
    # Validate task-specific fields based on type
    if task_type == 'classification':
        if 'items' in task and task['items'] is not None:
            if not isinstance(task['items'], list):
                raise Exception("items must be an array for classification tasks")
            if len(task['items']) == 0:
                raise Exception("items array cannot be empty for classification tasks")
            for item in task['items']:
                if not isinstance(item, dict):
                    raise Exception("Each item in items array must be an object")
                if 'id' not in item or 'label' not in item:
                    raise Exception("Each item must have 'id' and 'label' fields")
    
    if task_type == 'collage':
        if 'layout' in task and task['layout'] is not None:
            if not isinstance(task['layout'], dict):
                raise Exception("layout must be an object for collage tasks")
            layout = task['layout']
            if layout.get('type') != 'grid':
                raise Exception("layout.type must be 'grid' for collage tasks")
            if 'rows' not in layout or 'cols' not in layout:
                raise Exception("layout must have 'rows' and 'cols' fields")
            if not isinstance(layout.get('rows'), int) or not isinstance(layout.get('cols'), int):
                raise Exception("layout.rows and layout.cols must be integers")
            if layout.get('rows', 0) < 1 or layout.get('cols', 0) < 1:
                raise Exception("layout.rows and layout.cols must be at least 1")
    
    if task_type == 'fill_blanks':
        if 'template' in task and task['template'] is not None:
            if not isinstance(task['template'], str):
                raise Exception("template must be a string for fill_blanks tasks")
            if len(task['template'].strip()) == 0:
                raise Exception("template cannot be empty for fill_blanks tasks")
            # Check for at least one placeholder
            if '____' not in task['template']:
                raise Exception("template must contain at least one placeholder (____) for fill_blanks tasks")
    
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
    
    # Move task-specific configuration fields into config JSONB column
    config = {}
    if task_type == 'classification' and 'items' in task:
        config['items'] = task.pop('items')
    elif task_type == 'collage' and 'layout' in task:
        config['layout'] = task.pop('layout')
    elif task_type == 'fill_blanks' and 'template' in task:
        config['template'] = task.pop('template')
    
    # Only add config if it has content
    if config:
        task['config'] = config
    
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
    
    # Extract config fields for backward compatibility
    for task in tasks:
        config = task.get('config')
        if config:
            # Extract items, template, layout from config if they exist
            if 'items' in config:
                task['items'] = config['items']
            if 'template' in config:
                task['template'] = config['template']
            if 'layout' in config:
                task['layout'] = config['layout']
    
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
        task_type = data['type']
        if task_type not in valid_types:
            raise Exception(f"Invalid task type. Must be one of: {', '.join(valid_types)}")
        
        # Validate task-specific fields based on type
        if task_type == 'classification':
            if 'items' in data and data['items'] is not None:
                if not isinstance(data['items'], list):
                    raise Exception("items must be an array for classification tasks")
                if len(data['items']) == 0:
                    raise Exception("items array cannot be empty for classification tasks")
                for item in data['items']:
                    if not isinstance(item, dict):
                        raise Exception("Each item in items array must be an object")
                    if 'id' not in item or 'label' not in item:
                        raise Exception("Each item must have 'id' and 'label' fields")
        
        if task_type == 'collage':
            if 'layout' in data and data['layout'] is not None:
                if not isinstance(data['layout'], dict):
                    raise Exception("layout must be an object for collage tasks")
                layout = data['layout']
                if layout.get('type') != 'grid':
                    raise Exception("layout.type must be 'grid' for collage tasks")
                if 'rows' not in layout or 'cols' not in layout:
                    raise Exception("layout must have 'rows' and 'cols' fields")
                if not isinstance(layout.get('rows'), int) or not isinstance(layout.get('cols'), int):
                    raise Exception("layout.rows and layout.cols must be integers")
                if layout.get('rows', 0) < 1 or layout.get('cols', 0) < 1:
                    raise Exception("layout.rows and layout.cols must be at least 1")
        
        if task_type == 'fill_blanks':
            if 'template' in data and data['template'] is not None:
                if not isinstance(data['template'], str):
                    raise Exception("template must be a string for fill_blanks tasks")
                if len(data['template'].strip()) == 0:
                    raise Exception("template cannot be empty for fill_blanks tasks")
                # Check for at least one placeholder
                if '____' not in data['template']:
                    raise Exception("template must contain at least one placeholder (____) for fill_blanks tasks")
    
    # Get existing task to determine type if not being updated
    existing_tasks = db.read(table='tasks', query={'id': task_id})
    if not existing_tasks:
        raise Exception(f"Task with id {task_id} not found")
    existing_task = existing_tasks[0]
    task_type = data.get('type', existing_task.get('type'))
    
    # Move task-specific configuration fields into config JSONB column
    config_updates = {}
    if 'items' in data:
        if task_type == 'classification':
            config_updates['items'] = data.pop('items')
        else:
            # If type changed away from classification, remove items
            config_updates['items'] = None
    if 'layout' in data:
        if task_type == 'collage':
            config_updates['layout'] = data.pop('layout')
        else:
            # If type changed away from collage, remove layout
            config_updates['layout'] = None
    if 'template' in data:
        if task_type == 'fill_blanks':
            config_updates['template'] = data.pop('template')
        else:
            # If type changed away from fill_blanks, remove template
            config_updates['template'] = None
    
    # Handle config updates - merge with existing config if it exists
    if config_updates:
        existing_config = existing_task.get('config') or {}
        # Update only the fields that are being changed
        for key, value in config_updates.items():
            if value is not None:
                existing_config[key] = value
            elif key in existing_config:
                del existing_config[key]
        data['config'] = existing_config if existing_config else None
    
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