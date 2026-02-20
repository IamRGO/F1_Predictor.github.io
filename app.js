const API_BASE = "https://en.wikipedia.org/w/api.php?origin=*";

async function getPageContent(title) {
    const url = `${API_BASE}&action=parse&page=${encodeURIComponent(title)}&format=json`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.parse || !data.parse.text) {
        console.error("Wikipedia API error:", data);
        return null;
    }

    return data.parse.text["*"];
}

function extractDriversFromEntries(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const tables = doc.querySelectorAll("table.wikitable");

    for (const table of tables) {
        const headers = table.querySelectorAll("th");

        let hasDriverColumn = false;

        headers.forEach(header => {
            if (header.textContent.toLowerCase().includes("driver")) {
                hasDriverColumn = true;
            }
        });

        if (hasDriverColumn) {
            const rows = table.querySelectorAll("tr");
            let drivers = [];

            rows.forEach((row, index) => {
                if (index === 0) return;

                const cells = row.querySelectorAll("td");

                if (cells.length > 0) {
                    const link = cells[0].querySelector("a");
                    if (link) {
                        drivers.push(link.getAttribute("title"));
                    }
                }
            });

            return drivers;
        }
    }

    console.error("Driver table not found.");
    return [];
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

    if (!container) {
        console.error("Entries div not found");
        return;
    }

    container.innerHTML = "Loading drivers...";

    const pageHTML = await getPageContent("2026_Formula_One_World_Championship");

    if (!pageHTML) {
        container.innerHTML = "Failed to load Wikipedia page.";
        return;
    }

    const drivers = extractDriversFromEntries(pageHTML);

    if (!drivers.length) {
        container.innerHTML = "No drivers found.";
        return;
    }

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