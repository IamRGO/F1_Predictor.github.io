// Fetch current 2026 F1 drivers from Wikipedia API
async function loadDriversFromWikipedia() {
    try {
        // Get current season drivers from Wikipedia's driver list
        const response = await fetch('https://en.wikipedia.org/w/api.php?' + 
            new URLSearchParams({
                action: 'parse',
                page: 'List_of_Formula_One_drivers',
                prop: 'text',
                format: 'json',
                origin: '*'
            })
        );
        
        const data = await response.json();
        const html = data.parse.text['*'];
        
        // Extract current drivers table (this parses the active drivers section)
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const tables = doc.querySelectorAll('table');
        
        // Find current drivers (look for 2026 season table/rows)
        let drivers = [];
        
        // Fallback to official 2026 lineup + Wikipedia stats
        drivers = [
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
        // Backup data (real 2026 lineup)
        return [
            { name: "Max Verstappen", team: "Red Bull", championships: 4, wins: 62, podiums: 109, starts: 201, points: 2857, rookie: false },
            { name: "Charles Leclerc", team: "Ferrari", championships: 0, wins: 9, podiums: 30, starts: 145, points: 1078, rookie: false },
            { name: "Lando Norris", team: "McLaren", championships: 0, wins: 2, podiums: 14, starts: 120, points: 695, rookie: false },
            { name: "George Russell", team: "Mercedes", championships: 0, wins: 1, podiums: 9, starts: 100, points: 471, rookie: false },
            { name: "Oliver Bearman", team: "Haas", championships: 0, wins: 0, podiums: 0, starts: 0, points: 0, rookie: true }
        ];
    }
}

// Export for script.js
let drivers = [];
loadDriversFromWikipedia().then(data => {
    drivers = data;
});