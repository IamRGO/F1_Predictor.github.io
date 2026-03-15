#!/usr/bin/env python3
"""Predict next F1 race winner using Google Gemini and historical data."""
import json
import os
from datetime import datetime
from pathlib import Path

import requests
from google import genai

from fetch_news import format_news_for_prompt, fetch_f1_news

PREDICTIONS_PATH = Path(__file__).parent.parent / "data" / "predictions.json"
RACE_RESULTS_PATH = Path(__file__).parent.parent / "data" / "f1_race_results.json"


def _normalize_driver_name(name):
    """Normalize for comparison: 'Lando NORRIS' or 'Lando Norris' -> 'norris'."""
    if not name or not isinstance(name, str):
        return ""
    parts = name.strip().split()
    return parts[-1].lower() if parts else ""


def load_predictions():
    """Load predictions file. Returns { latest, history }. Migrates old single-object format."""
    if not PREDICTIONS_PATH.exists():
        return {"latest": None, "history": []}
    data = json.loads(PREDICTIONS_PATH.read_text())
    if "history" in data:
        return {"latest": data.get("latest"), "history": data.get("history", [])}
    # Old format: single object with next_race, prediction, predicted_at
    entry = {
        "next_race": data.get("next_race"),
        "prediction": data.get("prediction"),
        "predicted_at": data.get("predicted_at"),
    }
    return {"latest": entry, "history": [entry]}


def save_predictions(latest, history):
    """Save predictions with latest + history. Keeps last 50 entries."""
    kept = history[-50:] if len(history) > 50 else history
    out = {"latest": latest, "history": kept}
    PREDICTIONS_PATH.parent.mkdir(parents=True, exist_ok=True)
    PREDICTIONS_PATH.write_text(json.dumps(out, indent=2))


def _extract_podium_from_race(race):
    """Extract 1st/2nd/3rd from a race dict. Returns None if not a full podium."""
    results = (race or {}).get("results") or []
    podium = {}
    for pos, label in [(1, "1st"), (2, "2nd"), (3, "3rd")]:
        for x in results:
            if isinstance(x, dict) and x.get("position") == pos and x.get("driver"):
                name = x["driver"].get("full_name") or x["driver"].get("name_acronym", "?")
                podium[label] = name
                break
    return podium if len(podium) == 3 else None


def get_actual_podium_from_race_results(meeting_key, year_from_date):
    """Get actual 1st/2nd/3rd from f1_race_results.json. Prefers main race (most laps) over Sprint."""
    if not RACE_RESULTS_PATH.exists():
        return None
    data = json.loads(RACE_RESULTS_PATH.read_text())
    year_str = str(year_from_date)
    races = [r for r in data.get(year_str, []) if isinstance(r, dict) and r.get("meeting_key") == meeting_key]
    if not races:
        return None
    # Prefer race with most laps (main race vs Sprint)
    def lap_count(r):
        res = r.get("results") or []
        for x in res:
            if isinstance(x, dict) and x.get("position") == 1:
                return x.get("number_of_laps") or 0
        return 0

    best = max(races, key=lap_count)
    return _extract_podium_from_race(best)


def backfill_history_from_race_results(history):
    """Add placeholder entries for completed races in f1_race_results that have no prediction in history."""
    if not RACE_RESULTS_PATH.exists():
        return
    data = json.loads(RACE_RESULTS_PATH.read_text())
    seen = set()
    for h in history or []:
        nr = h.get("next_race")
        if nr and nr.get("meeting_key") is not None:
            date_str = nr.get("date_start") or ""
            year = date_str[:4] if len(date_str) >= 4 else ""
            seen.add((nr["meeting_key"], year))

    added = []
    for year_str, races in sorted(data.items(), reverse=True):
        if not year_str.isdigit():
            continue
        # Group by meeting_key, keep race with most laps (main race)
        by_meeting = {}
        for r in races:
            if not isinstance(r, dict):
                continue
            mk = r.get("meeting_key")
            if mk is None:
                continue
            res = r.get("results") or []
            laps = next((x.get("number_of_laps") or 0 for x in res if isinstance(x, dict) and x.get("position") == 1), 0)
            if mk not in by_meeting or laps > (by_meeting[mk].get("_laps") or 0):
                by_meeting[mk] = {**r, "_laps": laps}
        for mk, r in by_meeting.items():
            if (mk, year_str) in seen:
                continue
            podium = _extract_podium_from_race(r)
            if not podium:
                continue
            placeholder = {
                "next_race": {
                    "meeting_key": mk,
                    "race_name": r.get("race_name"),
                    "circuit_name": r.get("circuit_short_name") or r.get("circuit_name"),
                    "circuit": r.get("circuit_short_name") or r.get("circuit_name"),
                    "country": "",
                    "date_start": f"{year_str}-01-01T00:00:00Z",
                },
                "prediction": None,
                "predicted_at": None,
                "actual_podium": podium,
                "accuracy": None,
            }
            added.append(placeholder)
            seen.add((mk, year_str))
        if len(added) >= 10:
            break
    for p in reversed(added):
        history.insert(0, p)


