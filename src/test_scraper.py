from scraper import MLBScraper
from pathlib import Path
import glob

def main():
    print("Running MLB Scraper Tests...")
    
    # Find all scrape output files in the test_results/debug directory
    debug_dir = Path('test_results/debug')
    scrape_files = list(debug_dir.glob('content_debug_*.txt'))
    
    if not scrape_files:
        print("No scrape output files found in test_results/debug directory")
        return
    
    scraper = MLBScraper()
    all_results = []
    
    for file in scrape_files:
        print(f"\nTesting {file.name}...")
        results = scraper.test_scrape_output(str(file))
        all_results.append(results)
        
        # Print summary for this file
        print(f"Found {results['summary']['total_games_found']} games")
        print(f"Successfully parsed: {results['summary']['successfully_parsed']}")
        if results['summary']['parsing_errors'] > 0:
            print(f"Errors: {results['summary']['parsing_errors']}")
            for error in results['errors']:
                print(f"  - {error}")
    
    # Print overall summary
    total_games = sum(r['summary']['total_games_found'] for r in all_results)
    total_parsed = sum(r['summary']['successfully_parsed'] for r in all_results)
    total_errors = sum(r['summary']['parsing_errors'] for r in all_results)
    
    print("\nOverall Summary:")
    print(f"Files tested: {len(all_results)}")
    print(f"Total games found: {total_games}")
    print(f"Successfully parsed: {total_parsed}")
    print(f"Total errors: {total_errors}")
    
    if total_errors > 0:
        print("\nAll Errors:")
        for result in all_results:
            if result['errors']:
                print(f"\nFile: {result['scrape_file']}")
                for error in result['errors']:
                    print(f"  - {error}")

if __name__ == "__main__":
    main() 