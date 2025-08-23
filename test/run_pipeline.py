#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Complete Viral Meme -> NFT Pipeline

This script combines:
1. polling.py - Downloads top 10 viral memes from multiple Reddit subreddits
2. gemini_fixed.py - Analyzes memes and generates NFT images for familiar templates

Usage:
    python run_pipeline.py

Requirements:
    - Reddit API credentials configured in polling.py
    - Gemini API key set as GEMINI_API_KEY environment variable
    - Billing enabled on Google Cloud for image generation
"""

import os
import sys
import subprocess
import time

def run_script(script_name, description):
    """Run a Python script and handle errors"""
    print(f"\n{'='*60}")
    print(f"[STEP] {description}")
    print(f"{'='*60}")
    
    try:
        # Get the Python executable path
        python_exe = sys.executable
        
        # Run the script
        result = subprocess.run([python_exe, script_name], 
                              capture_output=True, 
                              text=True, 
                              cwd=os.getcwd())
        
        if result.returncode == 0:
            print(result.stdout)
            print(f"[SUCCESS] {script_name} completed successfully!")
            return True
        else:
            print(f"[ERROR] {script_name} failed with error:")
            print(result.stderr)
            print(result.stdout)
            return False
            
    except Exception as e:
        print(f"Error running {script_name}: {e}")
        return False

def check_prerequisites():
    """Check if all required components are available"""
    print("Checking prerequisites...")
    
    # Check if required files exist
    required_files = ["polling.py", "gemini_fixed.py"]
    for file in required_files:
        if not os.path.exists(file):
            print(f"Required file missing: {file}")
            return False
        print(f"Found: {file}")
    
    # Check if GEMINI_API_KEY is set
    if not os.getenv("GEMINI_API_KEY"):
        print("GEMINI_API_KEY environment variable not set")
        print("Please set it with: $env:GEMINI_API_KEY='your-api-key'")
        return False
    print("GEMINI_API_KEY is set")
    
    # Check if required packages are installed
    try:
        import praw
        import requests
        from google import genai
        from tqdm import tqdm
        print("All required packages are installed")
    except ImportError as e:
        print(f"Missing required package: {e}")
        return False
    
    return True

def main():
    """Main pipeline execution"""
    print("VIRAL MEME -> NFT PIPELINE")
    print("Step-by-step execution of the complete workflow")
    
    if not check_prerequisites():
        print("\nPrerequisites check failed. Please fix the issues above.")
        return False
    
    print("\nAll prerequisites met! Starting pipeline...")
    
    # Step 1: Download viral memes
    if not run_script("polling.py", "STEP 1: Downloading Viral Memes from Reddit"):
        print("\nPipeline failed at Step 1 (meme downloading)")
        return False
    
    # Small delay between steps
    time.sleep(2)
    
    # Step 2: Generate NFT images
    if not run_script("gemini_fixed.py", "STEP 2: Analyzing Memes & Generating NFT Images"):
        print("\nPipeline failed at Step 2 (NFT generation)")
        return False
    
    # Success summary
    print(f"\n{'='*60}")
    print("PIPELINE COMPLETED SUCCESSFULLY!")
    print(f"{'='*60}")
    print("Check these directories for results:")
    print("  - downloaded_memes/ - Downloaded viral memes")
    print("  - results/nft_images/ - Generated NFT images")
    print("  - results/meme_results.jsonl - Analysis data")
    print("\nYour viral memes are now ready for NFT minting!")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)