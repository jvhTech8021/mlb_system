import os
import sys

# Add the current directory to the path to enable imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Try to import without src prefix
try:
    from database import init_db
except ImportError:
    # Fallback to import with src prefix
    from src.database import init_db

if __name__ == "__main__":
    print("Initializing database...")
    init_db()
    print("Database initialized successfully!") 