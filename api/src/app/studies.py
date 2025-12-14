"""
Studies API Routes

This module defines the HTTP endpoints for study management.
It handles request/response formatting and delegates business logic to components.
"""

from flask import Blueprint, request
from src.components.studies import create_study, read_studies, update_study, delete_study
from src.utils.response import format_response
from src.utils.logger import logger 
import uuid

bp = Blueprint('studies', __name__)

@bp.route('/create', methods=['POST'])
@format_response
def create():
    """
    Create a new study.
    
    Request body:
    {
        "study": {
            "organization_id": "uuid",
            "created_by": "uuid",
            "name": "Study Name",
            "objective": "Study objective",
            "study_type": "Research type",
            "status": "draft",
            "target_participants": 50,
            "duration_days": 7,
            "segment_criteria": {}
        }
    }
    
    Returns:
    {
        "id": "study-uuid",
        "message": "Study created successfully"
    }
    """
    logger.info('Received request to create study')
    payload = request.get_json(force=True)
    study_data = payload.get('study', {})
    
    # Generate ID if not provided
    if 'id' not in study_data:
        study_data['id'] = str(uuid.uuid4())
    
    study_id = create_study(study=study_data)
    return {'id': study_id, 'message': 'Study created successfully'}

@bp.route('/read', methods=['GET'])
@format_response
def read():
    """
    Read studies with optional filters.
    
    Query parameters:
    - id: Filter by study ID
    - organization_id: Filter by organization
    - status: Filter by status (draft, active, completed, archived)
    - created_by: Filter by creator
    
    Returns:
    [
        {
            "id": "uuid",
            "name": "Study Name",
            "status": "draft",
            ...
        },
        ...
    ]
    """
    logger.info('Received request to read studies')
    query = {}
    
    # Get query parameters from URL
    study_id = request.args.get('id', None)
    organization_id = request.args.get('organization_id', None)
    status = request.args.get('status', None)
    created_by = request.args.get('created_by', None)
    
    if study_id:
        query['id'] = study_id
    if organization_id:
        query['organization_id'] = organization_id
    if status:
        query['status'] = status
    if created_by:
        query['created_by'] = created_by
    
    studies = read_studies(query=query)
    return studies

@bp.route('/update', methods=['POST'])
@format_response
def update():
    """
    Update an existing study.
    
    Request body:
    {
        "id": "study-uuid",
        "data": {
            "name": "Updated Name",
            "status": "active",
            ...
        }
    }
    
    Returns:
    {
        "id": "study-uuid",
        "message": "Study updated successfully"
    }
    """
    logger.info('Received request to update study')
    payload = request.get_json(force=True)
    study_id = payload.get('id')
    update_data = payload.get('data', {})
    
    if not study_id:
        raise Exception("Study ID is required")
    
    updated_id = update_study(study_id=study_id, data=update_data)
    return {'id': updated_id, 'message': 'Study updated successfully'}

@bp.route('/delete', methods=['POST'])
@format_response
def delete():
    """
    Delete a study.
    
    Request body:
    {
        "id": "study-uuid"
    }
    
    Returns:
    {
        "id": "study-uuid",
        "message": "Study deleted successfully"
    }
    """
    logger.info('Received request to delete study')
    payload = request.get_json(force=True)
    study_id = payload.get('id')
    
    if not study_id:
        raise Exception("Study ID is required")
    
    deleted_id = delete_study(study_id=study_id)
    return {'id': deleted_id, 'message': 'Study deleted successfully'}

