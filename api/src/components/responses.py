"""
Responses Component - Business Logic Layer
"""

from src.utils.exception import handle_exception
from src.utils.connectors.supabase import db
from src.utils.logger import logger
from datetime import datetime
import uuid

logger.announcement('Initializing Responses Service', type='info')

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
def create_response(response: dict = None):
    """
    Create a new response for a task.
    
    Args:
        response (dict): Response data including:
            - participant_id (required)
            - task_id (required)
            - response_data (required): JSON object with response content
            - submitted_at (optional, defaults to current time)
    
    Returns:
        str: The ID of the created response
    """
    if not response:
        raise Exception("Response data is required")
    
    # Validate required fields
    if not response.get('participant_id'):
        raise Exception("participant_id is required")
    if not response.get('task_id'):
        raise Exception("task_id is required")
    if not response.get('response_data'):
        raise Exception("response_data is required")
    
    # Validate UUID format
    _validate_uuid(response.get('participant_id'), "participant_id")
    _validate_uuid(response.get('task_id'), "task_id")
    
    # Add timestamps
    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    response['created_at'] = current_time
    
    # Set submitted_at if not provided
    if 'submitted_at' not in response:
        response['submitted_at'] = current_time
    
    response_id = db.create(table='responses', data=response)
    logger.success(f'Created response with id: {response_id}')
    return response_id

@handle_exception
def read_responses(query: dict = None):
    """
    Read responses with optional filters.
    
    Args:
        query (dict): Optional filters such as:
            - id: Filter by response ID
            - participant_id: Filter by participant
            - task_id: Filter by task
    
    Returns:
        list: List of response dictionaries
    """
    if query is None:
        query = {}
    
    # Validate UUID format for id, participant_id, and task_id if present in query
    if 'id' in query:
        _validate_uuid(query['id'], "id")
    if 'participant_id' in query:
        _validate_uuid(query['participant_id'], "participant_id")
    if 'task_id' in query:
        _validate_uuid(query['task_id'], "task_id")
    
    responses = db.read(table='responses', query=query)
    logger.info(f'Retrieved {len(responses)} responses')
    return responses

@handle_exception
def update_response(response_id: str, data: dict = None):
    """
    Update an existing response.
    
    Args:
        response_id (str): The ID of the response to update
        data (dict): Fields to update (response_data, submitted_at, etc.)
    
    Returns:
        str: The ID of the updated response
    """
    if not response_id:
        raise Exception("Response ID is required")
    
    # Validate UUID format
    _validate_uuid(response_id, "response_id")
    
    if not data:
        raise Exception("Update data is required")
    
    # Validate UUID format for participant_id or task_id if being updated
    if 'participant_id' in data:
        _validate_uuid(data['participant_id'], "participant_id")
    if 'task_id' in data:
        _validate_uuid(data['task_id'], "task_id")
    
    # Update submitted_at if response_data is being updated (assuming new submission)
    if 'response_data' in data and 'submitted_at' not in data:
        data['submitted_at'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    updated_id = db.update(table='responses', query={'id': response_id}, data=data)
    logger.success(f'Updated response with id: {updated_id}')
    return updated_id

@handle_exception
def delete_response(response_id: str):
    """
    Delete a response.
    
    Args:
        response_id (str): The ID of the response to delete
    
    Returns:
        str: The ID of the deleted response
    """
    if not response_id:
        raise Exception("Response ID is required")
    
    # Validate UUID format
    _validate_uuid(response_id, "response_id")
    
    deleted_id = db.delete(table='responses', query={'id': response_id})
    logger.success(f'Deleted response with id: {deleted_id}')
    return deleted_id

logger.announcement('Initialized Responses Service', type='success')
