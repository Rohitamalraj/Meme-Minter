#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Stability AI Image Generator for NFT Creation
Uses the Stability AI REST API to generate high-quality NFT images
"""

import os
import requests
import json
import base64
from typing import Dict, Any

# Stability AI API Configuration
STABILITY_API_KEY = os.getenv("STABILITY_API_KEY", "")
STABILITY_API_HOST = "https://api.stability.ai"
STABILITY_ENGINE = "stable-diffusion-v1-6"  # or "stable-diffusion-xl-1024-v1-0"

def generate_nft_image_with_stability(meme_data: Dict[str, Any], output_dir: str) -> str:
    """
    Generate NFT-style image using Stability AI API
    
    Args:
        meme_data: Dictionary containing meme template and description
        output_dir: Directory to save the generated image
        
    Returns:
        Path to generated image file, or empty string if failed
    """
    if not STABILITY_API_KEY:
        print("    [ERROR] STABILITY_API_KEY not set in environment")
        return ""
    
    template = meme_data.get("template", "Unknown")
    description = meme_data.get("description", "")
    confidence = meme_data.get("confidence", 0)
    
    # Create enhanced NFT prompt based on meme template
    nft_prompt = f"""
High-quality digital NFT artwork inspired by the "{template}" meme template.

Style: Professional NFT collection art, vibrant colors, premium digital illustration, trending on OpenSea
Quality: 4K resolution, sharp details, collectible artwork
Aesthetic: Modern digital art style with excellent composition and lighting
Theme: Internet culture meme transformed into valuable NFT art

Original context: {description}

Create a unique, valuable, and visually stunning NFT that captures the essence of this viral meme while being suitable for premium NFT marketplaces.
""".strip()
    
    # Stability AI API request
    try:
        print(f"    [STABILITY] Generating NFT image with Stability AI...")
        print(f"    [PROMPT] {template} (confidence: {confidence:.2f})")
        
        response = requests.post(
            f"{STABILITY_API_HOST}/v1/generation/{STABILITY_ENGINE}/text-to-image",
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": f"Bearer {STABILITY_API_KEY}"
            },
            json={
                "text_prompts": [
                    {
                        "text": nft_prompt,
                        "weight": 1
                    }
                ],
                "cfg_scale": 7,
                "height": 512,
                "width": 512,
                "samples": 1,
                "steps": 30,
                "style_preset": "digital-art"  # NFT-appropriate style
            },
        )
        
        if response.status_code != 200:
            error_msg = f"HTTP {response.status_code}"
            try:
                error_data = response.json()
                error_msg = error_data.get("message", error_msg)
            except:
                pass
            print(f"    [ERROR] Stability AI API error: {error_msg}")
            return ""
        
        # Parse response and save image
        data = response.json()
        
        if not data.get("artifacts"):
            print(f"    [ERROR] No images returned from Stability AI")
            return ""
        
        # Get the first generated image
        image_data = data["artifacts"][0]
        image_base64 = image_data["base64"]
        
        # Create safe filename
        safe_filename = "".join(c for c in template if c.isalnum() or c in (' ', '-', '_')).strip()
        safe_filename = safe_filename.replace(' ', '_')
        output_path = os.path.join(output_dir, f"{safe_filename}_NFT.png")
        
        # Decode and save image
        with open(output_path, "wb") as f:
            f.write(base64.b64decode(image_base64))
        
        print(f"    [SUCCESS] Generated NFT image: {safe_filename}_NFT.png")
        return output_path
        
    except requests.exceptions.RequestException as e:
        print(f"    [ERROR] Network error with Stability AI: {e}")
        return ""
    except Exception as e:
        print(f"    [ERROR] Error generating NFT with Stability AI: {e}")
        return ""

def test_stability_ai():
    """Test function to verify Stability AI API connection"""
    if not STABILITY_API_KEY:
        print("❌ STABILITY_API_KEY not set")
        print("Please set your Stability AI API key:")
        print("$env:STABILITY_API_KEY='your-api-key'")
        return False
    
    print(f"✅ Testing Stability AI API...")
    print(f"   API Key: {STABILITY_API_KEY[:20]}...")
    
    # Test with simple prompt
    test_meme = {
        "template": "Test Meme",
        "description": "A simple test meme for API verification",
        "confidence": 1.0
    }
    
    os.makedirs("test_output", exist_ok=True)
    result = generate_nft_image_with_stability(test_meme, "test_output")
    
    if result:
        print(f"✅ Stability AI API working! Test image saved to: {result}")
        return True
    else:
        print("❌ Stability AI API test failed")
        return False

if __name__ == "__main__":
    test_stability_ai()
