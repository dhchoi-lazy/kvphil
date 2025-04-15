import random
import asyncio
import aiohttp
from lxml import html
from fake_useragent import UserAgent
import os
from pathlib import Path
from datetime import datetime
import json


def log_message(message):
    """Print message with timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {message}")


async def fetch_with_retry(session, url, proxy=None, max_retries=3, initial_delay=1):
    retries = 0
    while True:
        try:
            async with session.get(url, proxy=proxy, timeout=10) as response:
                if response.status == 200:
                    return await response.text(), None
                elif response.status == 429:
                    delay = initial_delay * (2**retries) + random.uniform(0, 1)
                    log_message(
                        f"Rate limited on {url}. Waiting {delay:.2f} seconds..."
                    )
                    await asyncio.sleep(delay)
                else:
                    raise aiohttp.ClientError(f"HTTP {response.status}")
        except Exception as e:
            if retries >= max_retries:
                return None, str(e)
            retries += 1
            delay = initial_delay * (2**retries) + random.uniform(0, 1)
            log_message(
                f"Attempt {retries}/{max_retries} failed for {url}: {e}. Waiting {delay:.2f}s"
            )
            await asyncio.sleep(delay)


async def fetch_proxies(max_retries=3):
    log_message("Starting proxy list fetch...")
    proxy_url = (
        "https://raw.githubusercontent.com/monosans/proxy-list/main/proxies_pretty.json"
    )
    async with aiohttp.ClientSession() as session:
        content, error = await fetch_with_retry(
            session, proxy_url, max_retries=max_retries
        )
        if content:
            try:
                proxy_data = json.loads(content)
                # Filter only HTTP proxies and format them
                proxies = [
                    f"{p['protocol']}://{p['host']}:{p['port']}"
                    for p in proxy_data
                    if p["protocol"] in ("http", "https")
                ]
                log_message(f"Successfully fetched {len(proxies)} HTTP proxies")
                # Sort by timeout if available
                proxy_data = sorted(
                    [p for p in proxy_data if p["protocol"] in ("http", "https")],
                    key=lambda x: x.get("timeout", float("inf")),
                )
                proxies = [
                    f"{p['protocol']}://{p['host']}:{p['port']}" for p in proxy_data
                ]
                return proxies
            except json.JSONDecodeError as e:
                log_message(f"Failed to parse proxy JSON: {e}")
                return []
        log_message(f"Failed to fetch proxies: {error}")
        return []


async def test_proxy(proxy, max_retries=2):
    test_url = "https://httpbin.org/ip"
    async with aiohttp.ClientSession() as session:
        content, error = await fetch_with_retry(
            session, test_url, proxy=proxy, max_retries=max_retries
        )
        if content:
            log_message(f"Found working proxy: {proxy}")
            return proxy
        return None


async def save_html_content(content, page_num, output_dir):
    filepath = output_dir / f"page_{page_num:03d}.html"
    try:
        filepath.write_text(content, encoding="utf-8")
        log_message(f"Saved page {page_num} to {filepath}")
        return True
    except Exception as e:
        log_message(f"Error saving page {page_num}: {e}")
        return False


async def crawl_single_page(session, url, proxy, headers):
    log_message(f"Attempting to fetch: {url}")
    content, error = await fetch_with_retry(session, url, proxy=proxy)
    if content:
        try:
            tree = html.fromstring(content)
            title = tree.xpath("//title/text()")
            if title and "朱子語類" in title[0]:
                log_message(f"Successfully fetched: {title[0].strip()}")
                return content, None
            else:
                log_message(f"Invalid content received for {url}")
        except Exception as e:
            log_message(f"Error parsing content from {url}: {e}")
    return None, error


async def crawl_pages(proxy, pages_to_crawl, output_dir):
    ua = UserAgent()
    headers = {"User-Agent": ua.random, "Referer": "https://ctext.org"}
    successful_pages = []
    failed_pages = []

    log_message(
        f"Starting batch crawl of {len(pages_to_crawl)} pages using proxy: {proxy}"
    )
    async with aiohttp.ClientSession(headers=headers) as session:
        for page_num in pages_to_crawl:
            url = f"https://ctext.org/zhuzi-yulei/{page_num}/zh"
            content, error = await crawl_single_page(session, url, proxy, headers)

            if content and await save_html_content(content, page_num, output_dir):
                successful_pages.append(page_num)
                log_message(f"Page {page_num} successfully processed and saved")
            else:
                failed_pages.append(page_num)
                log_message(f"Failed to process page {page_num}: {error}")

    log_message(
        f"Batch complete. Success: {len(successful_pages)}, Failed: {len(failed_pages)}"
    )
    return successful_pages, failed_pages


async def get_working_proxy(proxies, max_retries=2):
    log_message("Testing proxies to find a working one...")
    tasks = [test_proxy(proxy, max_retries) for proxy in proxies]
    for task in asyncio.as_completed(tasks):
        result = await task
        if result:
            return result
    log_message("No working proxies found")
    return None


async def main():
    log_message("Starting crawler...")

    # Create output directory
    output_dir = Path("zhuxi")
    output_dir.mkdir(exist_ok=True)
    log_message(f"Created output directory: {output_dir}")

    # Initialize parameters
    max_proxy_fetch_retries = 5
    total_pages = 140
    pages_to_crawl = list(range(1, total_pages + 1))
    collected_pages = []

    while pages_to_crawl:
        log_message(f"Remaining pages to crawl: {len(pages_to_crawl)}")

        # Get proxies
        proxies = await fetch_proxies(max_retries=max_proxy_fetch_retries)
        if not proxies:
            log_message("No proxies available. Waiting 30 seconds before retry...")
            await asyncio.sleep(30)
            continue

        # Get working proxy
        working_proxy = await get_working_proxy(proxies)
        if not working_proxy:
            log_message("Failed to find working proxy. Waiting 10 seconds...")
            await asyncio.sleep(10)
            continue

        # Crawl pages
        successful, failed = await crawl_pages(
            working_proxy, pages_to_crawl, output_dir
        )
        collected_pages.extend(successful)
        pages_to_crawl = failed

        log_message(
            f"Current progress: {len(collected_pages)}/{total_pages} pages collected"
        )

        if failed:
            log_message(f"Switching proxy to retry {len(failed)} failed pages...")
            await asyncio.sleep(5)

    log_message(
        f"Crawling completed. Successfully collected {len(collected_pages)}/{total_pages} pages"
    )
    if len(collected_pages) < total_pages:
        missing = set(range(1, total_pages + 1)) - set(collected_pages)
        log_message(f"Missing pages: {missing}")


if __name__ == "__main__":
    asyncio.run(main())
