# MLB Betting Analysis System

A modern web interface for analyzing MLB games with specialized betting criteria.

## Overview

The MLB Betting Analysis System analyzes daily baseball games and identifies betting opportunities based on proven historical patterns. The system uses The Odds API for accurate odds data and applies three main criteria to identify potential value bets:

1. **Road Underdog Coming Off Loss**: Road teams that are underdogs with losing records playing against teams with winning records, after having lost their previous game.

2. **Underdog in April After Series Losses**: Teams that are underdogs in April that have lost consecutive games against the same opponent in the current series.

3. **Home Underdog After High-Scoring Game**: Home teams that are underdogs after playing in a high-scoring game (10+ total runs).

## Features

- **Daily Game Analysis**: View and analyze all MLB games for a specific date
- **Automated Bet Recommendations**: Get recommended bets based on historical patterns  
- **Odds Tracking**: Track American and decimal odds from The Odds API
- **Performance Tracking**: Monitor the performance of each betting criteria
- **Interactive Interface**: Navigate through dates and view trends over time
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Python 3.8+
- Flask
- SQLite
- An API key for The Odds API (free tier available at https://the-odds-api.com/)

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd mlb_system
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Set up your environment variables:
   - Create a `.env` file in the root directory
   - Add your API key: `THE_ODDS_API_KEY=your_api_key_here`

4. Initialize the database:
   ```
   python src/init_db.py
   ```

### Running the Web Interface

1. Start the Flask server:
   ```
   python api.py
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:5000
   ```

## Using the System

1. **Viewing Daily Games**: The homepage shows games for the current date. Use the date navigation to move between dates.

2. **Analyzing Bets**: Games matching the betting criteria will be highlighted with a "RECOMMENDED BET" badge.

3. **Best Bets**: The "Best Bets" tab shows the top recommended bets ranked by strength.

4. **Trends**: The "Betting Trends" tab shows historical performance of each criteria and monthly ROI.

## Command Line Usage

You can also use the system from the command line:

```
python src/main.py --date 2025-03-27 --output-format pdf
```

Options:
- `--date`: Analysis date in YYYY-MM-DD format (default: today)
- `--output-format`: Output format (console, pdf, or both)
- `--update-odds`: Update existing games with latest odds
- `--odds-only`: Only fetch and display odds without analyzing games

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Built using The Odds API for odds data
- Team logos from ESPN
- Data storage with SQLAlchemy and SQLite 

## Deployment

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

This application can be deployed to various cloud platforms. For detailed deployment instructions, see the [DEPLOYMENT.md](DEPLOYMENT.md) file.

### Quick Deployment to Heroku

```bash
# Login to Heroku
heroku login

# Create a new app
heroku create mlb-betting-system

# Deploy the application
git push heroku main

# Initialize the database
heroku run python initialize_db.py

# Open the application
heroku open
```

### Alternative Deployment Options

The application can also be deployed to:
- **Render**: A modern cloud platform with free tier options
- **DigitalOcean App Platform**: A simple PaaS for quick deployments
- **AWS**: Using Elastic Beanstalk or EC2 for more control

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions for each platform. 