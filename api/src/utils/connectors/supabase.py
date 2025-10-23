from sqlalchemy import Boolean, ForeignKey, Text, create_engine, Column, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
import uuid
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from src.utils.managers.database_manager import DatabaseManager
from src.utils.logger import logger

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

            # Secrets
            supabase_user = 'drtdcwlnrjrwopdvgrfh'
            supabase_password = 'niwvYx-7vadmy-ciqbog'
            
            self.db_url = f'postgresql://postgres.{supabase_user}:{supabase_password}@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
            self.engine = create_engine(self.db_url)
            
            self.Base = declarative_base()
            self._setup_models()
            
            self.db = DatabaseManager(base=self.Base, engine=self.engine)
            
            logger.announcement('Successfully initialized Database Service', 'success')
            self._initialized = True

    def _setup_models(self):

        class User(self.Base):
            __tablename__ = 'user'
            id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
            created = Column(Text, nullable=False, default=datetime.now().strftime('%Y%m%d%H%M%S'))
            updated = Column(Text, nullable=False, default=datetime.now().strftime('%Y%m%d%H%M%S'))
            email = Column(Text, nullable=False, unique=True)
            password = Column(Text, nullable=False)
            company_name = Column(Text, nullable=False)

        self.User = User

# Create a single instance that can be imported and used throughout the application
db = Supabase().db