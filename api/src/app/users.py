from flask import Blueprint, request
from src.components.users import read_users, create_user
from src.utils.response import format_response
from src.utils.logger import logger

bp = Blueprint('users', __name__)

@bp.route('/create', methods=['POST'])
@format_response
def create():
    """
    Create a new user.
    
    Request body:
    {
        "user": {
            "email": "user@example.com",
            "organization_id": "uuid",
            "role": "admin"
        }
    }
    
    Returns:
    {
        "id": "user-uuid",
        "message": "User created successfully"
    }
    """
    logger.info('Received request to create user')
    payload = request.get_json(force=True)
    user = payload.get('user', {})
    
    # Check if user email already exists
    existing_user = read_users(query={'email': user.get('email')})

    if existing_user and len(existing_user) > 0:
        logger.error(f'User email already exists')
        raise Exception('User email already exists')
    
    user_id = create_user(user=user)
    return {'id': user_id, 'message': 'User created successfully'}

@bp.route('/read', methods=['GET'])
@format_response
def read_users_route():
    query = {}
    id = request.args.get('id', None)
    user_id = request.args.get('user_id', None)
    lead_id = request.args.get('lead_id', None)
    if id:
        query['id'] = id
    if user_id:
        query['user_id'] = user_id
    if lead_id:
        query['lead_id'] = lead_id
    return read_users(query=query)