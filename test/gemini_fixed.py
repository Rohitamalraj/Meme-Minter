# -*- coding: utf-8 -*-
# -*- coding: utf-8 -*-
import os
import json
import time
import pathlib
import base64
import requests
from collections import Counter, defaultdict
from typing import List, Dict, Any
from dotenv import load_dotenv

from google import genai
from google.genai import types
from tqdm import tqdm

# Load environment variables
load_dotenv()

# ====== Configuration ======
MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")  # try "gemini-2.5-pro" for higher accuracy
IMAGE_MODEL = "imagen-3.0-generate-002"  # Available image generation model
MEME_DIR = os.getenv("MEME_DIR", "downloaded_memes")  # Changed to use downloaded memes
OUT_DIR = os.getenv("OUT_DIR", "results")
NFT_DIR = os.path.join(OUT_DIR, "nft_images")  # Changed from nft_generated to nft_images
OUT_JSONL = os.path.join(OUT_DIR, "meme_results.jsonl")

# Confidence threshold for generating NFTs (only generate for highly confident identifications)
CONFIDENCE_THRESHOLD = 0.95  # Increased for better quality

# Maximum NFT images to generate (for accuracy purposes)
MAX_NFT_IMAGES = 3  # Focus on top 3 best memes

# Meme types that qualify for NFT generation (familiar/recognizable memes)
ELIGIBLE_MEME_TYPES = {"reaction", "template", "character"}

# Canonical meme/template labels you care about.
# You can edit this list to fit your taxonomy.
LABELS: List[str] = [
    "Pepe the Frog",
    "Doge",
    "Wojak",
    "NPC Wojak",
    "Chad",
    "Doomer",
    "Drakeposting",
    "Grumpy Cat",
    "SpongeBob (Mocking)",
    "Crying Michael Jordan",
    "Distracted Boyfriend",
    "Trollface",
    "Galaxy Brain",
    "Is This a Pigeon?",
    "Hide the Pain Harold",
    "Arthur Fist",
    "Dancing Pallbearers",
    "Woman Yelling at a Cat",
    "Gigachad",
    "Gru's Plan",
]

PROMPT_INSTRUCTIONS = f"""
You are an expert meme analyzer specializing in identifying famous internet meme characters and templates.

Task:
Analyze this image and identify any recognizable meme characters, templates, or viral formats.

Focus on FAMOUS MEMES like:
- Character memes: Pepe, Doge, Wojak, Chad, Gigachad, Harold, Drake, Shrek, SpongeBob characters
- Reaction templates: Tom & Jerry reactions, Scooby-Doo, Leonardo DiCaprio, Vince McMahon
- Classic formats: Distracted Boyfriend, Woman Yelling at Cat, Galaxy Brain, Expanding Brain

Return ONLY valid JSON with keys:
- "template": string - The exact meme name (e.g., "Tom Screaming", "Pepe the Frog", "Drake Pointing", "Hide the Pain Harold")
- "confidence": number - 0.0 to 1.0 (be very strict - only 0.95+ for clearly recognizable famous memes)
- "meme_type": string - "character" (recognizable person/character), "template" (famous format), "reaction" (emotion meme)
- "description": string - Detailed description of what you see
- "known_variants": array - Other names this meme is known by
- "rationale": string - Why this is a famous/recognizable meme
- "nft_potential": number - 0.0 to 1.0 rating for NFT collectible potential

Rules:
- Identify ANY recognizable meme elements, not just from a predefined list
- If it's a well-known meme template/character, name it specifically
- If it's custom or unknown, describe what type of meme format it uses
- Be descriptive and helpful in your analysis
"""

# ====== Helpers ======
IMG_EXTS = {".jpg", ".jpeg", ".png", ".webp"}

def mime_from_path(path: str) -> str:
    ext = pathlib.Path(path).suffix.lower()
    if ext in {".jpg", ".jpeg"}:
        return "image/jpeg"
    if ext == ".png":
        return "image/png"
    if ext == ".webp":
        return "image/webp"
    # Fallback (Gemini can still handle)
    return "application/octet-stream"

def ensure_dirs():
    os.makedirs(OUT_DIR, exist_ok=True)
    os.makedirs(NFT_DIR, exist_ok=True)

def iter_images(directory: str):
    p = pathlib.Path(directory)
    for ext in IMG_EXTS:
        for fp in p.rglob(f"*{ext}"):
            yield str(fp)

