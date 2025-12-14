"""
Organizations Component - Business Logic Layer

This module handles all business logic related to organizations.
It acts as an intermediary between the API routes and the database.
"""

from src.utils.exception import handle_exception
from src.utils.connectors.supabase import db
from src.utils.logger import logger
from datetime import datetime

logger.announcement('Initializing Organizations Service', type='info')

@handle_exception
def create_organization(organization: dict = None):
    """
    Create a new organization in the database.
    
    Args:
        organization (dict): Organization data including:
            - name (required)
    
    Returns:
        str: The ID of the created organization
    """
    if not organization:
        raise Exception("Organization data is required")
    
    # Validate required fields
    if not organization.get('name'):
        raise Exception("name is required")
    
    # Add timestamps
    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    if 'created_at' not in organization:
        organization['created_at'] = current_time
    if 'updated_at' not in organization:
        organization['updated_at'] = current_time
    
    organization_id = db.create(table='organizations', data=organization)
    logger.success(f'Created organization with id: {organization_id}')
    return organization_id

@handle_exception
def read_organizations(query=None):
    """
    Read organizations from the database with optional filters.
    
    Args:
        query (dict): Optional filters such as:
            - id: Filter by organization ID
            - name: Filter by name
    
    Returns:
        list: List of organization dictionaries
    """
    if query is None:
        query = {}
    
    organizations = db.read(table='organizations', query=query)
    logger.info(f'Retrieved {len(organizations)} organizations')
    return organizations

@handle_exception
def update_organization(organization_id: str, data: dict = None):
    """
    Update an existing organization.
    
    Args:
        organization_id (str): The ID of the organization to update
        data (dict): Fields to update
    
    Returns:
        str: The ID of the updated organization
    """
    if not organization_id:
        raise Exception("Organization ID is required")
    if not data:
        raise Exception("Update data is required")
    
    # Always update the updated_at timestamp
    data['updated_at'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    updated_id = db.update(table='organizations', query={'id': organization_id}, data=data)
    logger.success(f'Updated organization with id: {updated_id}')
    return updated_id

@handle_exception
def delete_organization(organization_id: str):
    """
    Delete an organization from the database.
    
    Args:
        organization_id (str): The ID of the organization to delete
    
    Returns:
        str: The ID of the deleted organization
    """
    if not organization_id:
        raise Exception("Organization ID is required")
    
    deleted_id = db.delete(table='organizations', query={'id': organization_id})
    logger.success(f'Deleted organization with id: {deleted_id}')
    return deleted_id

logger.announcement('Initialized Organizations Service', type='success')

