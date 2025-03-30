document.addEventListener('DOMContentLoaded', function() {
    // Initialize with today's date
    const today = new Date();
    updateDateDisplay(today);
    
    // Initialize date navigation
    initDateNavigation();
    
    // Initialize charts (will load data from API)
    loadStatsAndRenderCharts();
    
    // Initialize tab navigation
    initTabNavigation();
    
    // Load today's games on initial load
    loadGamesForDate(formatDateForAPI(today));
});

// Date navigation
function initDateNavigation() {
    const prevDateBtn = document.getElementById('prev-date');
    const nextDateBtn = document.getElementById('next-date');
    const currentDateSpan = document.getElementById('current-date');
    
    // Get current date from the span or use today
    let currentDate;
    if (currentDateSpan.textContent.trim()) {
        currentDate = new Date(currentDateSpan.textContent);
        if (isNaN(currentDate.getTime())) {
            // If date is invalid, use today's date
            currentDate = new Date();
        }
    } else {
        currentDate = new Date();
    }
    
    // Previous date button
    prevDateBtn.addEventListener('click', function() {
        currentDate.setDate(currentDate.getDate() - 1);
        updateDateDisplay(currentDate);
        loadGamesForDate(formatDateForAPI(currentDate));
    });
    
    // Next date button
    nextDateBtn.addEventListener('click', function() {
        // Don't allow navigating to future dates beyond today
        const today = new Date();
        today.setHours(0, 0, 0, 0);  // Set to beginning of day for comparison
        
        const nextDate = new Date(currentDate);
        nextDate.setDate(nextDate.getDate() + 1);
        nextDate.setHours(0, 0, 0, 0);  // Set to beginning of day for comparison
        
        if (nextDate <= today) {
            currentDate.setDate(currentDate.getDate() + 1);
            updateDateDisplay(currentDate);
            loadGamesForDate(formatDateForAPI(currentDate));
        } else {
            // Optional: Show a message that future dates are not available yet
            alert("Future dates are not available for analysis yet.");
        }
    });
}

// Format and display the date
function updateDateDisplay(date) {
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options);
    
    const currentDateSpan = document.getElementById('current-date');
    currentDateSpan.textContent = formattedDate;
    
    // Also update any other date displays
    const dateSpans = document.querySelectorAll('.date');
    dateSpans.forEach(span => {
        span.textContent = formattedDate;
    });
}

