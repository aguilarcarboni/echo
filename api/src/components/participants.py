"""
Participants Component - Business Logic Layer
"""

from src.utils.exception import handle_exception
from src.utils.connectors.supabase import db
from src.utils.logger import logger
from datetime import datetime
import secrets

logger.announcement('Initializing Participants Service', type='info')

@handle_exception
def create_participant(participant: dict = None):
    """
    Create a new participant for a study.
    
    Args:
        participant (dict): Participant data including:
            - study_id (required)
            - contact (required): email or phone
            - demographics (optional): JSON object with age, gender, location, etc.
            - status (optional, defaults to 'invited')
    
    Returns:
        str: The ID of the created participant
    """
    if not participant:
        raise Exception("Participant data is required")
    
    # Validate required fields
    if not participant.get('study_id'):
        raise Exception("study_id is required")
    if not participant.get('contact'):
        raise Exception("contact is required")
    
    # Add timestamps
    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    participant['created_at'] = current_time
    participant['updated_at'] = current_time
    
    # Set defaults
    if 'status' not in participant:
        participant['status'] = 'invited'
    if 'invited_at' not in participant:
        participant['invited_at'] = current_time
    
    # Generate access code if not provided (for participant authentication)
    if 'access_code' not in participant:
        # Generate a secure random access code (8 characters)
        participant['access_code'] = secrets.token_urlsafe(6)[:8].upper()
    
    participant_id = db.create(table='participants', data=participant)
    logger.success(f'Created participant with id: {participant_id}')
    return participant_id

@handle_exception
def read_participants(query=None):
    """
    Read participants with optional filters.
    
    Args:
        query (dict): Optional filters such as:
            - id: Filter by participant ID
            - study_id: Filter by study
            - status: Filter by status
            - access_code: Filter by access code
    
    Returns:
        list: List of participant dictionaries
    """
    if query is None:
        query = {}
    
    participants = db.read(table='participants', query=query)
    logger.info(f'Retrieved {len(participants)} participants')
    return participants

@handle_exception
def get_participant_by_access_code(access_code: str, study_id: str = None):
    """
    Get a participant by their access code (for participant authentication).
    
    Args:
        access_code (str): The participant's access code
        study_id (str): Optional study ID to verify the participant belongs to this study
    
    Returns:
        dict: Participant dictionary if found, None otherwise
    """
    if not access_code:
        raise Exception("Access code is required")
    
    query = {'access_code': access_code}
    if study_id:
        query['study_id'] = study_id
    
    participants = db.read(table='participants', query=query)
    if participants and len(participants) > 0:
        logger.info(f'Found participant with access code: {access_code}')
        return participants[0]
    
    logger.warning(f'No participant found with access code: {access_code}')
    return None

@handle_exception
def update_participant(participant_id: str, data: dict = None):
    """
    Update an existing participant.
    
    Args:
        participant_id (str): The ID of the participant to update
        data (dict): Fields to update
    
    Returns:
        str: The ID of the updated participant
    """
    if not participant_id:
        raise Exception("Participant ID is required")
    if not data:
        raise Exception("Update data is required")
    
    # Update timestamp
    data['updated_at'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    # Handle status changes
    if 'status' in data:
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        if data['status'] == 'started' and 'started_at' not in data:
            data['started_at'] = current_time
        elif data['status'] == 'completed' and 'completed_at' not in data:
            data['completed_at'] = current_time
    
    updated_id = db.update(table='participants', query={'id': participant_id}, data=data)
    logger.success(f'Updated participant with id: {updated_id}')
    return updated_id

@handle_exception
def delete_participant(participant_id: str):
    """
    Delete a participant.
    
    Args:
        participant_id (str): The ID of the participant to delete
    
    Returns:
        str: The ID of the deleted participant
    """
    if not participant_id:
        raise Exception("Participant ID is required")
    
    deleted_id = db.delete(table='participants', query={'id': participant_id})
    logger.success(f'Deleted participant with id: {deleted_id}')
    return deleted_id

@handle_exception
def bulk_create_participants(study_id: str, contacts: list, demographics: dict = None):
    """
    Create multiple participants at once.
    
    Args:
        study_id (str): The study ID
        contacts (list): List of contact strings (emails/phones)
        demographics (dict): Optional default demographics for all participants
    
    Returns:
        dict: Count of created participants
    """
    if not study_id:
        raise Exception("Study ID is required")
    if not contacts:
        raise Exception("Contacts list is required")
    
    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    created_count = 0
    
    for contact in contacts:
        participant_data = {
            'study_id': study_id,
            'contact': contact,
            'status': 'invited',
            'invited_at': current_time,
            'created_at': current_time,
            'updated_at': current_time,
            # Generate unique access code for each participant
            'access_code': secrets.token_urlsafe(6)[:8].upper(),
        }
        
        if demographics:
            participant_data['demographics'] = demographics
        
        try:
            db.create(table='participants', data=participant_data)
            created_count += 1
        except Exception as e:
            logger.error(f'Failed to create participant {contact}: {str(e)}')
    
    logger.success(f'Created {created_count} participants for study {study_id}')
    return {'created_count': created_count, 'total_requested': len(contacts)}

logger.announcement('Initialized Participants Service', type='success')