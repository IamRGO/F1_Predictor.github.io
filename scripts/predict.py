#!/usr/bin/env python3
"""Predict next F1 race winner using Google Gemini and historical data."""
import json
import os
from datetime import datetime
from pathlib import Path

import requests
from google import genai

from fetch_news import format_news_for_prompt, fetch_f1_news

# 1) Get the next race from OpenF1 API
def get_next_race():
    """Fetch the next upcoming F1 race (main GP, not Sprint)."""
    url = "https://api.openf1.org/v1/sessions"
    now = datetime.utcnow().isoformat() + "Z"
    params = {"year": datetime.utcnow().year, "session_type": "Race", "session_name": "Race"}
    r = requests.get(url, params=params)
    sessions = r.json()
    upcoming = [s for s in sessions if s.get("date_start", "") > now]
    upcoming.sort(key=lambda s: s["date_start"])
    if not upcoming:
        # try next year
        params["year"] = params["year"] + 1
        r = requests.get(url, params=params)
        sessions = r.json()
        upcoming = sorted(sessions, key=lambda s: s.get("date_start", ""))
    if not upcoming:
        return None
    s = upcoming[0]
    return {
        "race_name": s.get("circuit_short_name", ""),
        "circuit": s.get("circuit_short_name"),
        "country": s.get("country_name"),
        "date_start": s.get("date_start"),
        "meeting_key": s.get("meeting_key"),
    }


# 2) Load historical race data
def load_historical_data():
    """Load F1 race results and build a compact summary for the model."""
    path = Path(__file__).parent.parent / "data" / "f1_race_results.json"
    if not path.exists():
        return {}
    data = json.loads(path.read_text())
    summary = []
    for year, races in sorted(data.items(), reverse=True)[:2]:  # last 2 years
        for r in races:
            if r.get("results"):
                podium = [
                    next((x for x in r["results"] if x.get("position") == p), None)
                    for p in (1, 2, 3)
                ]
                names = []
                for p in podium:
                    if p and p.get("driver"):
                        n = p["driver"].get("full_name") or p["driver"].get("name_acronym", "?")
                        names.append(n)
                if names:
                    podium_str = " | ".join(names)
                    summary.append(
                        f"- {r.get('race_name', '?')} ({r.get('circuit_name', '?')}) {year}: {podium_str}"
                    )
    return "\n".join(summary[:40])  # ~40 most recent races


# 3) Predict with Gemini
def predict_podium(next_race: dict, history: str, news_summary: str = None):
    """Use Gemini to predict the next race podium (1st, 2nd, 3rd)."""
    api_key = os.environ.get("GOOGLE_GEMINI_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError(
            "Set GOOGLE_GEMINI_API_KEY or GEMINI_API_KEY environment variable. "
            "Get a key at https://aistudio.google.com/apikey"
        )
    client = genai.Client(api_key=api_key)

    # Include news if available
    news_section = ""
    if news_summary:
        news_section = f"\n\n**Recent F1 News:**\n{news_summary}"

    prompt = f"""You are an F1 expert. Given the next race, recent historical podium results, and current F1 news, predict the podium (top 3).

**Next race:**
- {next_race.get('race_name', '?')} ({next_race.get('circuit', '?')})
- Country: {next_race.get('country', '?')}
- Date: {next_race.get('date_start', '?')}

**Recent podiums (1st | 2nd | 3rd, most recent first):**
{history}{news_section}

Predict the podium for the next race. Respond with ONLY valid JSON in this exact format, no other text:
{{"podium": {{"1st": "Driver Name", "2nd": "Driver Name", "3rd": "Driver Name"}}, "reason": "Brief explanation"}}"""

    print("\n--- Prompt to Gemini ---")
    print(prompt)

    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=prompt,
    )
    raw = response.text.strip()
    # Extract JSON from markdown code block if present
    if raw.startswith("```"):
        lines = raw.split("\n")
        start = 1  # skip ``` or ```json
        end = -1 if (len(lines) > 1 and lines[-1].strip() == "```") else len(lines)
        raw = "\n".join(lines[start:end])
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"podium": {}, "reason": raw, "raw": True}


def main():
    print("1) Fetching next race...")
    next_race = get_next_race()
    if not next_race:
        print("Could not find next race.")
        return
    print(f"   Next race: {next_race['race_name']} ({next_race['circuit']}), {next_race.get('date_start', '')[:10]}")

    print("2) Loading historical data...")
    history = load_historical_data()
    if not history:
        print("   No historical data in data/f1_race_results.json. Run: python scripts/fetch.py")
        history = "(No data - run scripts/fetch.py first)"
    else:
        print("   Loaded.")

    print("3) Fetching latest F1 news...")
    try:
        news_articles = fetch_f1_news(limit=5)
        news_summary = format_news_for_prompt(news_articles) if news_articles else None
        if news_articles:
            print(f"   Fetched {len(news_articles)} articles.")
        else:
            print("   No news articles fetched.")
            news_summary = None
    except Exception as e:
        print(f"   Failed to fetch news: {e}")
        news_summary = None

    print("4) Asking Gemini for prediction...")
    prediction = predict_podium(next_race, history, news_summary)

    result = {
        "next_race": next_race,
        "prediction": prediction,
        "predicted_at": datetime.utcnow().isoformat() + "Z",
    }

    out_path = Path(__file__).parent.parent / "data" / "predictions.json"
    out_path.write_text(json.dumps(result, indent=2))
    print(f"\nSaved to {out_path}")

    print("\n--- Podium Prediction ---")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