def classify_image(client: genai.Client, path: str) -> Dict[str, Any]:
    with open(path, "rb") as f:
        image_bytes = f.read()

    part = types.Part.from_bytes(data=image_bytes, mime_type=mime_from_path(path))

    # Ask for JSON mode so we get machine-readable output
    # Official pattern for passing image + text is used here. (See docs)
    response = client.models.generate_content(
        model=MODEL,
        contents=[part, PROMPT_INSTRUCTIONS],
        config=types.GenerateContentConfig(
            response_mime_type="application/json"  # request JSON output
        ),
    )
    # In JSON mode, response.text should be valid JSON
    # but we still guard against parse errors.
    try:
        data = json.loads(response.text)
        if not isinstance(data, dict):
            raise ValueError("Non-dict JSON returned.")
    except Exception:
        data = {
            "template": "Unknown",
            "confidence": 0.0,
            "meme_type": "unknown",
            "description": "Could not analyze",
            "known_variants": [],
            "rationale": "parse_error",
            "raw": response.text
        }

    # Add common metadata
    stat = pathlib.Path(path).stat()
    data.update({
        "file": path,
        "source": guess_source_from_path(path),  # crude guess; edit as needed
        "timestamp": int(getattr(stat, "st_mtime", time.time())),
        "model": MODEL,
    })
    return data

