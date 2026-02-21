#!/usr/bin/env python3
"""Fetch and condense F1 news articles for use in predictions."""
import json
import os
from datetime import datetime
from pathlib import Path

import requests


def fetch_f1_news(limit=5):
    """
    Fetch latest F1 news articles from NewsAPI.
    Falls back to RSS-based approach if API unavailable.

    Args:
        limit: Number of articles to fetch (default 5)

    Returns:
        List of dictionaries with condensed articles
    """
    articles = []

    # Try NewsAPI approach
    try:
        articles = _fetch_from_newsapi(limit)
        if articles:
            return articles
    except Exception as e:
        print(f"NewsAPI failed: {e}. Trying RSS feed fallback...")

    # Fallback to RSS-based scraping
    try:
        articles = _fetch_from_rss(limit)
        if articles:
            return articles
    except Exception as e:
        print(f"RSS fallback failed: {e}")

    return []


def _fetch_from_newsapi(limit=5):
    """Fetch F1 news from NewsAPI.org (free tier)."""
    api_key = os.environ.get("NEWS_API_KEY", "")

    # Using a fallback approach without API key - NewsAPI free tier allows
    # limited requests without a key, but recommends using one
    url = "https://newsapi.org/v2/everything"
    params = {
        "q": "Formula 1 F1",
        "sortBy": "publishedAt",
        "language": "en",
        "pageSize": limit,
    }

    if api_key:
        params["apiKey"] = api_key

    response = requests.get(url, params=params, timeout=10)
    response.raise_for_status()

    data = response.json()

    if data.get("status") != "ok":
        # If we hit rate limit or error without API key, return empty
        raise Exception(f"NewsAPI error: {data.get('message', 'Unknown error')}")

    articles = []
    for article in data.get("articles", [])[:limit]:
        title = article.get("title", "")
        description = article.get("description", "")
        content = article.get("content", "")
        url = article.get("url", "")
        published_at = article.get("publishedAt", "")

        # Condense to a short paragraph
        condensed = _condense_article(title, description, content)

        if condensed:
            articles.append({
                "title": title,
                "summary": condensed,
                "source": article.get("source", {}).get("name", "Unknown"),
                "published_at": published_at,
                "url": url,
            })

    return articles


def _fetch_from_rss(limit=5):
    """Fallback: Fetch F1 news from multiple RSS feeds."""
    try:
        import feedparser
    except ImportError:
        raise ImportError("feedparser not installed. Install with: pip install feedparser")

    # Multiple RSS feed options
    rss_feeds = [
        "https://feeds.motorsport.com/f1/news",
        "https://feeds.news.sky.com/sports/f1",
        "https://feeds.bbci.co.uk/sport/formula1/rss.xml",  # BBC F1
    ]

    articles = []
    for rss_url in rss_feeds:
        try:
            feed = feedparser.parse(rss_url)

            for entry in feed.entries[:limit]:
                title = entry.get("title", "")
                summary = entry.get("summary", "") or entry.get("description", "")
                link = entry.get("link", "")
                published = entry.get("published", "") or entry.get("updated", "")

                # Condense to a short paragraph
                condensed = _condense_article(title, summary, "")

                if condensed:
                    source_name = _extract_source_name(rss_url)
                    articles.append({
                        "title": title,
                        "summary": condensed,
                        "source": source_name,
                        "published_at": published,
                        "url": link,
                    })

            if articles:
                return articles[:limit]  # Return first available feed's articles
        except Exception as e:
            continue  # Try next feed on error

    return articles


def _extract_source_name(rss_url):
    """Extract source name from RSS feed URL."""
    if "motorsport" in rss_url:
        return "Motorsport.com"
    elif "sky" in rss_url:
        return "Sky Sports"
    elif "bbci" in rss_url:
        return "BBC Sport"
    else:
        return "F1 News"


def _condense_article(title, description, content):
    """
    Condense article to a short paragraph.
    Combines title with description/content and limits to ~150 characters.
    """
    # Use description if available, otherwise use content preview
    text = description or content or ""

    # Remove HTML tags if present
    text = text.replace("<p>", "").replace("</p>", "").replace("<br>", " ")

    # Combine title with summary
    if title and text:
        combined = f"{title}. {text}"
    else:
        combined = title or text

    # Truncate to reasonable length (1-2 sentences)
    if len(combined) > 200:
        combined = combined[:197] + "..."

    return combined.strip()


def format_news_for_prompt(articles):
    """Format articles into a string suitable for the prediction prompt."""
    if not articles:
        return "(No recent F1 news available)"

    lines = ["**Recent F1 News:**"]
    for i, article in enumerate(articles, 1):
        lines.append(f"{i}. {article['summary']}")
        lines.append(f"   (Source: {article['source']}, {article['published_at'][:10]})")

    return "\n".join(lines)


def save_news_cache(articles):
    """Save fetched news to a cache file."""
    cache_path = Path(__file__).parent.parent / "data" / "f1_news_cache.json"
    cache_path.parent.mkdir(parents=True, exist_ok=True)

    cache = {
        "fetched_at": datetime.utcnow().isoformat() + "Z",
        "articles": articles,
    }

    cache_path.write_text(json.dumps(cache, indent=2))
    print(f"Saved {len(articles)} articles to {cache_path}")


def main():
    print("Fetching latest F1 news articles...")
    articles = fetch_f1_news(limit=5)

    if not articles:
        print("Failed to fetch any articles. Check your internet connection.")
        return

    print(f"\nFetched {len(articles)} articles:")
    print("-" * 60)
    for article in articles:
        print(f"\n{article['title']}")
        print(f"Summary: {article['summary']}")
        print(f"Source: {article['source']} ({article['published_at'][:10]})")

    # Save to cache
    save_news_cache(articles)

    # Show formatted version
    print("\n" + "=" * 60)
    print("Formatted for prediction prompt:")
    print("=" * 60)
    print(format_news_for_prompt(articles))


if __name__ == "__main__":
    main()
