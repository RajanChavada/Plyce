
import asyncio
import os
import time
from playwright.async_api import async_playwright

# LIST OF PROXIES TO TEST
# Format: "http://IP:PORT" or "http://USER:PASS@IP:PORT"
PROXIES_TO_TEST = [
    # SOCKS5 Proxies
    "http://192.95.42.140:1080",
    "http://1.0.0.4:80",
]

TARGET_URL = "https://www.tiktok.com"
TIMEOUT_MS = 10000  # 10 seconds timeout per proxy

async def test_proxy(proxy_url):
    print(f"Testing proxy: {proxy_url} ...")
    async with async_playwright() as p:
        try:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                proxy={"server": proxy_url},
                ignore_https_errors=True
            )
            page = await context.new_page()
            
            start_time = time.time()
            response = await page.goto(TARGET_URL, timeout=TIMEOUT_MS)
            duration = time.time() - start_time
            
            status = response.status
            title = await page.title()
            
            print(f"✅ SUCCESS: {proxy_url}")
            print(f"   - Status: {status}")
            print(f"   - Latency: {duration:.2f}s")
            print(f"   - Title: {title[:50]}...")
            
            await browser.close()
            return True
            
        except Exception as e:
            print(f"❌ FAILED: {proxy_url}")
            print(f"   - Error: {str(e)}")
            return False

async def main():
    if not PROXIES_TO_TEST:
        print("⚠️ No proxies in list! Edit the script to add proxies to PROXIES_TO_TEST.")
        return

    print(f"🚀 Starting proxy tester for {len(PROXIES_TO_TEST)} proxies...")
    print("-" * 50)
    
    working_proxies = []
    
    for proxy in PROXIES_TO_TEST:
        is_working = await test_proxy(proxy)
        if is_working:
            working_proxies.append(proxy)
        print("-" * 50)
        
    print("\n🏁 TEST COMPLETE")
    print(f"Found {len(working_proxies)} working proxies:")
    for p in working_proxies:
        print(f" -> {p}")

if __name__ == "__main__":
    asyncio.run(main())
