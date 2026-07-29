import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path="/usr/bin/chromium",
            args=["--no-sandbox"]
        )
        page = await browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
        await page.goto("http://localhost:8765/index.html", wait_until="networkidle")
        await page.wait_for_timeout(2200)

        await page.screenshot(path="/workspace/cold-app/shots/home.png")

        # 侧边栏截图
        await page.click('#menuBtn')
        await page.wait_for_timeout(500)
        await page.screenshot(path="/workspace/cold-app/shots/sidebar.png")
        await page.evaluate("Sidebar.close()")
        await page.wait_for_timeout(400)

        for name in ['exercise', 'english', 'korean', 'news', 'diet', 'stats']:
            await page.evaluate(f"Nav.go('{name}')")
            await page.wait_for_timeout(500)
            await page.screenshot(path=f"/workspace/cold-app/shots/{name}.png")

        print("screenshots done")
        await browser.close()

asyncio.run(main())
