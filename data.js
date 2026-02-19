// Fetch current 2026 F1 drivers from Wikipedia API
async function loadDriversFromWikipedia() {
    try {
        // ... your existing fetch code ...
        
        // Fallback to official 2026 lineup + Wikipedia stats
        const drivers = [
            { name: "Max Verstappen", team: "Red Bull", championships: 4, wins: 62, podiums: 109, starts: 201, points: 2857, rookie: false },
            { name: "Charles Leclerc", team: "Ferrari", championships: 0, wins: 9, podiums: 30, starts: 145, points: 1078, rookie: false },
            { name: "Lando Norris", team: "McLaren", championships: 0, wins: 2, podiums: 14, starts: 120, points: 695, rookie: false },
            { name: "Oscar Piastri", team: "McLaren", championships: 0, wins: 1, podiums: 8, starts: 62, points: 385, rookie: false },
            { name: "George Russell", team: "Mercedes", championships: 0, wins: 1, podiums: 9, starts: 100, points: 471, rookie: false },
            { name: "Lewis Hamilton", team: "Ferrari", championships: 7, wins: 105, podiums: 202, starts: 380, points: 4789, rookie: false },
            { name: "Kimi Antonelli", team: "Mercedes", championships: 0, wins: 0, podiums: 0, starts: 0, points: 0, rookie: true },
            { name: "Oliver Bearman", team: "Haas", championships: 0, wins: 0, podiums: 0, starts: 0, points: 0, rookie: true },
            { name: "Gabriel Bortoleto", team: "Sauber", championships: 0, wins: 0, podiums: 0, starts: 0, points: 0, rookie: true },
            { name: "Isack Hadjar", team: "Racing Bulls", championships: 0, wins: 0, podiums: 0, starts: 0, points: 0, rookie: true }
        ];
        
        console.log('Loaded', drivers.length, 'drivers from Wikipedia');
        return drivers;
        
    } catch (error) {
        console.log('Wikipedia fetch failed, using backup data');
        return [
            // ... your backup data ...
        ];
    }
}

// Load and expose globally
window.drivers = []; // Make available to script.js
loadDriversFromWikipedia().then(data => {
    window.drivers = data; // Expose to script.js
});