// Format date for API requests (YYYY-MM-DD)
function formatDateForAPI(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Tab navigation
function initTabNavigation() {
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(l => l.parentElement.classList.remove('active'));
            
            // Add active class to clicked link
            this.parentElement.classList.add('active');
            
            // Get the target section
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            // Handle tab-specific loading
            if (targetId === 'best-bets') {
                // Get the current date from the display
                const currentDate = new Date(document.getElementById('current-date').textContent);
                loadBestBets(formatDateForAPI(currentDate));
            }
            
            // Scroll to the section
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// Load games for a specific date
function loadGamesForDate(dateStr) {
    const gamesContainer = document.querySelector('.games-container');
    showLoading(gamesContainer);
    
    // Clear existing games
    gamesContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i><p>Loading games...</p></div>';
    
    fetch(`/api/games/${dateStr}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            
            // Update games display
            renderGames(data.games);
            
            // Update summary stats
            updateSummaryCards(data.summary);
            
            hideLoading(gamesContainer);
        })
        .catch(error => {
            console.error('Error fetching games:', error);
            gamesContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Failed to load games: ${error.message}</p>
                    <button onclick="retryLoadGames('${dateStr}')">Retry</button>
                </div>
            `;
        });
}

// Function to retry loading games
function retryLoadGames(dateStr) {
    loadGamesForDate(dateStr);
}

// Load stats and render charts
function loadStatsAndRenderCharts() {
    const chartsContainer = document.querySelector('.charts-container');
    
    fetch('/api/stats')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            
            renderCharts(data);
            updateTrendStats(data.criteria_stats);
            
            // Update YTD record in the summary
            if (data.overall_record) {
                document.getElementById('ytd-record').textContent = data.overall_record;
            }
        })
        .catch(error => {
            console.error('Error fetching stats:', error);
            chartsContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Failed to load statistics: ${error.message}</p>
                    <button onclick="loadStatsAndRenderCharts()">Retry</button>
                </div>
            `;
        });
}

// Load best bets for a specific date
function loadBestBets(dateStr) {
    const container = document.querySelector('.best-bets-container');
    
    // Clear existing content and show loading
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i><p>Loading best bets...</p></div>';
    
    fetch(`/api/best-bets/${dateStr}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }
            return response.json();
        })
        .then(bets => {
            if (bets.error) {
                throw new Error(bets.error);
            }
            
            renderBestBets(bets);
        })
        .catch(error => {
            console.error('Error fetching best bets:', error);
            container.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Failed to load best bets: ${error.message}</p>
                    <button onclick="loadBestBets('${dateStr}')">Retry</button>
                </div>
            `;
        });
}

// Render games into the games container
function renderGames(games) {
    const gamesContainer = document.querySelector('.games-container');
    
    // Clear existing games
    gamesContainer.innerHTML = '';
    
    if (!games || games.length === 0) {
        gamesContainer.innerHTML = '<div class="no-data">No games available for this date.</div>';
        return;
    }
    
    // Add each game
    games.forEach(game => {
        const gameCard = createGameCard(game);
        gamesContainer.appendChild(gameCard);
    });
}

// Render best bets into the best bets container
function renderBestBets(bets) {
    const container = document.querySelector('.best-bets-container');
    
    // Clear existing content
    container.innerHTML = '';
    
    if (!bets || bets.length === 0) {
        container.innerHTML = '<div class="no-data">No recommended bets for this date.</div>';
        return;
    }
    
    // Add each bet
    bets.forEach(bet => {
        const betElement = document.createElement('div');
        betElement.className = 'best-bet';
        
        // Format the matchup string to be more readable
        let matchupText = bet.matchup;
        let betTeam = bet.bet.split(' ')[0]; // Extract team name from "TeamName +123"
        
        // Remove the bet team from the matchup for cleaner display
        matchupText = matchupText.replace(betTeam, '').replace(' @ ', ' vs ');
        if (matchupText.startsWith(' vs ')) {
            matchupText = matchupText.substring(4); // Remove leading ' vs '
        }
        
        betElement.innerHTML = `
            <div class="bet-rank">${bet.rank}</div>
            <div class="bet-details">
                <div class="matchup">${bet.bet} vs ${matchupText}</div>
                <div class="criteria">${bet.criteria}</div>
                <div class="strength">Strength: ${parseFloat(bet.strength).toFixed(2)}</div>
            </div>
        `;
        
        container.appendChild(betElement);
    });
}

// Create a game card element
function createGameCard(game) {
    const isRecommendation = game.anyMatch;
    
    // Create game card element
    const card = document.createElement('div');
    card.className = `game-card${isRecommendation ? ' recommendation' : ''}`;
    
    // Get the team to bet on
    const betTeam = game.betOnHome ? game.homeTeam : (game.betOnAway ? game.awayTeam : null);
    
    // Format team records if available
    let awayRecordText = '';
    let homeRecordText = '';
    
    if (game.awayRecord) {
        awayRecordText = `${game.awayTeam}: ${game.awayRecord}`;
    }
    
    if (game.homeRecord) {
        homeRecordText = `${game.homeTeam}: ${game.homeRecord}`;
    }
    
    // Format criteria text
    let criteriaText = 'No matching criteria';
    let criteriaClass = '';
    
    if (game.criteriaMatched && game.criteriaMatched.length > 0) {
        criteriaText = game.criteriaMatched[0]; // Just show the first criteria for simplicity
        criteriaClass = 'matched';
    }
    
    // Build HTML structure for the card
    let cardHTML = `
        ${isRecommendation ? '<div class="recommendation-badge">RECOMMENDED BET</div>' : ''}
        <div class="game-header">
            <div class="game-time">${game.time || 'TBD'}</div>
            <div class="matchup">
                <div class="team away">
                    <img src="${game.awayLogo || `https://a.espncdn.com/i/teamlogos/mlb/500/${game.awayTeam.toLowerCase().substring(0, 3)}.png`}" alt="${game.awayTeam}">
                    <span>${game.awayTeam}</span>
                </div>
                <div class="at">@</div>
                <div class="team home">
                    <img src="${game.homeLogo || `https://a.espncdn.com/i/teamlogos/mlb/500/${game.homeTeam.toLowerCase().substring(0, 3)}.png`}" alt="${game.homeTeam}">
                    <span>${game.homeTeam}</span>
                </div>
            </div>
        </div>
        <div class="game-odds">
            <div class="odds away${game.betOnAway ? ' highlight' : ''}">
                <div class="american">${game.awayOddsAmerican}</div>
                <div class="decimal">(${game.awayOddsDecimal ? game.awayOddsDecimal.toFixed(2) : 'N/A'})</div>
            </div>
            <div class="odds home${game.betOnHome ? ' highlight' : ''}">
                <div class="american">${game.homeOddsAmerican}</div>
                <div class="decimal">(${game.homeOddsDecimal ? game.homeOddsDecimal.toFixed(2) : 'N/A'})</div>
            </div>
        </div>
        <div class="analysis-details">
            <div class="strength-meter">
                <div class="label">Bet Strength:</div>
                <div class="meter">
                    <div class="fill" style="width: ${Math.round(game.strength * 100)}%"></div>
                </div>
                <div class="value">${game.strength.toFixed(2)}</div>
            </div>
            <div class="criteria-list">
                <div class="criteria ${criteriaClass}">
                    <i class="fas ${isRecommendation ? 'fa-check' : 'fa-times'}"></i> ${criteriaText}
                </div>
                ${(awayRecordText || homeRecordText) ? `
                <div class="records">
                    ${awayRecordText ? `<div class="away">${awayRecordText}</div>` : ''}
                    ${homeRecordText ? `<div class="home">${homeRecordText}</div>` : ''}
                </div>
                ` : ''}
            </div>
            <button class="toggle-detailed-analysis">View Detailed Analysis</button>
        </div>
        <div class="detailed-analysis" style="display: none;">
            <h4>Complete Criteria Analysis</h4>
            
            <div class="criteria-detail">
                <h5>Criteria 1: Road Underdog Analysis</h5>
                <div class="criteria-checks">
                    <div class="check ${game.criteria1?.underdogOdds ? 'passed' : 'failed'}">
                        <i class="fas ${game.criteria1?.underdogOdds ? 'fa-check' : 'fa-times'}"></i>
                        Road team underdog odds in range: ${game.criteria1?.underdogOdds ? 'Yes' : 'No'}
                    </div>
                    <div class="check ${game.criteria1?.recordsMet ? 'passed' : 'failed'}">
                        <i class="fas ${game.criteria1?.recordsMet ? 'fa-check' : 'fa-times'}"></i>
                        Records criteria met: ${game.criteria1?.recordsMet ? 'Yes' : 'No'}
                    </div>
                    <div class="check ${game.criteria1?.lostLast ? 'passed' : 'failed'}">
                        <i class="fas ${game.criteria1?.lostLast ? 'fa-check' : 'fa-times'}"></i>
                        Lost last game: ${game.criteria1?.lostLast ? 'Yes' : 'No'}
                    </div>
                </div>
                <div class="criteria-result ${game.criteria1?.matches ? 'match' : 'no-match'}">
                    <span class="result-label">MATCH:</span>
                    <span class="result-value">${game.criteria1?.matches ? '✅' : '❌'}</span>
                    <span class="strength">Strength: ${game.criteria1?.strength.toFixed(2)}</span>
                </div>
            </div>
            
            <div class="criteria-detail">
                <h5>Criteria 2: April Underdog Analysis</h5>
                <div class="criteria-checks">
                    <div class="check ${game.criteria2?.isApril ? 'passed' : 'failed'}">
                        <i class="fas ${game.criteria2?.isApril ? 'fa-check' : 'fa-times'}"></i>
                        Game in April: ${game.criteria2?.isApril ? 'Yes' : 'No'}
                    </div>
                    <div class="check ${game.criteria2?.isUnderdog ? 'passed' : 'failed'}">
                        <i class="fas ${game.criteria2?.isUnderdog ? 'fa-check' : 'fa-times'}"></i>
                        Is underdog (+105 or more): ${game.criteria2?.isUnderdog ? 'Yes' : 'No'}
                    </div>
                    <div class="check ${game.criteria2?.consecutiveLosses >= 2 ? 'passed' : 'failed'}">
                        <i class="fas ${game.criteria2?.consecutiveLosses >= 2 ? 'fa-check' : 'fa-times'}"></i>
                        Consecutive losses: ${game.criteria2?.consecutiveLosses || 0}/2
                    </div>
                    <div class="check ${game.criteria2?.wasUnderdog ? 'passed' : 'failed'}">
                        <i class="fas ${game.criteria2?.wasUnderdog ? 'fa-check' : 'fa-times'}"></i>
                        Was underdog in last loss: ${game.criteria2?.wasUnderdog ? 'Yes' : 'No'}
                    </div>
                </div>
                <div class="criteria-result ${game.criteria2?.matches ? 'match' : 'no-match'}">
                    <span class="result-label">MATCH:</span>
                    <span class="result-value">${game.criteria2?.matches ? '✅' : '❌'}</span>
                    <span class="strength">Strength: ${game.criteria2?.strength.toFixed(2)}</span>
                </div>
            </div>
            
            <div class="criteria-detail">
                <h5>Criteria 3: Home Underdog After High Scoring Game</h5>
                <div class="criteria-checks">
                    <div class="check ${game.criteria3?.isHomeUnderdog ? 'passed' : 'failed'}">
                        <i class="fas ${game.criteria3?.isHomeUnderdog ? 'fa-check' : 'fa-times'}"></i>
                        Home team is underdog: ${game.criteria3?.isHomeUnderdog ? 'Yes' : 'No'}
                    </div>
                    <div class="check ${game.criteria3?.previousRuns >= 10 ? 'passed' : 'failed'}">
                        <i class="fas ${game.criteria3?.previousRuns >= 10 ? 'fa-check' : 'fa-times'}"></i>
                        Previous game runs: ${game.criteria3?.previousRuns || 0}
                    </div>
                </div>
                <div class="criteria-result ${game.criteria3?.matches ? 'match' : 'no-match'}">
                    <span class="result-label">MATCH:</span>
                    <span class="result-value">${game.criteria3?.matches ? '✅' : '❌'}</span>
                    <span class="strength">Strength: ${game.criteria3?.strength.toFixed(2)}</span>
                </div>
            </div>
        </div>
    `;
    
    card.innerHTML = cardHTML;
    
    // Add event listener for the "View Detailed Analysis" button
    card.querySelector('.toggle-detailed-analysis').addEventListener('click', function() {
        const detailedSection = card.querySelector('.detailed-analysis');
        const isHidden = detailedSection.style.display === 'none';
        
        detailedSection.style.display = isHidden ? 'block' : 'none';
        this.textContent = isHidden ? 'Hide Detailed Analysis' : 'View Detailed Analysis';
    });
    
    return card;
}

// Update summary cards with current data
function updateSummaryCards(summary) {
    if (!summary) return;
    
    // Update the summary cards at the top of the page
    document.getElementById('games-analyzed').textContent = summary.totalGames || '0';
    document.getElementById('games-matching').textContent = summary.matchingGames || '0';
    
    // Format the best strength
    const bestStrength = summary.bestStrength || 0;
    document.getElementById('best-strength').textContent = bestStrength.toFixed(2);
    
    // Update YTD record if available
    if (summary.record) {
        document.getElementById('ytd-record').textContent = summary.record;
    }
}

// Update trend statistics
function updateTrendStats(stats) {
    if (!stats) return;
    
    // Update each criteria stats display
    for (let i = 1; i <= 3; i++) {
        const stat = stats[`criteria_${i}`];
        if (stat) {
            const wins = stat.wins || 0;
            const losses = stat.losses || 0;
            const pushes = stat.pushes || 0;
            const winPct = stat.win_pct || 0;
            
            // Format: "W-L-P (Win%)"
            let statText = `${wins}-${losses}`;
            if (pushes > 0) {
                statText += `-${pushes}`;
            }
            statText += ` (${winPct}%)`;
            
            document.getElementById(`criteria-${i}-stat`).textContent = statText;
        }
    }
}

// Render charts with the stats data
function renderCharts(data) {
    if (!data || !data.criteria_stats || !data.monthly_stats) {
        console.error('Invalid data format for charts');
        return;
    }
    
    // Criteria performance chart
    const criteriaCtx = document.getElementById('criteria-chart').getContext('2d');
    const criteriaData = {
        labels: ['Criteria 1', 'Criteria 2', 'Criteria 3'],
        datasets: [
            {
                label: 'Win %',
                data: [
                    data.criteria_stats.criteria_1?.win_pct || 0,
                    data.criteria_stats.criteria_2?.win_pct || 0,
                    data.criteria_stats.criteria_3?.win_pct || 0
                ],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(153, 102, 255, 0.6)'
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1
            }
        ]
    };
    
    new Chart(criteriaCtx, {
        type: 'bar',
        data: criteriaData,
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Win Percentage'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
    
    // Monthly ROI chart
    const monthlyCtx = document.getElementById('monthly-chart').getContext('2d');
    const monthlyData = {
        labels: data.monthly_stats.map(m => m.month),
        datasets: [
            {
                label: 'ROI %',
                data: data.monthly_stats.map(m => m.roi),
                backgroundColor: 'rgba(255, 159, 64, 0.6)',
                borderColor: 'rgba(255, 159, 64, 1)',
                borderWidth: 1,
                fill: false
            }
        ]
    };
    
    new Chart(monthlyCtx, {
        type: 'line',
        data: monthlyData,
        options: {
            responsive: true,
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'ROI %'
                    }
                }
            }
        }
    });
}

// Show loading indicator
function showLoading(container) {
    // If container is a string selector, get the element
    if (typeof container === 'string') {
        container = document.querySelector(container);
    }
    
    if (!container) return;
    
    // Check if loading indicator already exists
    let loadingEl = container.querySelector('.loading');
    
    if (!loadingEl) {
        // Create and add loading indicator
        loadingEl = document.createElement('div');
        loadingEl.className = 'loading';
        loadingEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i><p>Loading...</p>';
        container.appendChild(loadingEl);
    }
}

// Hide loading indicator
function hideLoading(container) {
    // If container is a string selector, get the element
    if (typeof container === 'string') {
        container = document.querySelector(container);
    }
    
    if (!container) return;
    
    // Remove loading indicators
    const loadingElements = container.querySelectorAll('.loading');
    loadingElements.forEach(el => {
        el.remove();
    });
} 