def generate_nft_image_with_stability(meme_data: Dict[str, Any], output_dir: str) -> str:
    """Generate a high-quality NFT image using Stability AI"""
    template = meme_data.get("template", "Unknown")
    description = meme_data.get("description", "")
    
    # Create NFT-style prompt optimized for Stability AI
    nft_prompt = f"""Professional NFT digital artwork of {template} meme character, high-quality detailed illustration, vibrant colors, modern art style, premium NFT collection quality, digital painting, trending on artstation, 4K resolution, collectible art piece
    
Based on: {description}

Style: Modern digital art, professional NFT quality, vibrant and eye-catching, suitable for blockchain marketplace"""
    
    try:
        print(f"    [STABILITY] Generating high-quality NFT image for {template}...")
        
        api_key = os.getenv("STABILITY_API_KEY")
        if not api_key:
            print(f"    [ERROR] STABILITY_API_KEY not found in environment")
            return ""
        
        response = requests.post(
            'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            },
            json={
                'text_prompts': [{'text': nft_prompt}],
                'cfg_scale': 7,
                'height': 1024,
                'width': 1024,
                'samples': 1,
                'steps': 40  # Higher steps for better quality
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get('artifacts'):
                # Save the generated image
                safe_filename = "".join(c for c in template if c.isalnum() or c in (' ', '-', '_')).rstrip()
                safe_filename = safe_filename.replace(' ', '_')
                output_path = os.path.join(output_dir, f"{safe_filename}_NFT.png")
                
                # Decode and save the image
                image_data = base64.b64decode(data['artifacts'][0]['base64'])
                with open(output_path, "wb") as f:
                    f.write(image_data)
                
                print(f"    [SUCCESS] Generated high-quality NFT: {safe_filename}_NFT.png")
                return output_path
            else:
                print(f"    [ERROR] No images returned from Stability AI")
                return ""
        else:
            print(f"    [ERROR] Stability AI API error: {response.status_code}")
            print(f"    [ERROR] Response: {response.text}")
            return ""
            
    except Exception as e:
        print(f"    [ERROR] Error generating NFT with Stability AI: {e}")
        return ""

def generate_nft_image(client: genai.Client, meme_data: Dict[str, Any]) -> str:
    """Generate an NFT-style image using Stability AI API"""
    template = meme_data.get("template", "Unknown")
    
    # Try Stability AI first (high quality NFT generation)
    print(f"    [GENERATE] Generating high-quality NFT with Stability AI...")
    stability_result = generate_nft_image_with_stability(meme_data, NFT_DIR)
    
    if stability_result:
        return stability_result
    
    # Fallback to Gemini Imagen if Stability AI fails
    print(f"    [FALLBACK] Trying Gemini Imagen as fallback...")
    description = meme_data.get("description", "")
    
    nft_prompt = f"""Create a high-quality NFT digital artwork inspired by the "{template}" meme template.

Style requirements:
- Professional NFT collection quality
- Vibrant, eye-catching colors with excellent contrast
- Sharp details and premium finish
- Modern artistic interpretation while keeping the meme's essence recognizable
- Suitable for digital art marketplace
- Unique artistic flair that makes it collectible

Original meme context: {description}

Make it visually appealing, premium quality, and perfect for NFT collection. Use a modern digital art style with professional lighting and composition."""
    
    try:
        response = client.models.generate_images(
            model=IMAGE_MODEL,
            prompt=nft_prompt
        )
        
        if response.images and len(response.images) > 0:
            # Save the generated image
            safe_filename = "".join(c for c in template if c.isalnum() or c in (' ', '-', '_')).rstrip()
            safe_filename = safe_filename.replace(' ', '_')
            output_path = os.path.join(NFT_DIR, f"{safe_filename}_NFT.png")
            
            with open(output_path, "wb") as f:
                f.write(response.images[0].image_bytes)
            
            print(f"    [SUCCESS] Generated NFT image with Gemini: {safe_filename}_NFT.png")
            return output_path
        else:
            print(f"    [ERROR] No images returned from Gemini for {template}")
            return ""
            
    except Exception as e:
        error_msg = str(e)
        if "billed users" in error_msg or "INVALID_ARGUMENT" in error_msg:
            print(f"    [BILLING] Gemini image generation requires billing setup. Using fallback generator...")
            
            # Use fallback image generation
            try:
                from fallback_image_generator import create_nft_style_image
                output_path = create_nft_style_image(meme_data, NFT_DIR)
                print(f"    [FALLBACK] Created NFT-style image using fallback generator")
                return output_path
            except Exception as fallback_error:
                print(f"    [ERROR] Fallback generator also failed: {fallback_error}")
                return ""
        else:
            print(f"    [ERROR] Error generating NFT for {template}: {e}")
            return ""

def should_generate_nft(meme_data: Dict[str, Any], current_nft_count: int) -> bool:
    """Determine if this meme qualifies for NFT generation - focus on famous meme characters"""
    # Stop if we've reached the maximum NFT limit
    if current_nft_count >= MAX_NFT_IMAGES:
        return False
        
    confidence = meme_data.get("confidence", 0.0)
    meme_type = meme_data.get("meme_type", "unknown")
    template = meme_data.get("template", "Unknown")
    nft_potential = meme_data.get("nft_potential", 0.0)
    
    # Skip if confidence is too low (very strict for quality)
    if confidence < CONFIDENCE_THRESHOLD:
        return False
    
    # Require high NFT potential for quality
    if nft_potential < 0.8:
        return False
    
    # Skip if it's not a familiar meme type
    if meme_type not in ELIGIBLE_MEME_TYPES:
        return False
    
    # Skip generic or unknown templates
    if template.lower() in ["unknown", "other", "custom", "image macro", "top text"]:
        return False
    
    # Prioritize famous character memes
    famous_keywords = ["tom", "jerry", "pepe", "doge", "wojak", "chad", "harold", "drake", "scooby", "spongebob", "shrek"]
    if any(keyword in template.lower() for keyword in famous_keywords):
        return True
    
    return confidence >= 0.98  # Very high bar for non-character memes

def guess_source_from_path(path: str) -> str:
    lower = path.lower()
    if "reddit" in lower: return "Reddit"
    if "insta" in lower or "instagram" in lower: return "Instagram"
    if "twitter" in lower or "x_" in lower or "x.com" in lower: return "Twitter/X"
    return "Unknown"

# ====== Main ======
def main():
    ensure_dirs()
    client = genai.Client()  # reads GEMINI_API_KEY from environment

    files = list(iter_images(MEME_DIR))
    if not files:
        print(f"No images found in '{MEME_DIR}'. Put memes there first.")
        return

    print(f"Analyzing {len(files)} trending memes with Gemini AI: {MODEL}")
    print(f"Focus: Only FAMOUS meme characters & templates (confidence >= {CONFIDENCE_THRESHOLD})")
    print(f"[TARGET] Generating top {MAX_NFT_IMAGES} highest quality NFT images")
    print(f"[PRIORITY] Looking for: Tom & Jerry, Pepe, Doge, Wojak, Chad, Harold, Drake, Scooby-Doo, etc.")
    
    counts = Counter()
    nft_generated = 0
    
    # First pass: analyze all memes to find the best candidates
    all_results = []
    
    print("\n[ANALYZE] Step 1: Analyzing all trending memes...")
    for path in tqdm(files, desc="Analyzing"):
        try:
            result = classify_image(client, path)
            all_results.append(result)
            counts[result.get("template", "Unknown")] += 1
            time.sleep(0.5)  # Small delay to avoid rate limits
        except Exception as e:
            print(f"  [ERROR] Error analyzing {path}: {e}")
            continue
    
    # Sort by quality and filter eligible memes
    eligible_memes = []
    for result in all_results:
        if should_generate_nft(result, 0):  # Check eligibility without count limit
            eligible_memes.append(result)
    
    # Sort by multiple criteria: NFT potential + confidence + famous character bonus
    def meme_quality_score(meme):
        confidence = meme.get("confidence", 0.0)
        nft_potential = meme.get("nft_potential", 0.0)
        template = meme.get("template", "").lower()
        
        # Bonus for famous characters
        famous_keywords = ["tom", "jerry", "pepe", "doge", "wojak", "chad", "harold", "drake", "scooby", "spongebob"]
        fame_bonus = 0.1 if any(keyword in template for keyword in famous_keywords) else 0
        
        return (nft_potential * 0.5) + (confidence * 0.4) + fame_bonus
    
    eligible_memes.sort(key=meme_quality_score, reverse=True)
    top_candidates = eligible_memes[:MAX_NFT_IMAGES]
    
    print(f"\n[QUALITY] Found {len(eligible_memes)} eligible memes, selecting top {len(top_candidates)} highest quality")
    
    if top_candidates:
        print(f"\n[TOP 3] Selected memes for NFT generation:")
        for i, meme in enumerate(top_candidates, 1):
            template = meme.get('template', 'Unknown')
            confidence = meme.get('confidence', 0)
            nft_potential = meme.get('nft_potential', 0)
            quality_score = meme_quality_score(meme)
            print(f"  {i}. {template} (confidence: {confidence:.2f}, NFT potential: {nft_potential:.2f}, quality: {quality_score:.2f})")
    
    # Second pass: generate NFT images for top candidates
    print(f"\n[GENERATE] Step 2: Generating premium NFT images for top meme characters...")
    
    with open(OUT_JSONL, "w", encoding="utf-8") as out:
        for result in all_results:
            # Check if this meme is in our top candidates for NFT generation
            if result in top_candidates and nft_generated < MAX_NFT_IMAGES:
                print(f"\n[GENERATE] Generating NFT image for: {result.get('template')} (confidence: {result.get('confidence', 0):.2f})")
                nft_path = generate_nft_image(client, result)
                if nft_path and nft_path != "BILLING_REQUIRED":
                    nft_generated += 1
                    result["nft_image_path"] = nft_path
                    result["nft_eligible"] = True
                    result["nft_generated"] = True
                    result["nft_rank"] = nft_generated
                elif nft_path == "BILLING_REQUIRED":
                    # Still count as eligible, just no image generated due to billing
                    result["nft_eligible"] = True
                    result["nft_generated"] = False
                    result["nft_image_path"] = None
                    result["nft_rank"] = None
                    result["billing_required"] = True
                else:
                    result["nft_eligible"] = True
                    result["nft_generated"] = False
                    result["nft_image_path"] = None
                    result["nft_rank"] = None
                
                time.sleep(3)  # Longer delay for image generation
            else:
                # Mark as not selected for NFT generation
                result["nft_eligible"] = result in eligible_memes
                result["nft_generated"] = False
                result["nft_image_path"] = None
                result["nft_rank"] = None
                if result not in eligible_memes:
                    print(f"  [SKIP] Skipping NFT for: {result.get('template')} (confidence: {result.get('confidence', 0):.2f}, type: {result.get('meme_type', 'unknown')})")
            
            # Write result to file
            json.dump(result, out, ensure_ascii=False)
            out.write("\n")

    # Simple trend summary
    print(f"\n[COMPLETE] ANALYSIS COMPLETE")
    print("="*50)
    print("Meme Templates Found:")
    for label, c in counts.most_common(20):
        # Handle None values safely
        display_label = label if label is not None else "Unknown/None"
        print(f"  {display_label:<35} {c}")
    
    print(f"\n[SUMMARY] NFT ANALYSIS SUMMARY:")
    print(f"  - Total trending memes analyzed: {len(files)}")
    print(f"  - Eligible memes found: {len(eligible_memes)}")
    print(f"  - NFT images generated: {nft_generated}/{MAX_NFT_IMAGES}")
    
    if nft_generated == 0 and len(eligible_memes) > 0:
        print(f"  - Note: Image generation may require billing setup, but memes are ready for NFT creation")
    
    print(f"  - Analysis success rate: {(len(eligible_memes)/len(files)*100):.1f}%")

    if nft_generated > 0:
        print(f"\n[TROPHY] TOP {nft_generated} NFT MEMES GENERATED:")
        for result in top_candidates[:nft_generated]:
            template = result.get('template', 'Unknown')
            confidence = result.get('confidence', 0)
            print(f"  - {template} (confidence: {confidence:.2f})")

    print(f"\n[FOLDER] OUTPUT LOCATIONS:")
    print(f"  - Analysis results: {OUT_JSONL}")
    print(f"  - Generated NFT images: {NFT_DIR}")
    print(f"  - Ready for minting on NFT marketplaces!")

if __name__ == "__main__":
    main()