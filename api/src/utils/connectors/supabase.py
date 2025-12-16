from sqlalchemy import Boolean, ForeignKey, Text, create_engine, Column, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
import uuid
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from src.utils.managers.database_manager import DatabaseManager
from src.utils.logger import logger
import os
from dotenv import load_dotenv 

load_dotenv()  # Load environment variables from .env file

class Supabase:
    _instance = None
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Supabase, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if not self._initialized:
            logger.announcement('Initializing Database Service', 'info')

            # Check if a direct database URL is provided
            db_url = os.getenv('SUPABASE_DB_URL')
            
            if not db_url:
                # Get credentials from environment variables
                supabase_url = os.getenv('SUPABASE_URL')
                supabase_user = os.getenv('SUPABASE_USER', 'postgres')
                supabase_password = os.getenv('SUPABASE_PASSWORD')
                
                if not supabase_password:
                    logger.error('SUPABASE_PASSWORD must be set in .env file')
                    raise ValueError("SUPABASE_PASSWORD must be set in .env file")
                
                if not supabase_url:
                    logger.error('SUPABASE_URL must be set in .env file')
                    raise ValueError("SUPABASE_URL must be set in .env file")
                
                # Extract project reference ID from SUPABASE_URL
                # Format: https://{project_ref}.supabase.co
                try:
                    # Remove https:// and .supabase.co to get project reference
                    project_ref = supabase_url.replace('https://', '').replace('.supabase.co', '').strip()
                    if not project_ref:
                        raise ValueError("Could not extract project reference from SUPABASE_URL")
                except Exception as e:
                    logger.error(f'Failed to extract project reference from SUPABASE_URL: {e}')
                    raise ValueError(f"Invalid SUPABASE_URL format. Expected: https://xxxxx.supabase.co, got: {supabase_url}")
                
                # Try direct connection first (more reliable for local development)
                # Format: postgresql://postgres.{project_ref}:{password}@{project_ref}.supabase.co:5432/postgres
                # If pooler is needed, use: postgresql://postgres.{project_ref}:{password}@{project_ref}.pooler.supabase.com:6543/postgres
                use_pooler = os.getenv('SUPABASE_USE_POOLER', 'false').lower() == 'true'
                
                if use_pooler:
                    # Connection pooler (for serverless/production)
                    db_url = f'postgresql://postgres.{project_ref}:{supabase_password}@{project_ref}.pooler.supabase.com:6543/postgres'
                    logger.info(f'Using connection pooler for project: {project_ref}')
                else:
                    # Direct connection (for local development)
                    db_url = f'postgresql://postgres.{project_ref}:{supabase_password}@{project_ref}.supabase.co:5432/postgres'
                    logger.info(f'Using direct connection for project: {project_ref}')
            
            self.db_url = db_url
            
            # Log the connection URL (without password for security)
            safe_url = db_url.split('@')[1] if '@' in db_url else '***'
            logger.info(f'Attempting to connect to: postgresql://***@{safe_url}')
            
            self.engine = create_engine(self.db_url)
            
            self.Base = declarative_base()
            self._setup_models()
            
            try:
                self.db = DatabaseManager(base=self.Base, engine=self.engine)
                logger.announcement('Successfully initialized Database Service', 'success')
            except Exception as e:
                error_msg = str(e)
                if 'could not translate host name' in error_msg or 'nodename nor servname' in error_msg:
                    logger.error('=' * 70)
                    logger.error('DNS RESOLUTION ERROR - Connection String Issue')
                    logger.error('=' * 70)
                    logger.error('The hostname in your connection string cannot be resolved.')
                    logger.error('')
                    logger.error('SOLUTION: Get the exact connection string from Supabase Dashboard:')
                    logger.error('1. Go to https://app.supabase.com')
                    logger.error('2. Select your project')
                    logger.error('3. Go to Settings → Database')
                    logger.error('4. Scroll to "Connection string" section')
                    logger.error('5. Select "URI" tab')
                    logger.error('6. Copy the connection string (it may use aws-0-{region}.pooler.supabase.com format)')
                    logger.error('7. Add it to .env as: SUPABASE_DB_URL=postgresql://...')
                    logger.error('')
                    logger.error(f'Current connection string hostname: {safe_url}')
                    logger.error('=' * 70)
                raise
            
            self._initialized = True

    def _setup_models(self):
        """
        Define SQLAlchemy models that match your database tables.
        These models represent the structure of your database tables.
        """
        
        # User model - matches 'users' table in database
        class User(self.Base):
            __tablename__ = 'users'
            id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
            email = Column(Text, nullable=False, unique=True)
            organization_id = Column(UUID(as_uuid=True), ForeignKey('organizations.id'), nullable=True)
            role = Column(Text, default='member')
            created_at = Column(Text, nullable=True)
            updated_at = Column(Text, nullable=True)

        # Study model - matches 'studies' table in database
        class Study(self.Base): 
            __tablename__ = 'studies'
            id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
            organization_id = Column(UUID(as_uuid=True), ForeignKey('organizations.id'), nullable=False)
            created_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
            name = Column(Text, nullable=False)
            objective = Column(Text, nullable=True)
            study_type = Column(Text, nullable=True)
            status = Column(Text, nullable=True, default='draft')
            target_participants = Column(Integer, default=50)
            duration_days = Column(Integer, default=7)
            start_date = Column(Text, nullable=True)
            end_date = Column(Text, nullable=True)
            segment_criteria = Column(JSONB, nullable=True)
            created_at = Column(Text, nullable=True)
            updated_at = Column(Text, nullable=True)

        # Organization model - matches 'organizations' table in database
        class Organization(self.Base):
            __tablename__ = 'organizations'
            id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
            name = Column(Text, nullable=False)
            created_at = Column(Text, nullable=True)
            updated_at = Column(Text, nullable=True)

        # Task model - matches 'tasks' table in database
        class Task(self.Base):
            __tablename__ = 'tasks'
            id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
            study_id = Column(UUID(as_uuid=True), ForeignKey('studies.id', ondelete='CASCADE'), nullable=False)
            type = Column(Text, nullable=False)
            title = Column(Text, nullable=False)
            instructions = Column(Text, nullable=True)
            order_index = Column(Integer, default=0)
            created_at = Column(Text, nullable=True)
            updated_at = Column(Text, nullable=True)

        # Participant model - matches 'participants' table in database
        class Participant(self.Base):
            __tablename__ = 'participants'
            id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
            study_id = Column(UUID(as_uuid=True), ForeignKey('studies.id', ondelete='CASCADE'), nullable=False)
            contact = Column(Text, nullable=False)
            demographics = Column(JSONB, nullable=True)
            status = Column(Text, default='invited')
            invited_at = Column(Text, nullable=True)
            started_at = Column(Text, nullable=True)
            completed_at = Column(Text, nullable=True)
            created_at = Column(Text, nullable=True)
            updated_at = Column(Text, nullable=True)

        # Response model - matches 'responses' table in database
        class Response(self.Base):
            __tablename__ = 'responses'
            id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
            participant_id = Column(UUID(as_uuid=True), ForeignKey('participants.id', ondelete='CASCADE'), nullable=False)
            task_id = Column(UUID(as_uuid=True), ForeignKey('tasks.id', ondelete='CASCADE'), nullable=False)
            response_data = Column(JSONB, nullable=False)
            submitted_at = Column(Text, nullable=True)
            created_at = Column(Text, nullable=True)

        # Store models for access
        self.User = User
        self.Study = Study
        self.Organization = Organization
        self.Task = Task
        self.Participant = Participant
        self.Response = Response

# Create a single instance that can be imported and used throughout the application
db = Supabase().db