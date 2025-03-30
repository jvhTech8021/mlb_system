from src.database import init_db, TeamRecord
from api import update_historical_data
from datetime import datetime, timedelta
import os
import sys

if __name__ == "__main__":
    try:
        print("Initializing the database...")
        session = init_db()
        
        # Check if we're using PostgreSQL (likely on Heroku)
        is_postgres = os.environ.get('DATABASE_URL') and 'postgres' in os.environ.get('DATABASE_URL')
        print(f"Using PostgreSQL: {is_postgres}")
        
        # Initialize with sample data for yesterday
        yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
        print(f"Adding historical data for {yesterday}")
        
        try:
            update_historical_data(yesterday)
            print("Historical data added successfully!")
        except Exception as e:
            print(f"Error adding historical data: {e}")
            print("Continuing with initialization...")
        
        # Verify database has data
        team_count = session.query(TeamRecord).count()
        print(f"Database initialized with {team_count} team records")
        
        print("Database initialization complete!")
        
    except Exception as e:
        print(f"Error initializing database: {e}")
        sys.exit(1) 