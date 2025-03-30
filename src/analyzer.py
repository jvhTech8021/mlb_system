import re
from datetime import datetime, timedelta
import sys
import os

# Add the current directory to the path to enable imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Try to import without src prefix
try:
    from database import Game, TeamRecord, get_session
except ImportError:
    # Fallback to import with src prefix
    from src.database import Game, TeamRecord, get_session

class BettingAnalyzer:
    def __init__(self):
        self.db_session = get_session()
        # Dictionary to map team name variations to standard names
        self.team_name_map = {
            # The Odds API may use different team name formats
            "Milwaukee": "Brewers", 
            "New York Yankees": "Yankees",
            "Milwaukee Brewers": "Brewers",
            "NY Yankees": "Yankees",
            "New York Mets": "Mets",
            "NY Mets": "Mets",
            "Los Angeles Dodgers": "Dodgers",
            "LA Dodgers": "Dodgers",
            "Los Angeles Angels": "Angels",
            "LA Angels": "Angels",
            "Chicago Cubs": "Cubs",
            "Chicago White Sox": "White Sox",
            "San Diego": "Padres",
            "San Diego Padres": "Padres",
            "San Francisco": "Giants",
            "San Francisco Giants": "Giants",
            "St. Louis": "Cardinals",
            "St Louis": "Cardinals",
            "St. Louis Cardinals": "Cardinals",
            "Toronto": "Blue Jays",
            "Toronto Blue Jays": "Blue Jays",
            "Tampa Bay": "Rays",
            "Tampa Bay Rays": "Rays",
            "Texas": "Rangers",
            "Texas Rangers": "Rangers"
            # Add more mappings as needed
        }

    def check_criteria_1(self, game):
        """
        Check criteria 1: Road underdog matchup
        - Road team is an underdog with line between +100 and +180
        - Records meet criteria: Road team has worse or similar record
        - Road team lost last game
        """
        # Skip if odds are missing
        if game.away_odds is None or game.home_odds is None:
            return {
                'matches': False,
                'strength': 0.0,
                'checks': {
                    'criteria_1_underdog_odds': "Missing odds data",
                    'criteria_1_records': False,
                    'criteria_1_lost_last': False,
                    'away_record': "N/A",
                    'home_record': "N/A"
                }
            }
            
        # Check if away team is an underdog with odds in range +100 to +180
        if not (1.0 < game.away_odds <= 2.8):  # +100 to +180 in decimal odds
            return {
                'matches': False,
                'strength': 0.0,
                'checks': {
                    'criteria_1_underdog_odds': False,
                    'criteria_1_records': False,
                    'criteria_1_lost_last': False,
                    'away_record': "N/A",
                    'home_record': "N/A"
                }
            }
        
        # Get team records from TeamRecord table first
        away_record = self.db_session.query(TeamRecord).filter_by(team=game.away_team).first()
        home_record = self.db_session.query(TeamRecord).filter_by(team=game.home_team).first()
        
        # Print debug info about team records
        print(f"Home team {game.home_team} record: {home_record}")
        print(f"Away team {game.away_team} record: {away_record}")
        
        # Check records criteria
        records_met = False
        
        # If we have TeamRecord objects, use those first
        if away_record and home_record:
            away_wins = away_record.wins
            away_losses = away_record.losses
            home_wins = home_record.wins
            home_losses = home_record.losses
            
            # Calculate win percentages
            home_total = home_wins + home_losses
            away_total = away_wins + away_losses
            
            home_pct = home_wins / home_total if home_total > 0 else 0
            away_pct = away_wins / away_total if away_total > 0 else 0
            
            print(f"Home record from TeamRecord: {home_wins}-{home_losses} ({home_pct:.3f})")
            print(f"Away record from TeamRecord: {away_wins}-{away_losses} ({away_pct:.3f})")
            
            if away_total > 0 and home_total > 0 and away_pct <= home_pct + 0.1:
                records_met = True
                print(f"Records met from TeamRecord: Away {away_pct:.3f} <= Home {home_pct:.3f} + 0.1")
        else:
            # If we don't have TeamRecord objects, try to calculate from completed games
            try:
                # Calculate home team wins and losses
                home_wins = self.db_session.query(Game).filter(
                    (Game.home_team == game.home_team) & (Game.home_score > Game.away_score) & 
                    (Game.status == 'completed')
                ).count()
                
                home_losses = self.db_session.query(Game).filter(
                    (Game.home_team == game.home_team) & (Game.home_score < Game.away_score) & 
                    (Game.status == 'completed')
                ).count()
                
                # Additional home losses from away games
                home_losses += self.db_session.query(Game).filter(
                    (Game.away_team == game.home_team) & (Game.away_score < Game.home_score) & 
                    (Game.status == 'completed')
                ).count()
                
                # Additional home wins from away games
                home_wins += self.db_session.query(Game).filter(
                    (Game.away_team == game.home_team) & (Game.away_score > Game.home_score) & 
                    (Game.status == 'completed')
                ).count()
                
                # Calculate away team wins and losses similarly
                away_wins = self.db_session.query(Game).filter(
                    (Game.home_team == game.away_team) & (Game.home_score > Game.away_score) & 
                    (Game.status == 'completed')
                ).count()
                
                away_losses = self.db_session.query(Game).filter(
                    (Game.home_team == game.away_team) & (Game.home_score < Game.away_score) & 
                    (Game.status == 'completed')
                ).count()
                
                # Additional away losses from away games
                away_losses += self.db_session.query(Game).filter(
                    (Game.away_team == game.away_team) & (Game.away_score < Game.home_score) & 
                    (Game.status == 'completed')
                ).count()
                
                # Additional away wins from away games
                away_wins += self.db_session.query(Game).filter(
                    (Game.away_team == game.away_team) & (Game.away_score > Game.home_score) & 
                    (Game.status == 'completed')
                ).count()
                
                # Calculate win percentages
                home_total = home_wins + home_losses
                away_total = away_wins + away_losses
                
                print(f"Home record from DB: {home_wins}-{home_losses}")
                print(f"Away record from DB: {away_wins}-{away_losses}")
                
                home_pct = home_wins / home_total if home_total > 0 else 0
                away_pct = away_wins / away_total if away_total > 0 else 0
                
                if away_total > 0 and home_total > 0 and away_pct <= home_pct + 0.1:
                    records_met = True
                    print(f"Records met from DB calc: Away {away_pct:.3f} <= Home {home_pct:.3f} + 0.1")
                    
                    # Create TeamRecord objects if they don't exist
                    if not away_record:
                        away_record = TeamRecord(team=game.away_team, wins=away_wins, losses=away_losses)
                        self.db_session.add(away_record)
                    if not home_record:
                        home_record = TeamRecord(team=game.home_team, wins=home_wins, losses=home_losses)
                        self.db_session.add(home_record)
                    
                    self.db_session.commit()
            
            except Exception as e:
                print(f"Error calculating records from DB: {str(e)}")
        
        # Check if road team lost last game
        last_game_loss = self.check_lost_last_game(game.away_team)
        
        # Calculate strength based on odds and win percentage difference
        strength = 0.0
        if records_met and last_game_loss:
            # Base strength on odds - higher odds (bigger underdog) means higher strength
            odds_strength = (game.away_odds - 1.0) / 1.8  # Normalize to 0-1 scale
            
            # Win percentage difference adds to strength
            if away_record and home_record:
                away_pct = away_record.win_pct if away_record.win_pct is not None else 0
                home_pct = home_record.win_pct if home_record.win_pct is not None else 0
                
                pct_diff = max(0, home_pct - away_pct)
                pct_strength = min(0.5, pct_diff)  # Cap at 0.5
            else:
                pct_strength = 0
                
            strength = min(1.0, odds_strength + pct_strength)
            
        # Return results
        return {
            'matches': records_met and last_game_loss,
            'strength': strength,
            'checks': {
                'criteria_1_underdog_odds': True,
                'criteria_1_records': records_met,
                'criteria_1_lost_last': last_game_loss,
                'away_record': str(away_record) if away_record else "N/A",
                'home_record': str(home_record) if home_record else "N/A"
            }
        }

    def check_criteria_2(self, game):
        """
        Check criteria 2: April underdog matchup
        - Game is in April
        - Team is an underdog with odds of +105 or greater
        - Team has consecutive losses against the same opponent
        - Was an underdog in previous loss
        """
        # Check if game date is in April
        is_april = game.game_date.month == 4
        if not is_april:
            return {
                'matches': False,
                'strength': 0.0,
                'checks': {
                    'criteria_2_april': False,
                    'criteria_2_underdog': "N/A",
                    'criteria_2_consecutive_losses': 0,
                    'criteria_2_underdog_in_loss': False
                }
            }
        
        # Check if either team is an underdog
        away_is_underdog = False
        home_is_underdog = False
        team_to_check = None
        opponent = None
        
        # Skip if odds are missing
        if game.away_odds is None or game.home_odds is None:
            return {
                'matches': False,
                'strength': 0.0,
                'checks': {
                    'criteria_2_april': True,
                    'criteria_2_underdog': "Missing odds data",
                    'criteria_2_consecutive_losses': 0,
                    'criteria_2_underdog_in_loss': False
                }
            }
        
        if game.away_odds >= 2.05:  # +105 in decimal odds
            away_is_underdog = True
            team_to_check = game.away_team
            opponent = game.home_team
        elif game.home_odds >= 2.05:  # +105 in decimal odds
            home_is_underdog = True
            team_to_check = game.home_team
            opponent = game.away_team
        
        if not (away_is_underdog or home_is_underdog):
            return {
                'matches': False,
                'strength': 0.0,
                'checks': {
                    'criteria_2_april': True,
                    'criteria_2_underdog': False,
                    'criteria_2_consecutive_losses': 0,
                    'criteria_2_underdog_in_loss': False
                }
            }
        
        # Check for consecutive losses against the same opponent
        consecutive_losses = self.check_consecutive_losses(team_to_check, opponent)
        
        # Check if underdog in previous loss
        previous_underdog = self.check_previous_underdog(team_to_check, opponent)
        
        # Calculate strength based on factors
        strength = 0.0
        if consecutive_losses >= 2 and previous_underdog:
            # Base strength on odds - higher odds means higher strength
            odds = game.away_odds if away_is_underdog else game.home_odds
            odds_strength = min(0.7, (odds - 2.05) / 2.0)  # Scale from +105 to +300
            
            # Additional strength for each consecutive loss
            loss_strength = min(0.3, (consecutive_losses - 1) * 0.15)
            
            strength = odds_strength + loss_strength
        
        # Return results
        matches = consecutive_losses >= 2 and previous_underdog
        return {
            'matches': matches,
            'strength': strength,
            'checks': {
                'criteria_2_april': True,
                'criteria_2_underdog': True,
                'criteria_2_consecutive_losses': consecutive_losses,
                'criteria_2_opponent': opponent,
                'criteria_2_underdog_in_loss': previous_underdog
            }
        }
    
    def check_criteria_3(self, game):
        """
        Check criteria 3: Home underdog after high scoring game
        - Team is home underdog
        - Previous game was high scoring (10+ runs total)
        """
        # Skip if odds are missing
        if game.away_odds is None or game.home_odds is None:
            return {
                'matches': False,
                'strength': 0.0,
                'checks': {
                    'criteria_3_home_underdog': "Missing odds data",
                    'criteria_3_previous_runs': "N/A"
                }
            }
        
        # Check if home team is underdog
        is_home_underdog = game.home_odds > 2.0  # +100 or more
        if not is_home_underdog:
            return {
                'matches': False,
                'strength': 0.0,
                'checks': {
                    'criteria_3_home_underdog': False,
                    'criteria_3_previous_runs': "N/A"
                }
            }
        
        # Check previous game of home team
        yesterday = game.game_date - timedelta(days=1)
        last_game = self.db_session.query(Game).filter(
            Game.game_date >= yesterday - timedelta(days=2),
            Game.game_date < game.game_date,
            (Game.home_team == game.home_team) | (Game.away_team == game.home_team)
        ).order_by(Game.game_date.desc()).first()
        
        previous_runs = 0
        if last_game and last_game.home_score is not None and last_game.away_score is not None:
            previous_runs = last_game.home_score + last_game.away_score
        
        # Check if previous game was high scoring
        high_scoring = previous_runs >= 12
        
        # Calculate strength based on factors
        strength = 0.0
        if high_scoring:
            # Base strength on underdog odds
            odds_strength = min(0.6, (game.home_odds - 2.0) / 2.0)  # Scale from +100 to +300
            
            # Additional strength based on run total
            runs_strength = min(0.4, (previous_runs - 12) * 0.05)  # 0.05 per run over 12
            
            strength = odds_strength + runs_strength
        
        # Return results
        return {
            'matches': high_scoring,
            'strength': strength,
            'checks': {
                'criteria_3_home_underdog': True,
                'criteria_3_previous_runs': previous_runs
            }
        }

    def analyze_game(self, game):
        """
        Analyze a single game against all criteria
        Returns a dict with match results and details
        """
        # Apply all criteria checks
        criteria_results = {
            'criteria_1': self.check_criteria_1(game),
            'criteria_2': self.check_criteria_2(game),
            'criteria_3': self.check_criteria_3(game)
        }
        
        # Extract match results and strengths
        matches = {
            'criteria_1': criteria_results['criteria_1']['matches'],
            'criteria_2': criteria_results['criteria_2']['matches'],
            'criteria_3': criteria_results['criteria_3']['matches']
        }
        
        strengths = {
            'criteria_1': criteria_results['criteria_1']['strength'],
            'criteria_2': criteria_results['criteria_2']['strength'],
            'criteria_3': criteria_results['criteria_3']['strength']
        }
        
        # Combine all checks from the criteria
        all_checks = {}
        for criteria, result in criteria_results.items():
            all_checks.update(result['checks'])
        
        # Calculate if any criteria matched
        any_match = any(matches.values())
        
        # Return analysis results
        return {
            'game': game,
            'matches': matches,
            'strengths': strengths,
            'any_match': any_match,
            'checks': all_checks
        }

    def analyze_daily_games(self, date=None):
        """Analyze all games for a given date."""
        if date is None:
            date = datetime.now().date()
        elif isinstance(date, str):
            date = datetime.strptime(date, '%Y-%m-%d').date()
        elif isinstance(date, datetime):
            date = date.date()  # Convert to date if it's a datetime

        print(f"Analyzing games for {date}")
        
        # Query for games on the specific date using date range
        start_of_day = datetime.combine(date, datetime.min.time())
        end_of_day = datetime.combine(date, datetime.max.time())
        
        # Debug print
        print(f"Analyzer searching for games between {start_of_day} and {end_of_day}")
        
        games = self.db_session.query(Game).filter(
            Game.game_date >= start_of_day,
            Game.game_date <= end_of_day
        ).all()
        
        print(f"Analyzer found {len(games)} games for analysis")
        
        # Deduplicate games based on away and home team combination
        unique_games = {}
        for game in games:
            game_key = f"{game.away_team}@{game.home_team}"
            if game_key not in unique_games:
                unique_games[game_key] = game
        
        # Convert back to list
        games = list(unique_games.values())
        
        # Print all games and their odds for debugging
        print(f"\nANALYZING {len(games)} UNIQUE GAMES:")
        for game in games:
            print(f"{game.away_team} ({game.away_odds if game.away_odds else 'None'}) @ {game.home_team} ({game.home_odds if game.home_odds else 'None'})")
        
        # Analyze each game that has odds
        results = []
        for game in games:
            # Skip games without odds
            if game.away_odds is None or game.home_odds is None:
                print(f"Skipping {game.away_team} @ {game.home_team} - missing odds data")
                continue
            
            # Skip future games for betting performance analysis
            today = datetime.now().date()
            game_date = game.game_date
            if isinstance(game_date, datetime):
                game_date = game_date.date()
                
            if game_date > today:
                # For future games, create analysis but skip betting performance
                print(f"Analyzing {game.away_team} @ {game.home_team} (future game - no performance data)")
            else:
                print(f"Analyzing {game.away_team} @ {game.home_team}")
            
            # Analyze game
            away_team = game.away_team
            home_team = game.home_team
            try:
                # Use the existing analyze_game method instead of individual analysis methods
                result = self.analyze_game(game)
                results.append(result)
            except Exception as e:
                print(f"Error analyzing {away_team} @ {home_team}: {e}")
                
        return results

    def get_team_record(self, team_name):
        """Get team record from database"""
        return self.db_session.query(TeamRecord).filter_by(team=team_name).first()
    
    def check_lost_last_game(self, team_name):
        """Check if team lost their last game"""
        # Use yesterday's date based on the current game being analyzed
        session = get_session()
        
        # Find completed games in the database for this team
        past_games = session.query(Game).filter(
            (Game.home_team == team_name) | (Game.away_team == team_name),
            Game.status == 'completed',
            Game.home_score != None, 
            Game.away_score != None
        ).order_by(Game.game_date.desc()).all()
        
        if not past_games:
            print(f"No completed games found for {team_name}")
            return False
            
        # Use the most recent game
        last_game = past_games[0]
            
        # Check if team lost
        if last_game.home_team == team_name:
            result = last_game.home_score < last_game.away_score
            print(f"Found last game for {team_name} (home): {'Lost' if result else 'Won'} {last_game.home_score}-{last_game.away_score} vs {last_game.away_team}")
            return result
        else:
            result = last_game.away_score < last_game.home_score
            print(f"Found last game for {team_name} (away): {'Lost' if result else 'Won'} {last_game.away_score}-{last_game.home_score} @ {last_game.home_team}")
            return result
    
    def check_consecutive_losses(self, team, opponent):
        """Check how many consecutive losses team has against opponent"""
        # Find recent games between these teams
        recent_matchups = self.db_session.query(Game).filter(
            (
                # Team was home, opponent was away
                ((Game.home_team == team) & (Game.away_team == opponent)) |
                # Team was away, opponent was home
                ((Game.away_team == team) & (Game.home_team == opponent))
            )
        ).order_by(Game.game_date.desc()).limit(3).all()
        
        consecutive_losses = 0
        for prev_game in recent_matchups:
            is_home = prev_game.home_team == team
            
            # Skip games without scores
            if prev_game.home_score is None or prev_game.away_score is None:
                break
                
            # Determine if team lost
            if is_home:
                lost = prev_game.home_score < prev_game.away_score
            else:
                lost = prev_game.away_score < prev_game.home_score
            
            if lost:
                consecutive_losses += 1
            else:
                break
        
        return consecutive_losses
    
    def check_previous_underdog(self, team, opponent):
        """Check if team was underdog in most recent loss to opponent"""
        # Find most recent game against this opponent
        recent_game = self.db_session.query(Game).filter(
            (
                # Team was home, opponent was away
                ((Game.home_team == team) & (Game.away_team == opponent)) |
                # Team was away, opponent was home
                ((Game.away_team == team) & (Game.home_team == opponent))
            )
        ).order_by(Game.game_date.desc()).first()
        
        if not recent_game:
            return False
            
        is_home = recent_game.home_team == team
        
        # Check if team was underdog
        if is_home:
            return recent_game.home_odds is not None and recent_game.home_odds > 2.05
        else:
            return recent_game.away_odds is not None and recent_game.away_odds > 2.05 

    def normalize_team_name(self, team_name):
        """Normalize team name to standard format for comparison."""
        if not team_name:
            return team_name
            
        # Check if the team name is in our mapping
        if team_name in self.team_name_map:
            return self.team_name_map[team_name]
            
        # If not, return the original name
        return team_name 