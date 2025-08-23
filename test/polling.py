
# -*- coding: utf-8 -*-

import sys
import os

# Set up UTF-8 encoding for console output on Windows
if os.name == 'nt':  # Windows
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.detach())

import praw
import requests
import os
from collections import Counter, defaultdict
import time

def safe_str(text, max_length=60):
    """Safely encode string for console output, removing problematic Unicode characters"""
    if not isinstance(text, str):
        text = str(text)
    # Remove or replace problematic Unicode characters
    safe_text = text.encode('ascii', 'ignore').decode('ascii')
    if len(safe_text) > max_length:
        safe_text = safe_text[:max_length] + "..."
    return safe_text

# Reddit API creds
CLIENT_ID = "wHZeWsDXHWaYpnZ05NUr_A"
CLIENT_SECRET = "Cr2CljhVZxesH9_5zDp6TXolzJsuDA"
USERNAME = "Dry_Bowler_8144"
PASSWORD = "Rohit#2006"
USER_AGENT = "MemeTrendApp/1.0 by u/Dry_Bowler_8144"

# 🎯 Multiple subreddits to check for viral memes
SUBREDDITS = [
    "memes",
    "dankmemes", 
    "wholesomememes",
    "meme",
    "funny",
    "ProgrammerHumor",
    "gaming",
    "PrequelMemes",
    "animemes",
    "teenagers"
]

# 🎭 Expanded meme character/template keywords for better detection
VIRAL_KEYWORDS = [
    # Characters
    "doge", "pepe", "wojak", "gigachad", "sigma", "chad",
    "shrek", "spongebob", "gru", "drake", "thanos",
    "batman", "joker", "kermit", "yoda", "patrick",
    "hulk", "vince mcmahon", "harold", "distracted boyfriend",
    
    # Meme templates/formats  
    "reaction", "template", "format", "trending", "viral",
    "stonks", "poggers", "based", "cringe", "sus",
    "amogus", "rickroll", "ratio", "cope", "seethe",
    
    # Popular phrases
    "this is fine", "galaxy brain", "brain meme", 
    "expanding brain", "stonks", "not stonks"
]

# Minimum score threshold for viral content
MIN_SCORE = 1000  # Only get highly upvoted content

# Save folder
SAVE_DIR = "downloaded_memes"
os.makedirs(SAVE_DIR, exist_ok=True)

# Clear previous downloads for fresh trending data
import shutil
if os.path.exists(SAVE_DIR):
    shutil.rmtree(SAVE_DIR)
os.makedirs(SAVE_DIR, exist_ok=True)

print("[SEARCH] Starting viral meme hunt across multiple subreddits...")
print(f"[TARGET] Top 10 viral memes from {len(SUBREDDITS)} subreddits")
print(f"[FILTER] Minimum score threshold: {MIN_SCORE} upvotes")
print("="*60)

reddit = praw.Reddit(
    client_id=CLIENT_ID,
    client_secret=CLIENT_SECRET,
    username=USERNAME,
    password=PASSWORD,
    user_agent=USER_AGENT
)

# 📊 Store all potential memes with scores
all_memes = []
viral_keywords_found = Counter()

# 🔍 Search through multiple subreddits
for subreddit_name in SUBREDDITS:
    print(f"\n[SEARCH] Checking r/{subreddit_name}...")
    
    try:
        subreddit = reddit.subreddit(subreddit_name)
        
        # Get hot and top posts from today
        hot_posts = list(subreddit.hot(limit=20))
        top_posts = list(subreddit.top(time_filter="day", limit=20))
        
        # Combine and check all posts
        all_posts = hot_posts + top_posts
        
        for post in all_posts:
            # Skip if not an image
            if not post.url.endswith((".jpg", ".jpeg", ".png", ".gif", ".webp")):
                continue
            
            # Skip if score too low
            if post.score < MIN_SCORE:
                continue
            
            title_lower = post.title.lower()
            
            # Check for viral keywords
            viral_score = 0
            found_keywords = []
            
            for keyword in VIRAL_KEYWORDS:
                if keyword in title_lower:
                    viral_score += 1
                    found_keywords.append(keyword)
                    viral_keywords_found[keyword] += 1
            
            # Calculate total virality score (upvotes + keyword matches)
            total_score = post.score + (viral_score * 500)  # Boost keyword matches
            
            meme_data = {
                'post': post,
                'subreddit': subreddit_name,
                'score': post.score,
                'viral_score': viral_score,
                'total_score': total_score,
                'keywords': found_keywords,
                'title': post.title,
                'url': post.url
            }
            
            all_memes.append(meme_data)
        
        print(f"  [STATS] Found {len([m for m in all_memes if m['subreddit'] == subreddit_name])} potential viral memes")
        time.sleep(1)  # Be nice to Reddit API
        
    except Exception as e:
        print(f"  [ERROR] Error accessing r/{subreddit_name}: {e}")
        continue

# RANKING: Sort by total virality score and get top 10
print(f"\n[RANKING] Ranking {len(all_memes)} total memes by virality...")
top_viral_memes = sorted(all_memes, key=lambda x: x['total_score'], reverse=True)[:10]

print(f"\n[TOP] TOP 10 VIRAL MEMES:")
print("="*60)

# 💾 Download the top 10 viral memes
downloaded_count = 0
for i, meme_data in enumerate(top_viral_memes, 1):
    post = meme_data['post']
    
    print(f"\n{i:2d}. [MEME] {safe_str(meme_data['title'], 60)}")
    print(f"    [SCORE] Score: {meme_data['score']:,} | Viral Keywords: {len(meme_data['keywords'])}")
    print(f"    [TAGS] Keywords: {', '.join(meme_data['keywords'][:5])}")
    print(f"    [SUBREDDIT] r/{meme_data['subreddit']}")
    
    try:
        # Download the image
        img_response = requests.get(post.url, timeout=10)
        img_response.raise_for_status()
        
        # Create filename with ranking and subreddit info
        file_extension = os.path.splitext(post.url)[1] or '.jpg'
        safe_title = safe_str(post.title, 30)
        safe_title = "".join(c for c in safe_title if c.isalnum() or c in (' ', '-', '_'))
        safe_title = safe_title.replace(' ', '_')
        
        filename = f"{i:02d}_{post.id}_{meme_data['subreddit']}_{safe_title}{file_extension}"
        filepath = os.path.join(SAVE_DIR, filename)
        
        with open(filepath, "wb") as f:
            f.write(img_response.content)
        
        downloaded_count += 1
        print(f"    [SUCCESS] Saved: {filename}")
        
    except Exception as e:
        print(f"    [ERROR] Error downloading: {e}")
        continue

# 📊 Print final statistics
print(f"\n" + "="*60)
print(f"[COMPLETE] VIRAL MEME HUNT COMPLETE!")
print(f"[DOWNLOADED] Successfully downloaded: {downloaded_count}/10 viral memes")
print(f"[LOCATION] Location: {SAVE_DIR}")

print(f"\n[KEYWORDS] TOP VIRAL KEYWORDS FOUND:")
for keyword, count in viral_keywords_found.most_common(10):
    print(f"  {keyword}: {count} mentions")

print(f"\n[INFO] Ready for NFT generation! These are the most viral memes right now.")
print(f"[INFO] Run the NFT generator to create images from the top familiar memes!")