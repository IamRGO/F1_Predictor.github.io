const API_BASE = "https://en.wikipedia.org/w/api.php?origin=*";

async function getPageContent(title) {
    const url = `${API_BASE}&action=parse&page=${encodeURIComponent(title)}&format=json`;
    const response = await fetch(url);
    const data = await response.json();
    return data.parse.text["*"];
}

function extractDriversFromEntries(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const tables = doc.querySelectorAll("table.wikitable");

    let drivers = [];

    tables.forEach(table => {
        const rows = table.querySelectorAll("tr");
        rows.forEach(row => {
            const link = row.querySelector("a");
            if (link && link.getAttribute("title")?.includes("Grand Prix")) {
                drivers.push(link.getAttribute("title"));
            }
        });
    });

    return [...new Set(drivers)];
}

async function getDriverWins(driverName) {
    const html = await getPageContent(driverName);

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const rows = doc.querySelectorAll("table.infobox tr");

    let wins = "N/A";

    rows.forEach(row => {
        if (row.textContent.includes("Wins")) {
            wins = row.querySelector("td")?.textContent.trim();
        }
    });

    return wins;
}

async function loadDrivers() {
    const container = document.getElementById("Entries");
    container.innerHTML = "Loading drivers...";

    const pageHTML = await getPageContent("2026_Formula_One_World_Championship");

    const drivers = extractDriversFromEntries(pageHTML);

    container.innerHTML = "";

    for (const driver of drivers.slice(0, 10)) {
        const wins = await getDriverWins(driver);

        container.innerHTML += `
            <div class="driver-card">
                <h2>${driver}</h2>
                <p>Wins: ${wins}</p>
            </div>
        `;
    }
}

loadDrivers();