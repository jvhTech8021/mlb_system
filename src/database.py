from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

Base = declarative_base()

class Game(Base):
    __tablename__ = 'games'
    
    id = Column(Integer, primary_key=True)
    game_date = Column(DateTime, nullable=False)
    home_team = Column(String, nullable=False)
    away_team = Column(String, nullable=False)
    home_score = Column(Integer)
    away_score = Column(Integer)
    home_odds = Column(Float)
    away_odds = Column(Float)
    over_under = Column(Float)  # Total over/under for the game
    series_game_number = Column(Integer)  # Track games in series (1, 2, 3, etc.)
    series_id = Column(String)  # Unique identifier for each series
    is_complete_series = Column(Boolean, default=False)  # True if game is part of a series with 3+ games
    status = Column(String, default='scheduled')  # 'scheduled', 'in_progress', 'completed'
    
    def __repr__(self):
        return f"<Game {self.home_team} vs {self.away_team} on {self.game_date}>"

class TeamRecord(Base):
    __tablename__ = 'team_records'
    
    id = Column(Integer, primary_key=True)
    team = Column(String, nullable=False)
    wins = Column(Integer, default=0)
    losses = Column(Integer, default=0)
    last_updated = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<TeamRecord {self.team}: {self.wins}-{self.losses}>"
        
    @property
    def win_pct(self):
        """Calculate win percentage"""
        total_games = self.wins + self.losses
        if total_games == 0:
            return None
        return self.wins / total_games

def init_db(db_path=None):
    if db_path is None:
        db_path = os.environ.get('DATABASE_URL', 'sqlite:///mlb_data.db')
        # Handle Heroku postgres:// URL format
        if db_path.startswith('postgres://'):
            db_path = db_path.replace('postgres://', 'postgresql://', 1)
    
    print(f"Initializing database with path: {db_path}")
    engine = create_engine(db_path)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    print("Database initialized successfully!")
    return session

def get_session(db_path=None):
    if db_path is None:
        db_path = os.environ.get('DATABASE_URL', 'sqlite:///mlb_data.db')
        # Handle Heroku postgres:// URL format
        if db_path and db_path.startswith('postgres://'):
            db_path = db_path.replace('postgres://', 'postgresql://', 1)
            
    engine = create_engine(db_path)
    Session = sessionmaker(bind=engine)
    return Session() 