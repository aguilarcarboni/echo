"""
Studies Component - Business Logic Layer

This module handles all business logic related to studies.
It acts as an intermediary between the API routes and the database.
"""

from src.utils.exception import handle_exception
from src.utils.connectors.supabase import db
from src.utils.logger import logger
from datetime import datetime

logger.announcement('Initializing Studies Service', type='info')

@handle_exception
def create_study(study: dict = None):
    """
    Create a new study in the database.
    
    Args:
        study (dict): Study data including:
            - organization_id (required)
            - created_by (required)
            - name (required)
            - objective (optional)
            - study_type (optional)
            - status (optional, defaults to 'draft')
            - target_participants (optional, defaults to 50)
            - duration_days (optional, defaults to 7)
            - segment_criteria (optional, JSON object)
    
    Returns:
        str: The ID of the created study
    """
    if not study:
        raise Exception("Study data is required") 
    
    # Validate required fields
    if not study.get('organization_id'):
        raise Exception("organization_id is required")
    if not study.get('created_by'):
        raise Exception("created_by is required")
    if not study.get('name'):
        raise Exception("name is required")
    
    # Add timestamps (ISO 8601 format for PostgreSQL TIMESTAMP columns)
    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    study['created_at'] = current_time
    study['updated_at'] = current_time
    
    # Set defaults
    if 'status' not in study:
        study['status'] = 'draft'
    if 'target_participants' not in study:
        study['target_participants'] = 50
    if 'duration_days' not in study:
        study['duration_days'] = 7
    
    study_id = db.create(table='studies', data=study)
    logger.success(f'Created study with id: {study_id}')
    return study_id

@handle_exception
def read_studies(query=None):
    """
    Read studies from the database with optional filters.
    
    Args:
        query (dict): Optional filters such as:
            - id: Filter by study ID
            - organization_id: Filter by organization
            - status: Filter by status (draft, active, completed, archived)
            - created_by: Filter by creator
    
    Returns:
        list: List of study dictionaries
    """
    if query is None:
        query = {}
    
    studies = db.read(table='studies', query=query)
    logger.info(f'Retrieved {len(studies)} studies')
    return studies

@handle_exception
def update_study(study_id: str, data: dict = None):
    """
    Update an existing study.
    
    Args:
        study_id (str): The ID of the study to update
        data (dict): Fields to update (any study field)
    
    Returns:
        str: The ID of the updated study
    """
    if not study_id:
        raise Exception("Study ID is required")
    if not data:
        raise Exception("Update data is required")
    
    # Always update the updated_at timestamp (ISO 8601 format for PostgreSQL)
    data['updated_at'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    updated_id = db.update(table='studies', query={'id': study_id}, data=data)
    logger.success(f'Updated study with id: {updated_id}')
    return updated_id

@handle_exception
def delete_study(study_id: str):
    """
    Delete a study from the database.
    
    Args:
        study_id (str): The ID of the study to delete
    
    Returns:
        str: The ID of the deleted study
    """
    if not study_id:
        raise Exception("Study ID is required")
    
    deleted_id = db.delete(table='studies', query={'id': study_id})
    logger.success(f'Deleted study with id: {deleted_id}')
    return deleted_id

logger.announcement('Initialized Studies Service', type='success')

