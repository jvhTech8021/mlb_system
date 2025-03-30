from sqlalchemy import create_engine, MetaData, Table, Column, Boolean, text
from datetime import datetime, timedelta
import os
from pathlib import Path

def migrate_database():
    print("Starting database migration...")
    
    # Check if database exists
    if not os.path.exists('mlb_data.db'):
        print("Database doesn't exist. No migration needed.")
        return
    
    # Create a backup before migration
    backup_file = f"mlb_data_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
    Path(backup_file).write_bytes(Path('mlb_data.db').read_bytes())
    print(f"Database backup created: {backup_file}")
    
    # Connect to the database
    engine = create_engine('sqlite:///mlb_data.db')
    conn = engine.connect()
    
    # Check if the column already exists
    metadata = MetaData()
    metadata.reflect(bind=engine)
    games_table = metadata.tables['games']
    
    if 'is_complete_series' not in games_table.columns:
        print("Adding 'is_complete_series' column to games table...")
        
        # Add the new column
        conn.execute(text('ALTER TABLE games ADD COLUMN is_complete_series BOOLEAN DEFAULT FALSE'))
        
        # Update the new field for existing series
        print("Updating existing series data...")
        
        # First, get all games
        result = conn.execute(text('SELECT id, series_id FROM games WHERE series_id IS NOT NULL'))
        games = result.fetchall()
        
        # Count games in each series
        series_count = {}
        for game in games:
            series_id = game[1]
            if series_id not in series_count:
                series_count[series_id] = 0
            series_count[series_id] += 1
        
        # Update games in complete series
        for series_id, count in series_count.items():
            if count >= 3:
                conn.execute(
                    text('UPDATE games SET is_complete_series = TRUE WHERE series_id = :series_id'),
                    {"series_id": series_id}
                )
                print(f"  Updated series {series_id} with {count} games")
        
        print("Migration completed successfully!")
    else:
        print("Column 'is_complete_series' already exists. No migration needed.")
    
    conn.close()

if __name__ == "__main__":
    migrate_database() 