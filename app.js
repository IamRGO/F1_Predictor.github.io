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

    // Find the "Entries" section header
    const headlines = doc.querySelectorAll("span.mw-headline");

    let entriesHeader = null;

    headlines.forEach(headline => {
        if (headline.textContent.trim() === "Entries") {
            entriesHeader = headline;
        }
    });

    if (!entriesHeader) {
        console.error("Entries section not found.");
        return [];
    }

    // The table should be after the header
    let element = entriesHeader.parentElement.nextElementSibling;

    while (element && !element.classList.contains("wikitable")) {
        element = element.nextElementSibling;
    }

    if (!element) {
        console.error("Entries table not found.");
        return [];
    }

    const rows = element.querySelectorAll("tr");
    let drivers = [];

    rows.forEach((row, index) => {
        if (index === 0) return; // skip header row

        const cells = row.querySelectorAll("td");

        // On Wikipedia F1 entries table,
        // driver name is usually second column
        if (cells.length > 1) {
            const link = cells[1].querySelector("a");
            if (link) {
                drivers.push(link.getAttribute("title"));
            }
        }
    });

    return drivers;
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