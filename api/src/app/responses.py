"""
Responses API Routes
"""

from flask import Blueprint, request
from src.components.responses import (
    create_response, read_responses, update_response, delete_response
)
from src.utils.response import format_response
from src.utils.logger import logger
import uuid

bp = Blueprint('responses', __name__)

@bp.route('/create', methods=['POST'])
@format_response
def create():
    """
    Create a new response.
    
    Request body:
    {
        "response": {
            "participant_id": "uuid",
            "task_id": "uuid",
            "response_data": {
                "text": "Response text",
                "videoUrl": "https://...",
                "images": ["url1", "url2"],
                ...
            },
            "submitted_at": "2024-01-01 12:00:00" // optional
        }
    }
    """
    logger.info('Received request to create response')
    payload = request.get_json(force=True)
    response_data = payload.get('response', {})
    
    # Generate ID if not provided
    if 'id' not in response_data:
        response_data['id'] = str(uuid.uuid4())
    
    response_id = create_response(response=response_data)
    return {'id': response_id, 'message': 'Response created successfully'}

@bp.route('/read', methods=['GET'])
@format_response
def read():
    """
    Read responses with optional filters.
    
    Query parameters:
    - id: Filter by response ID
    - participant_id: Filter by participant
    - task_id: Filter by task
    """
    logger.info('Received request to read responses')
    query = {}
    
    response_id = request.args.get('id', None)
    participant_id = request.args.get('participant_id', None)
    task_id = request.args.get('task_id', None)
    
    if response_id:
        query['id'] = response_id
    if participant_id:
        query['participant_id'] = participant_id
    if task_id:
        query['task_id'] = task_id
    
    responses = read_responses(query=query)
    return responses

@bp.route('/update', methods=['POST'])
@format_response
def update():
    """
    Update an existing response.
    
    Request body:
    {
        "id": "response-uuid",
        "data": {
            "response_data": {
                "text": "Updated response text",
                ...
            },
            "submitted_at": "2024-01-01 12:00:00"
            ...
        }
    }
    """
    logger.info('Received request to update response')
    payload = request.get_json(force=True)
    response_id = payload.get('id')
    update_data = payload.get('data', {})
    
    if not response_id:
        raise Exception("Response ID is required")
    
    updated_id = update_response(response_id=response_id, data=update_data)
    return {'id': updated_id, 'message': 'Response updated successfully'}

@bp.route('/delete', methods=['POST'])
@format_response
def delete():
    """
    Delete a response.
    
    Request body:
    {
        "id": "response-uuid"
    }
    """
    logger.info('Received request to delete response')
    payload = request.get_json(force=True)
    response_id = payload.get('id')
    
    if not response_id:
        raise Exception("Response ID is required")
    
    deleted_id = delete_response(response_id=response_id)
    return {'id': deleted_id, 'message': 'Response deleted successfully'}
