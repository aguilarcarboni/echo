from src.utils.exception import handle_exception
from src.utils.connectors.supabase import db
from src.utils.logger import logger

logger.announcement('Initializing Users Service', type='info')
logger.announcement('Initialized Users Service', type='success')

@handle_exception
def create_user(user: dict = None):
    user_id = db.create(table='user', data=user)
    return user_id

@handle_exception
def read_users(query=None):
    users = db.read(table='user', query=query)
    
    return users