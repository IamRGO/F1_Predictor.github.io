// Sort: championships > wins > points (rookies last)
function sortDrivers(drivers) {
    return drivers.sort((a, b) => {
        if (a.rookie && !b.rookie) return 1;
        if (!a.rookie && b.rookie) return -1;
        if (a.championships !== b.championships) return b.championships - a.championships;
        if (a.wins !== b.wins) return b.wins - a.wins;
        return b.points - a.points;
    });
}

// Wikipedia API fetch function (add CORS proxy later)
async function fetchWikipediaData() {
    try {
        const response = await fetch('https://en.wikipedia.org/w/api.php?action=parse&format=json&prop=text&page=List_of_Formula_One_drivers&origin=*');
        const data = await response.json();
        console.log('Wikipedia data:', data);
    } catch (error) {
        console.log('Wikipedia fetch failed, using cached data');
    }
}

// Render drivers
function renderDrivers() {
    const grid = document.getElementById('driversGrid');
    
    // Wait for drivers to be loaded from data.js
    if (!window.drivers || window.drivers.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #ffcc00;">Loading F1 drivers from Wikipedia...</div>';
        return;
    }
    
    const sortedDrivers = sortDrivers([...window.drivers]);
    
    grid.innerHTML = sortedDrivers.map(driver => `
        <div class="driver-card ${driver.rookie ? 'rookie' : ''}" onclick="showModal('${driver.name.replace(/'/g, "\\'")}')">
            <div class="driver-name">${driver.name}</div>
            <div class="driver-team">${driver.team}</div>
            <div class="stats-grid">
                <div class="stat"><div class="stat-value">${driver.championships}</div><div class="stat-label">Titles</div></div>
                <div class="stat"><div class="stat-value">${driver.wins}</div><div class="stat-label">Wins</div></div>
                <div class="stat"><div class="stat-value">${driver.podiums}</div><div class="stat-label">Podiums</div></div>
                <div class="stat"><div class="stat-value">${driver.starts}</div><div class="stat-label">Starts</div></div>
                <div class="stat"><div class="stat-value">${driver.points.toLocaleString()}</div><div class="stat-label">Points</div></div>
            </div>
            ${driver.rookie ? '<div style="margin-top:10px;color:#00ff88;font-weight:bold;">🥇 ROOKIE</div>' : ''}
        </div>
    `).join('');
}

function showModal(driverName) {
    const driver = window.drivers.find(d => d.name === driverName);
    if (!driver) return;
    
    document.getElementById('modalName').textContent = driver.name;
    document.getElementById('modalStats').innerHTML = `
        <p><strong>Team:</strong> ${driver.team}</p>
        <p><strong>Championships:</strong> ${driver.championships}</p>
        <p><strong>Wins:</strong> ${driver.wins}</p>
        <p><strong>Podiums:</strong> ${driver.podiums}</p>
        <p><strong>Starts:</strong> ${driver.starts.toLocaleString()}</p>
        <p><strong>Total Points:</strong> ${driver.points.toLocaleString()}</p>
        ${driver.rookie ? '<p style="color:#00ff88;font-weight:bold;">🥇 Debut Season</p>' : ''}
    `;
    document.getElementById('modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

// Load when page + data ready
function initApp() {
    renderDrivers();
    fetchWikipediaData();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Close modal on outside click
window.onclick = (e) => {
    if (e.target.id === 'modal') closeModal();
}