def compute_accuracy(pred_podium, actual_podium):
    """Compare predicted vs actual podium. Returns dict with per-position and all_correct."""
    if not actual_podium or not pred_podium:
        return None
    ok_1 = _normalize_driver_name(pred_podium.get("1st")) == _normalize_driver_name(actual_podium.get("1st"))
    ok_2 = _normalize_driver_name(pred_podium.get("2nd")) == _normalize_driver_name(actual_podium.get("2nd"))
    ok_3 = _normalize_driver_name(pred_podium.get("3rd")) == _normalize_driver_name(actual_podium.get("3rd"))
    return {
        "1st_correct": ok_1,
        "2nd_correct": ok_2,
        "3rd_correct": ok_3,
        "all_correct": ok_1 and ok_2 and ok_3,
    }


def update_history_with_actuals(history):
    """For each past prediction, if the race is in f1_race_results, set actual_podium and accuracy."""
    if not history or not RACE_RESULTS_PATH.exists():
        return
    for h in history:
        if h.get("actual_podium") or h.get("accuracy") is not None:
            continue
        nr = h.get("next_race")
        if not nr:
            continue
        date_str = nr.get("date_start") or ""
        try:
            year = int(date_str[:4]) if len(date_str) >= 4 else datetime.utcnow().year
        except (ValueError, TypeError):
            year = datetime.utcnow().year
        meeting_key = nr.get("meeting_key")
        actual = get_actual_podium_from_race_results(meeting_key, year)
        if actual:
            h["actual_podium"] = actual
            h["accuracy"] = compute_accuracy(h.get("prediction", {}).get("podium"), actual)


def format_past_predictions_for_prompt(history):
    """Build text for prompt: past predictions and whether they were right/wrong."""
    entries = [h for h in (history or []) if h.get("accuracy") is not None][-15:]
    if not entries:
        return ""
    lines = ["**Your past predictions (learn from what was right/wrong):**"]
    for e in entries:
        nr = e.get("next_race") or {}
        race = nr.get("race_name") or nr.get("circuit") or "?"
        pred = (e.get("prediction") or {}).get("podium") or {}
        actual = e.get("actual_podium") or {}
        acc = e.get("accuracy") or {}
        p1, a1 = pred.get("1st", "?"), actual.get("1st", "?")
        c1 = "✓" if acc.get("1st_correct") else "✗"
        p2, a2 = pred.get("2nd", "?"), actual.get("2nd", "?")
        c2 = "✓" if acc.get("2nd_correct") else "✗"
        p3, a3 = pred.get("3rd", "?"), actual.get("3rd", "?")
        c3 = "✓" if acc.get("3rd_correct") else "✗"
        all_ok = " (all correct)" if acc.get("all_correct") else ""
        lines.append(f"- {race}: Predicted 1st {p1} {c1} (actual: {a1}), 2nd {p2} {c2} (actual: {a2}), 3rd {p3} {c3} (actual: {a3}){all_ok}")
    return "\n".join(lines)


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
            results = r.get("results") or []
            if results:
                podium = [
                    next((x for x in results if isinstance(x, dict) and x.get("position") == p), None)
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
def predict_podium(next_race: dict, history: str, news_summary: str = None, past_predictions_text: str = ""):
    """Use Gemini to predict the next race podium (1st, 2nd, 3rd)."""
    api_key = os.environ.get("GOOGLE_GEMINI_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError(
            "Set GOOGLE_GEMINI_API_KEY or GEMINI_API_KEY environment variable. "
            "Get a key at https://aistudio.google.com/apikey"
        )
    client = genai.Client(api_key=api_key)

    news_section = ""
    if news_summary:
        news_section = f"\n\n**Recent F1 News:**\n{news_summary}"

    past_section = ""
    if past_predictions_text:
        past_section = f"\n\n{past_predictions_text}"

    prompt = f"""You are an F1 expert. Given the next race, recent historical podium results, and current F1 news, predict the podium (top 3). Learn from your past prediction accuracy when provided.

**Next race:**
- {next_race.get('race_name', '?')} ({next_race.get('circuit', '?')})
- Country: {next_race.get('country', '?')}
- Date: {next_race.get('date_start', '?')}

**Recent podiums (1st | 2nd | 3rd, most recent first):**
{history}{news_section}{past_section}

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
        news_articles = fetch_f1_news()
        news_summary = format_news_for_prompt(news_articles) if news_articles else None
        if news_articles:
            print(f"   Fetched {len(news_articles)} articles.")
        else:
            print("   No news articles fetched.")
            news_summary = None
    except Exception as e:
        print(f"   Failed to fetch news: {e}")
        news_summary = None

    print("4) Loading prediction history and updating with actual results...")
    pred_data = load_predictions()
    history_list = list(pred_data["history"] or [])
    backfill_history_from_race_results(history_list)  # add placeholders for races we have results for but no prediction
    update_history_with_actuals(history_list)
    past_predictions_text = format_past_predictions_for_prompt(history_list)

    print("5) Asking Gemini for prediction...")
    prediction = predict_podium(next_race, history, news_summary, past_predictions_text)

    new_entry = {
        "next_race": next_race,
        "prediction": prediction,
        "predicted_at": datetime.utcnow().isoformat() + "Z",
    }
    history_list.append(new_entry)
    update_history_with_actuals(history_list)
    save_predictions(new_entry, history_list)
    print(f"\nSaved to {PREDICTIONS_PATH} (history: {len(history_list)} entries)")

    print("\n--- Podium Prediction ---")
    print(json.dumps(new_entry, indent=2))


if __name__ == "__main__":
    main()
