// Analytics loader function
function loadAnalytics() {
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-2WB20LY88X';
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer || [];
    function gtag(){ dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', 'G-2WB20LY88X');
}

// Cookie consent initialization
(function initConsent() {
    const consent = localStorage.getItem('analytics-consent');
    if (consent === 'true') {
        loadAnalytics();
        return;
    }
    if (consent === 'false') {
        return;
    }

    const banner = document.getElementById('cookie-banner');
    if (!banner) return;

    document.getElementById('cookie-accept').addEventListener('click', () => {
        localStorage.setItem('analytics-consent', 'true');
        banner.classList.add('hidden');
        loadAnalytics();
    });

    document.getElementById('cookie-reject').addEventListener('click', () => {
        localStorage.setItem('analytics-consent', 'false');
        banner.classList.add('hidden');
    });
})();

async function loadPredictions() {
    try {
        const response = await fetch('./data/predictions.json');
        const data = await response.json();

        // Update race info
        const nextRace = data.next_race;
        document.getElementById('raceName').textContent = nextRace.race_name;
        document.getElementById('raceLocation').textContent = `🌍 ${nextRace.country} - ${nextRace.circuit}`;

        // Format date
        const raceDate = new Date(nextRace.date_start);
        const formattedDate = raceDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        document.getElementById('raceDate').textContent = `📅 ${formattedDate}`;

        // Update podium predictions
        const prediction = data.prediction;
        document.getElementById('driver1').textContent = prediction.podium['1st'];
        document.getElementById('driver2').textContent = prediction.podium['2nd'];
        document.getElementById('driver3').textContent = prediction.podium['3rd'];

        // Update reasoning
        document.getElementById('reasoning').textContent = prediction.reason;

        // Update prediction time
        const predictionDate = new Date(data.predicted_at);
        const formattedPredictionTime = predictionDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: 'UTC'
        });
        document.getElementById('predictionTime').textContent = `Prediction generated: ${formattedPredictionTime} UTC`;

    } catch (error) {
        console.error('Error loading predictions:', error);
        document.getElementById('reasoning').textContent = 'Error loading predictions. Please refresh the page.';
    }
}

async function loadNews() {
    try {
        const response = await fetch('./data/f1_news_cache.json');
        const data = await response.json();
        const articles = data.articles || [];

        const newsContainer = document.getElementById('newsContainer');
        newsContainer.innerHTML = '';

        if (articles.length === 0) {
            newsContainer.innerHTML = '<div class="news-error">No news articles available at the moment.</div>';
            return;
        }

        articles.forEach((article, index) => {
            const newsLink = document.createElement('a');
            newsLink.href = article.url;
            newsLink.target = '_blank';
            newsLink.rel = 'noopener noreferrer';
            newsLink.className = 'news-link';
            newsLink.style.animation = `fadeInUp 0.8s ease-out ${0.5 + index * 0.1}s both`;

            // Extract date from published_at
            const pubDate = new Date(article.published_at);
            const formattedDate = pubDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });

            newsLink.innerHTML = `
                <div class="news-card">
                    <h3 class="news-title">${article.title}</h3>
                    <p class="news-summary">${article.summary}</p>
                    <div class="news-meta">
                        <span class="news-source">${article.source}</span>
                        <span class="news-date">${formattedDate}</span>
                    </div>
                </div>
            `;

            newsContainer.appendChild(newsLink);
        });
    } catch (error) {
        console.error('Error loading news:', error);
        const newsContainer = document.getElementById('newsContainer');
        newsContainer.innerHTML = '<div class="news-error">Error loading news articles. Please try again later.</div>';
    }
}

// Load predictions and news when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadPredictions();
    loadNews();
});
