#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install Python dependencies
pip install -r requirements.txt

# Install Playwright browsers
export PLAYWRIGHT_BROWSERS_PATH=/opt/render/project/src/playwright-browsers
python -m playwright install chromium
