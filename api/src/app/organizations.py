"""
Organizations API Routes

This module defines the HTTP endpoints for organization management.
It handles request/response formatting and delegates business logic to components.
"""

from flask import Blueprint, request
from src.components.organizations import (
    create_organization, 
    read_organizations, 
    update_organization, 
    delete_organization
)
from src.utils.response import format_response
from src.utils.logger import logger
import uuid

bp = Blueprint('organizations', __name__)

@bp.route('/create', methods=['POST'])
@format_response
def create():
    """
    Create a new organization.
    
    Request body:
    {
        "organization": {
            "name": "Organization Name"
        }
    }
    
    Returns:
    {
        "id": "organization-uuid",
        "message": "Organization created successfully"
    }
    """
    logger.info('Received request to create organization')
    payload = request.get_json(force=True)
    organization_data = payload.get('organization', {})
    
    # Generate ID if not provided
    if 'id' not in organization_data:
        organization_data['id'] = str(uuid.uuid4())
    
    organization_id = create_organization(organization=organization_data)
    return {'id': organization_id, 'message': 'Organization created successfully'}

@bp.route('/read', methods=['GET'])
@format_response
def read():
    """
    Read organizations with optional filters.
    
    Query parameters:
    - id: Filter by organization ID
    - name: Filter by name
    
    Returns:
    [
        {
            "id": "uuid",
            "name": "Organization Name",
            ...
        },
        ...
    ]
    """
    logger.info('Received request to read organizations')
    query = {}
    
    # Get query parameters from URL
    organization_id = request.args.get('id', None)
    name = request.args.get('name', None)
    
    if organization_id:
        query['id'] = organization_id
    if name:
        query['name'] = name
    
    organizations = read_organizations(query=query)
    return organizations

@bp.route('/update', methods=['POST'])
@format_response
def update():
    """
    Update an existing organization.
    
    Request body:
    {
        "id": "organization-uuid",
        "data": {
            "name": "Updated Name",
            ...
        }
    }
    
    Returns:
    {
        "id": "organization-uuid",
        "message": "Organization updated successfully"
    }
    """
    logger.info('Received request to update organization')
    payload = request.get_json(force=True)
    organization_id = payload.get('id')
    update_data = payload.get('data', {})
    
    if not organization_id:
        raise Exception("Organization ID is required")
    
    updated_id = update_organization(organization_id=organization_id, data=update_data)
    return {'id': updated_id, 'message': 'Organization updated successfully'}

@bp.route('/delete', methods=['POST'])
@format_response
def delete():
    """
    Delete an organization.
    
    Request body:
    {
        "id": "organization-uuid"
    }
    
    Returns:
    {
        "id": "organization-uuid",
        "message": "Organization deleted successfully"
    }
    """
    logger.info('Received request to delete organization')
    payload = request.get_json(force=True)
    organization_id = payload.get('id')
    
    if not organization_id:
        raise Exception("Organization ID is required")
    
    deleted_id = delete_organization(organization_id=organization_id)
    return {'id': deleted_id, 'message': 'Organization deleted successfully'}

