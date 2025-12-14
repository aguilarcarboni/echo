from src.utils.exception import handle_exception
from src.utils.connectors.supabase import db
from src.utils.logger import logger

logger.announcement('Initializing Users Service', type='info')
logger.announcement('Initialized Users Service', type='success')

@handle_exception
def create_user(user: dict = None):
    """Create a new user in the database."""
    if not user:
        raise Exception("User data is required")
    
    # Validate required fields
    if not user.get('email'):
        raise Exception("email is required")
    
    # Add timestamps if not provided
    from datetime import datetime
    if 'created_at' not in user:
        user['created_at'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    if 'updated_at' not in user:
        user['updated_at'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    user_id = db.create(table='users', data=user)
    return user_id

@handle_exception
def read_users(query=None):
    """Read users from the database with optional filters."""
    if query is None:
        query = {}
    
    users = db.read(table='users', query=query)
    return users