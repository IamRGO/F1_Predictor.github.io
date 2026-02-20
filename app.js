// app.js - Full Wikipedia scraper for 2026 F1 drivers and stats
// Uses Wikipedia's public API (no CORS issues with origin=*)
// Parses the "Entries" table from 2026 Formula One World Championship page
// Then fetches individual driver pages for stats from infoboxes

const API_BASE = "https://en.wikipedia.org/w/api.php?origin=*";

async function fetch2026Entries() {
  const url = API_BASE +
    "&action=parse&format=json&page=2026_Formula_One_World_Championship&prop=text&redirects=1";

  const res = await fetch(url);
  const data = await res.json();
  const html = data.parse.text["*"];
  const doc = new DOMParser().parseFromString(html, "text/html");

  // Find "Entries" section table (after h2/h3 with "entries")
  const headings = doc.querySelectorAll("h2, h3");
  let entriesTable = null;

  for (let heading of headings) {
    if (heading.textContent.toLowerCase().includes("entries")) {
      let sibling = heading.nextElementSibling;
      while (sibling) {
        if (sibling.tagName === "TABLE") {
          entriesTable = sibling;
          break;
        }
        sibling = sibling.nextElementSibling;
      }
      if (entriesTable) break;
    }
  }

  if (!entriesTable) throw new Error("Entries table not found on Wikipedia page");

  // Parse table rows: columns are Entrant | Constructor | Chassis | Power unit | No. | Driver name
  const rows = Array.from(entriesTable.querySelectorAll("tr")).slice(2); // Skip headers
  const drivers = [];

  rows.forEach(tr => {
    const tds = tr.querySelectorAll("td");
    if (tds.length < 6) return;

    const entrant = tds[0].innerText.trim();
    const constructor = tds[1].innerText.trim();
    const chassis = tds[2].innerText.trim();
    const powerUnit = tds[3].innerText.trim();
    const number = tds[4].innerText.trim();
    const driverName = tds[5].innerText.trim();

    drivers.push({
      entrant,
      constructor,
      chassis,
      powerUnit,
      number,
      driverName
    });
  });

  console.log(`Found ${drivers.length} drivers for 2026 season`);
  return drivers;
}

async function searchDriverPage(driverName) {
  const url = API_BASE +
    "&action=query&list=search&format=json&srsearch=" +
    encodeURIComponent(driverName + " Formula One");

  const res = await fetch(url);
  const data = await res.json();
  const results = data.query.search;
  
  if (!results || results.length === 0) {
    console.warn(`No Wikipedia page found for ${driverName}`);
    return null;
  }

  return results[0].title;
}

async function fetchDriverStats(driverName) {
  const pageTitle = await searchDriverPage(driverName);
  if (!pageTitle) {
    return { 
      nationality: "N/A", 
      dob: "N/A", 
      wins: "N/A", 
      podiums: "N/A", 
      titles: "N/A",
      page: "N/A"
    };
  }

  const url = API_BASE +
    "&action=parse&format=json&prop=text&page=" +
    encodeURIComponent(pageTitle);

  try {
    const res = await fetch(url);
    const data = await res.json();
    const html = data.parse.text["*"];
    const doc = new DOMParser().parseFromString(html, "text/html");

    // Parse infobox for stats
    const infobox = doc.querySelector(".infobox, .vcard");
    let stats = {
      nationality: "N/A", dob: "N/A", wins: "N/A", 
      podiums: "N/A", titles: "N/A", page: pageTitle
    };

    if (infobox) {
      const rows = infobox.querySelectorAll("tr");
      rows.forEach(tr => {
        const th = tr.querySelector("th");
        const td = tr.querySelector("td");
        if (!th || !td) return;

        const label = th.innerText.toLowerCase().trim();

        if (label.includes("nationality") || label.includes("citizen")) {
          stats.nationality = td.innerText.trim().split("\n")[0];
        }
        if (label.includes("born") || label.includes("birthday")) {
          stats.dob = td.innerText.trim().split("\n")[0];
        }
        if (label.includes("championships") || label.includes("titles")) {
          stats.titles = td.innerText.trim().split("\n")[0];
        }
        if (label.includes("wins")) {
          stats.wins = td.innerText.trim().split("\n")[0];
        }
        if (label.includes("podium") || label.includes("podiums")) {
          stats.podiums = td.innerText.trim().split("\n")[0];
        }
      });
    }

    return stats;
  } catch (err) {
    console.warn(`Failed to fetch stats for ${driverName}:`, err);
    return { 
      nationality: "Error", dob: "Error", wins: "Error", 
      podiums: "Error", titles: "Error", page: pageTitle 
    };
  }
}

async function main() {
  const loader = document.getElementById("loader");
  const table = document.getElementById("driversTable");
  const tbody = table.querySelector("tbody");

  try {
    loader.textContent = "Fetching 2026 F1 driver lineup from Wikipedia…";
    
    // Step 1: Get all 2026 drivers
    const drivers = await fetch2026Entries();

    // Step 2: Get stats for each driver (parallelized)
    loader.textContent = "Fetching career stats for all drivers…";
    const driversWithStats = await Promise.all(
      drivers.map(async (d) => {
        const stats = await fetchDriverStats(d.driverName);
        return { ...d, ...stats };
      })
    );

    // Step 3: Render table
    driversWithStats.forEach(driver => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${driver.number}</td>
        <td><strong>${driver.driverName}</strong><br><small>${driver.page}</small></td>
        <td>${driver.entrant}</td>
        <td>${driver.nationality}</td>
        <td>${driver.dob}</td>
        <td>${driver.wins}</td>
        <td>${driver.podiums}</td>
        <td>${driver.titles}</td>
      `;

      tbody.appendChild(tr);
    });

    loader.style.display = "none";
    table.style.display = "table";

  } catch (err) {
    console.error("Failed to load data:", err);
    loader.innerHTML = `<span style="color: red;">Error: ${err.message}</span><br>
      <small>Check console for details. Wikipedia page structure may have changed.</small>`;
  }
}

// Auto-run when page loads
document.addEventListener("DOMContentLoaded", main);

// Optional: Refresh button
document.addEventListener("DOMContentLoaded", () => {
  const refreshBtn = document.createElement("button");
  refreshBtn.textContent = "🔄 Refresh Data";
  refreshBtn.style.marginTop = "1rem";
  refreshBtn.onclick = main;
  document.body.appendChild(refreshBtn);
});
