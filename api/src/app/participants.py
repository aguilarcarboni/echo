"""
Participants API Routes
"""

from src.components.participants import create_participant, read_participants, update_participant, delete_participant, bulk_create_participants
from flask import Blueprint, request
from src.utils.response import format_response
from src.utils.logger import logger
import uuid

bp = Blueprint('participants', __name__)

@bp.route('/create', methods=['POST'])
@format_response
def create():
    """
    Create a new participant.
    
    Request body:
    {
        "participant": {
            "study_id": "uuid",
            "contact": "email|phone",
            "demographics": {
                "age": "int",
                "gender": "male|female|other",
                "location": "string"
            },
            "status": "invited|completed|cancelled"
        }
    }
    """
    logger.info('Received request to create participant')
    payload = request.get_json(force=True)
    participant_data = payload.get('participant', {})
    
    # Generate ID if not provided
    if 'id' not in participant_data:
        participant_data['id'] = str(uuid.uuid4())
    
    participant_id = create_participant(participant=participant_data)
    
    return {'id': participant_id, 'message': 'Participant created successfully'}

@bp.route('/read', methods=['GET'])
@format_response
def read():
    """
    Read participants with optional filters.
    
    Query parameters:
    - id: Filter by participant ID
    - study_id: Filter by study ID
    - contact: Filter by contact
    - demographics: Filter by demographics
    - status: Filter by status
    """
    logger.info('Received request to read participants')
    query = {}
    
    participant_id = request.args.get('id', None)
    study_id = request.args.get('study_id', None)
    contact = request.args.get('contact', None)
    demographics = request.args.get('demographics', None)
    status = request.args.get('status', None)
    
    if participant_id:
        query['id'] = participant_id
    if study_id:
        query['study_id'] = study_id
    if contact:
        query['contact'] = contact
    if demographics:
        query['demographics'] = demographics
    if status:
        query['status'] = status
    
    participants = read_participants(query=query)
    return participants

@bp.route('/update', methods=['POST'])
@format_response
def update():
    """
    Update an existing participant.
    
    Request body:
    {
        "id": "participant-uuid",
        "data": {
            "contact": "Updated contact",
            "demographics": {
                "age": "Updated age",
                "gender": "Updated gender",
                "location": "Updated location"
            },
            "status": "Updated status"
            ...
        }
    }
    """
    logger.info('Received request to update participant')
    payload = request.get_json(force=True)
    participant_id = payload.get('id')
    update_data = payload.get('data', {})
    
    if not participant_id:
        raise Exception("Participant ID is required")
    
    updated_id = update_participant(participant_id=participant_id, data=update_data)
    return {'id': updated_id, 'message': 'Participant updated successfully'}

@bp.route('/delete', methods=['POST'])
@format_response
def delete():
    """
    Delete a participant.
    
    Request body:
    {
        "id": "participant-uuid"
    }
    """
    logger.info('Received request to delete participant')
    payload = request.get_json(force=True)
    participant_id = payload.get('id')
    
    if not participant_id:
        raise Exception("Participant ID is required")
    
    deleted_id = delete_participant(participant_id=participant_id)
    return {'id': deleted_id, 'message': 'Participant deleted successfully'}