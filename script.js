const BASE_URL = "https://api.jolpi.ca/ergast/f1";
const SEASON = "2026";

async function fetchDrivers() {
    const response = await fetch(`${BASE_URL}/${SEASON}/drivers.json`);
    if (!response.ok) {
        throw new Error("Could not fetch drivers");
    }
    const data = await response.json();
    return data.MRData.DriverTable.Drivers;
}

async function fetchCareerStats(driverId) {
    let wins = 0;
    let podiums = 0;

    const response = await fetch(`${BASE_URL}/drivers/${driverId}/results.json?limit=1000`);
    if (!response.ok) {
        return { wins: 0, podiums: 0 };
    }

    const data = await response.json();
    const races = data.MRData.RaceTable.Races;

    races.forEach(race => {
        race.Results.forEach(result => {
            const position = parseInt(result.position);
            if (position === 1) wins++;
            if (position <= 3) podiums++;
        });
    });

    return { wins, podiums };
}

function createDriverCard(driver, stats) {
    const container = document.getElementById("drivers-container");

    const card = document.createElement("div");
    card.classList.add("driver-card");

    card.innerHTML = `
        <h2>${driver.givenName} ${driver.familyName}</h2>
        <p><strong>Nationality:</strong> ${driver.nationality}</p>
        <p><strong>Career Wins:</strong> ${stats.wins}</p>
        <p><strong>Career Podiums:</strong> ${stats.podiums}</p>
    `;

    container.appendChild(card);
}

async function loadDrivers() {
    const container = document.getElementById("drivers-container");
    container.textContent = "Loading 2026 drivers...";

    try {
        const drivers = await fetchDrivers();
        container.innerHTML = "";

        for (const driver of drivers) {
            const stats = await fetchCareerStats(driver.driverId);
            createDriverCard(driver, stats);
        }

    } catch (error) {
        container.textContent = "Error loading data.";
        console.error(error);
    }
}

loadDrivers();
