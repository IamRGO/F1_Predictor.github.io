# 🏎️ F1 Podium AI

> **AI-powered Formula 1 race predictions powered by Gemini** — Predicts podium winners for the next Grand Prix using machine learning and historical race data.

[![GitHub Pages](https://img.shields.io/badge/Hosted%20on-GitHub%20Pages-181717?style=flat-square&logo=github)](https://iamrgo.github.io/f1-predictor/)
[![Python](https://img.shields.io/badge/Python-3.11-3776ab?style=flat-square&logo=python)](https://www.python.org/)
[![Google Gemini](https://img.shields.io/badge/Powered%20by-Google%20Gemini-4285F4?style=flat-square&logo=google)](https://aistudio.google.com/)

---

## ✨ Features

- 🤖 **AI-Powered Predictions** — Uses Google Gemini to analyze historical race data and predict podium finishers
- 📰 **Live News Integration** — Fetches latest F1 news from multiple RSS feeds to inform predictions
- 📊 **Real-time Data** — Fetches latest F1 race schedules from OpenF1 API
- 🔄 **Auto-Updates** — GitHub Actions runs predictions every 6 hours
- 🎨 **Premium UI** — Apple-inspired minimalist design with smooth animations
- 📱 **Fully Responsive** — Works beautifully on desktop, tablet, and mobile
- ⚡ **Fast & Lightweight** — Static site hosted on GitHub Pages
- 🔐 **Secure** — API keys stored as GitHub Secrets

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Backend** | Python 3.11+ |
| **AI/ML** | Google Gemini 3-Flash |
| **Data Sources** | OpenF1 API, RSS Feeds (BBC Sport, Motorsport.com, Sky Sports) |
| **Data Storage** | Local JSON storage |
| **Automation** | GitHub Actions |
| **Hosting** | GitHub Pages |

---

## 🎯 How It Works

```
1. GitHub Actions triggers every 6 hours ⏰
   ↓
2. Fetches latest F1 race schedule & historical results 📊
   ↓
3. Fetches latest F1 news from RSS feeds 📰
   ↓
4. Sends data to Gemini AI with race analysis + news context 🤖
   ↓
5. Gemini predicts podium (1st, 2nd, 3rd) + reasoning 🏆
   ↓
6. Saves predictions.json to data/ folder 💾
   ↓
7. Commits & pushes changes to repo 📤
   ↓
8. Website automatically displays latest predictions ✨
```

---

## 📋 Predictions Output

The AI generates JSON with the following structure:

```json
{
  "next_race": {
    "race_name": "Melbourne",
    "circuit": "Albert Park",
    "country": "Australia",
    "date_start": "2026-03-08T04:00:00Z"
  },
  "prediction": {
    "podium": {
      "1st": "Lando Norris",
      "2nd": "Oscar Piastri",
      "3rd": "Max Verstappen"
    },
    "reason": "McLaren's consistency and Norris's recent form..."
  },
  "predicted_at": "2026-02-21T19:28:46.353842Z"
}
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Google Gemini API key (free at [aistudio.google.com](https://aistudio.google.com/apikey))

### Local Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/f1-predictor.git
   cd f1-predictor
   ```

2. **Create virtual environment**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up API key**
   ```bash
   export GOOGLE_GEMINI_API_KEY="your-api-key-here"
   ```

5. **Run predictions locally**
   ```bash
   python scripts/fetch.py      # Fetch F1 race data
   python scripts/fetch_news.py # Fetch latest F1 news (optional)
   python scripts/predict.py    # Generate predictions with AI
   ```

6. **View the website**
   Open `index.html` in your browser

---

## 🔐 Setting Up GitHub Secrets

To enable automated predictions:

1. Go to your GitHub repo **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add:
   - **Name:** `GOOGLE_GEMINI_API_KEY`
   - **Value:** Your Gemini API key from [aistudio.google.com](https://aistudio.google.com/apikey)
4. Save and you're done! 🎉

The GitHub Action will now run automatically every 6 hours.

---

## 📁 Project Structure

```
f1-predictor/
├── index.html                  # Main website
├── style.css                   # Premium styling
├── app.js                      # Frontend logic
├── requirements.txt            # Python dependencies
│
├── scripts/
│   ├── fetch.py               # Fetches F1 data from OpenF1 API
│   ├── fetch_news.py          # Fetches & condenses F1 news from RSS feeds
│   ├── predict.py             # Generates predictions with Gemini + news context
│   └── driver_info.py         # Driver utilities
│
├── data/
│   ├── predictions.json       # Latest predictions (auto-generated)
│   ├── f1_news_cache.json     # Latest F1 news articles (auto-generated)
│   ├── f1_race_results.json
│   └── 2026.json
│
└── .github/workflows/
    └── update_f1.yml          # GitHub Actions automation
```

---

## 📊 Data Sources

| Source | Purpose |
|--------|---------|
| [OpenF1 API](https://openf1.org/) | Race schedules, historical results |
| [BBC Sport RSS](https://feeds.bbci.co.uk/sport/formula1/rss.xml) | Latest F1 news & updates |
| [Motorsport.com RSS](https://feeds.motorsport.com/f1/news) | F1 coverage & analysis |
| [Sky Sports RSS](https://feeds.news.sky.com/sports/f1) | Racing news & insights |
| [Google Gemini](https://aistudio.google.com/) | AI predictions & analysis |

---

## 🤝 Contributing

Contributions welcome! Feel free to:
- Report bugs
- Suggest improvements
- Submit pull requests
- Share feedback

---

## 📝 License

This project is open source and available under the MIT License.

---

## 👤 Author

**Ricky Go**
- GitHub: [@IamRGO](https://github.com/IamRGO)
- LinkedIn: [Ricky Go](https://www.linkedin.com/in/ricky-go-9240b12ab/)
- Portfolio: [iamrgo.github.io](https://iamrgo.github.io/)

---

<div align="center">

### 🏁 Made with ❤️ and AI

**[Visit F1 Podium AI](https://iamrgo.github.io/f1-predictor/)** | **[Report Issue](https://github.com/IamRGO/f1-predictor/issues)** | **[Suggest Feature](https://github.com/IamRGO/f1-predictor/discussions)**

</div>
