// Fetch current 2026 F1 drivers from Wikipedia API
async function loadDriversFromWikipedia() {
    try {
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
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const tables = doc.querySelectorAll('table');
        
        let drivers = []; // TODO: parse tables for real data
        
        console.log('Wikipedia fetch successful');
        return drivers;
        
    } catch (error) {
        console.log('Wikipedia fetch failed, using 2026 lineup');
        // FIXED: Actual backup data
        return [
            { name: "Max Verstappen backup", team: "Red Bull", championships: 4, wins: 62, podiums: 109, starts: 201, points: 2857, rookie: false },
            { name: "Charles Leclerc backup", team: "Ferrari", championships: 0, wins: 9, podiums: 30, starts: 145, points: 1078, rookie: false },
            { name: "Lando Norris backup", team: "McLaren", championships: 0, wins: 2, podiums: 14, starts: 120, points: 695, rookie: false },
            { name: "Oscar Piastri backup", team: "McLaren", championships: 0, wins: 1, podiums: 8, starts: 62, points: 385, rookie: false },
            { name: "George Russell backup", team: "Mercedes", championships: 0, wins: 1, podiums: 9, starts: 100, points: 471, rookie: false },
            { name: "Lewis Hamilton backup", team: "Ferrari", championships: 7, wins: 105, podiums: 202, starts: 380, points: 4789, rookie: false },
            { name: "Kimi Antonelli backup", team: "Mercedes", championships: 0, wins: 0, podiums: 0, starts: 0, points: 0, rookie: true },
            { name: "Oliver Bearman backup", team: "Haas", championships: 0, wins: 0, podiums: 0, starts: 0, points: 0, rookie: true },
            { name: "Gabriel Bortoleto backup", team: "Sauber", championships: 0, wins: 0, podiums: 0, starts: 0, points: 0, rookie: true },
            { name: "Isack Hadjar backup", team: "Racing Bulls", championships: 0, wins: 0, podiums: 0, starts: 0, points: 0, rookie: true }
        ];
    }
}

// Load and expose globally
window.drivers = [];
loadDriversFromWikipedia().then(data => {
    window.drivers = data;
    console.log('Drivers loaded:', window.drivers.length);
});