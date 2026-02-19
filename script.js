const BASE_URL = "https://ergast.com/api/f1";
const SEASON = "2025"; // Change to 2026 when available

async function fetchStandings() {
    const response = await fetch(`${BASE_URL}/${SEASON}/driverStandings.json`);
    
    if (!response.ok) {
        throw new Error("Failed to fetch standings");
    }

    const data = await response.json();

    return data.MRData.StandingsTable.StandingsLists[0].DriverStandings;
}

function createDriverCard(driverStanding) {
    const container = document.getElementById("drivers-container");

    const driver = driverStanding.Driver;
    const constructor = driverStanding.Constructors[0];

    const card = document.createElement("div");
    card.classList.add("driver-card");

    card.innerHTML = `
        <h2>#${driverStanding.position} ${driver.givenName} ${driver.familyName}</h2>
        <p><strong>Team:</strong> ${constructor.name}</p>
        <p><strong>Nationality:</strong> ${driver.nationality}</p>
        <p><strong>Points:</strong> ${driverStanding.points}</p>
        <p><strong>Wins:</strong> ${driverStanding.wins}</p>
    `;

    container.appendChild(card);
}

async function loadStandings() {
    const container = document.getElementById("drivers-container");
    container.textContent = "Loading season standings...";

    try {
        const standings = await fetchStandings();

        container.innerHTML = "";

        if (!standings || standings.length === 0) {
            container.textContent = "No standings available for this season.";
            return;
        }

        standings.forEach(driverStanding => {
            createDriverCard(driverStanding);
        });

    } catch (error) {
        container.textContent = "Error loading standings.";
        console.error(error);
    }
}

loadStandings();
