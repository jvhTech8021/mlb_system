function createGameCard(game) {
    // Create game card container
    const card = document.createElement('div');
    card.className = 'game-card';
    card.setAttribute('data-game-id', game.id);
    
    // Create team info section
    const teamInfoSection = document.createElement('div');
    teamInfoSection.className = 'team-info';
    
    // Away team
    const awayTeamDiv = document.createElement('div');
    awayTeamDiv.className = 'team away';
    
    const awayLogo = document.createElement('img');
    awayLogo.src = game.awayLogo || 'static/images/mlb_logo.png';
    awayLogo.alt = game.awayTeam + ' logo';
    awayLogo.className = 'team-logo';
    
    const awayTeamName = document.createElement('p');
    awayTeamName.className = 'team-name';
    awayTeamName.textContent = game.awayTeam;
    
    const awayRecord = document.createElement('p');
    awayRecord.className = 'team-record';
    awayRecord.textContent = game.awayRecord ? game.awayRecord : '0-0';
    
    const awayOdds = document.createElement('p');
    awayOdds.className = 'odds';
    awayOdds.textContent = game.awayOddsAmerican;
    
    awayTeamDiv.appendChild(awayLogo);
    awayTeamDiv.appendChild(awayTeamName);
    awayTeamDiv.appendChild(awayRecord);
    awayTeamDiv.appendChild(awayOdds);
    
    // Game info (middle section)
    const gameInfo = document.createElement('div');
    gameInfo.className = 'game-info';
    
    const gameDate = document.createElement('p');
    gameDate.className = 'game-date';
    gameDate.textContent = formatDate(game.date);
    
    const gameTime = document.createElement('p');
    gameTime.className = 'game-time';
    gameTime.textContent = game.time;
    
    const overUnder = document.createElement('p');
    overUnder.className = 'over-under';
    overUnder.textContent = game.overUnder ? `O/U: ${game.overUnder}` : '';
    
    gameInfo.appendChild(gameDate);
    gameInfo.appendChild(gameTime);
    gameInfo.appendChild(overUnder);
    
    // Home team
    const homeTeamDiv = document.createElement('div');
    homeTeamDiv.className = 'team home';
    
    const homeLogo = document.createElement('img');
    homeLogo.src = game.homeLogo || 'static/images/mlb_logo.png';
    homeLogo.alt = game.homeTeam + ' logo';
    homeLogo.className = 'team-logo';
    
    const homeTeamName = document.createElement('p');
    homeTeamName.className = 'team-name';
    homeTeamName.textContent = game.homeTeam;
    
    const homeRecord = document.createElement('p');
    homeRecord.className = 'team-record';
    homeRecord.textContent = game.homeRecord ? game.homeRecord : '0-0';
    
    const homeOdds = document.createElement('p');
    homeOdds.className = 'odds';
    homeOdds.textContent = game.homeOddsAmerican;
    
    homeTeamDiv.appendChild(homeLogo);
    homeTeamDiv.appendChild(homeTeamName);
    homeTeamDiv.appendChild(homeRecord);
    homeTeamDiv.appendChild(homeOdds);
    
    // Add team sections to team info container
    teamInfoSection.appendChild(awayTeamDiv);
    teamInfoSection.appendChild(gameInfo);
    teamInfoSection.appendChild(homeTeamDiv);
    
    // Create criteria section
    const criteriaSection = document.createElement('div');
    criteriaSection.className = 'criteria-section';
    
    if (game.anyMatch) {
        // Game matches criteria
        criteriaSection.classList.add('match');
        
        const criteriaText = document.createElement('p');
        criteriaText.className = 'criteria-text';
        criteriaText.textContent = 'Criteria Met: ' + game.criteriaMatched.join(', ');
        
        const betText = document.createElement('p');
        betText.className = 'bet-text';
        if (game.betOnHome) {
            betText.textContent = 'Recommended Bet: ' + game.homeTeam;
            betText.innerHTML += ' <span class="odds">(' + game.homeOddsAmerican + ')</span>';
        } else if (game.betOnAway) {
            betText.textContent = 'Recommended Bet: ' + game.awayTeam;
            betText.innerHTML += ' <span class="odds">(' + game.awayOddsAmerican + ')</span>';
        }
        
        const strengthDiv = document.createElement('div');
        strengthDiv.className = 'strength';
        strengthDiv.innerHTML = '<span>Strength:</span> <span class="strength-value">' + game.strength.toFixed(2) + '</span>';
        
        criteriaSection.appendChild(criteriaText);
        criteriaSection.appendChild(betText);
        criteriaSection.appendChild(strengthDiv);
    } else {
        // Game doesn't match criteria
        criteriaSection.classList.add('no-match');
        
        const noMatchText = document.createElement('p');
        noMatchText.textContent = 'No criteria matched';
        criteriaSection.appendChild(noMatchText);
    }
    
    // Create a toggle button for detailed analysis
    const toggleDetailsButton = document.createElement('button');
    toggleDetailsButton.className = 'toggle-details-btn';
    toggleDetailsButton.textContent = 'View Detailed Analysis';
    toggleDetailsButton.onclick = function() {
        const detailsSection = card.querySelector('.detailed-analysis');
        if (detailsSection.style.display === 'none' || !detailsSection.style.display) {
            detailsSection.style.display = 'block';
            toggleDetailsButton.textContent = 'Hide Detailed Analysis';
        } else {
            detailsSection.style.display = 'none';
            toggleDetailsButton.textContent = 'View Detailed Analysis';
        }
    };
    
    // Create detailed analysis section (hidden by default)
    const detailedAnalysisSection = document.createElement('div');
    detailedAnalysisSection.className = 'detailed-analysis';
    detailedAnalysisSection.style.display = 'none';
    
    // Create sections for each criteria
    const criteria1Section = createCriteriaDetailSection(
        'Road Underdog Analysis',
        [
            { label: 'Is Road Team Underdog?', value: game.criteria1.underdogOdds ? 'YES' : 'NO' },
            { label: 'Records Check', value: game.criteria1.recordsMet ? 'PASS' : 'FAIL', 
              detail: `Away: ${game.criteria1.awayRecord}, Home: ${game.criteria1.homeRecord}` },
            { label: 'Road Team Lost Last Game?', value: game.criteria1.lostLast ? 'YES' : 'NO' }
        ],
        game.criteria1.matches,
        game.criteria1.strength
    );
    
    const criteria2Section = createCriteriaDetailSection(
        'April Underdog Analysis',
        [
            { label: 'Is April?', value: game.criteria2.isApril ? 'YES' : 'NO' },
            { label: 'Is Underdog?', value: game.criteria2.isUnderdog ? 'YES' : 'NO' },
            { label: 'Consecutive Losses', value: game.criteria2.consecutiveLosses.toString() },
            { label: 'Was Underdog in Previous Losses?', value: game.criteria2.wasUnderdog ? 'YES' : 'NO' }
        ],
        game.criteria2.matches,
        game.criteria2.strength
    );
    
    const criteria3Section = createCriteriaDetailSection(
        'Home Underdog After High Scoring Game',
        [
            { label: 'Is Home Team Underdog?', value: game.criteria3.isHomeUnderdog ? 'YES' : 'NO' },
            { label: 'Previous Game Runs', value: game.criteria3.previousRuns.toString() }
        ],
        game.criteria3.matches,
        game.criteria3.strength
    );
    
    detailedAnalysisSection.appendChild(criteria1Section);
    detailedAnalysisSection.appendChild(criteria2Section);
    detailedAnalysisSection.appendChild(criteria3Section);
    
    // Add all sections to the card
    card.appendChild(teamInfoSection);
    card.appendChild(criteriaSection);
    card.appendChild(toggleDetailsButton);
    card.appendChild(detailedAnalysisSection);
    
    return card;
}

function createCriteriaDetailSection(title, checks, matches, strength) {
    const section = document.createElement('div');
    section.className = 'criteria-detail';
    
    // Title
    const titleElem = document.createElement('h4');
    titleElem.textContent = title;
    section.appendChild(titleElem);
    
    // Checks list
    const checksList = document.createElement('ul');
    checksList.className = 'criteria-checks';
    
    checks.forEach(check => {
        const checkItem = document.createElement('li');
        checkItem.innerHTML = `<span class="check-label">${check.label}:</span> <span class="check-value">${check.value}</span>`;
        
        if (check.detail) {
            checkItem.innerHTML += `<br><span class="check-detail">${check.detail}</span>`;
        }
        
        checksList.appendChild(checkItem);
    });
    
    section.appendChild(checksList);
    
    // Result
    const resultDiv = document.createElement('div');
    resultDiv.className = matches ? 'criteria-result match' : 'criteria-result no-match';
    resultDiv.innerHTML = `<strong>Result:</strong> ${matches ? 'MATCH' : 'NO MATCH'} <span class="strength-value">(Strength: ${strength.toFixed(2)})</span>`;
    
    section.appendChild(resultDiv);
    
    return section;
} 