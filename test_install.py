import asyncio
from playwright.async_api import async_playwright

async def main():
    errors = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path="/usr/bin/chromium", args=["--no-sandbox"])
        page = await browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("console", lambda m: errors.append(m.text) if m.type=="error" else None)
        await page.goto("http://localhost:8000/index.html", wait_until="networkidle")
        await page.wait_for_timeout(2200)

        install_visible = await page.evaluate("getComputedStyle(document.querySelector('#installCard')).display !== 'none'")
        print("install card visible:", install_visible)
        install_btn = await page.evaluate("!!document.querySelector('#installBtn')")
        print("install btn exists:", install_btn)

        # 截图带安装卡片的首页
        await page.screenshot(path="/workspace/cold-app/shots/home_install.png")

        # 点击安装按钮（headless 无 beforeinstallprompt -> 应弹出手动引导）
        await page.click('#installBtn')
        await page.wait_for_timeout(500)
        guide_shown = await page.evaluate("document.querySelector('#installGuide').classList.contains('show')")
        print("install guide modal shown (iOS path):", guide_shown)
        await page.screenshot(path="/workspace/cold-app/shots/install_guide.png")
        await page.click('#installGuideClose')
        await page.wait_for_timeout(300)

        # 关闭卡片
        await page.click('#installClose')
        await page.wait_for_timeout(300)
        install_after = await page.evaluate("getComputedStyle(document.querySelector('#installCard')).display !== 'none'")
        print("install card visible after close:", install_after)

        # 验证 PWA 可安装条件：manifest 可加载
        manifest = await page.evaluate("""async () => {
            const res = await fetch('manifest.json'); const j = await res.json();
            return { name: j.name, display: j.display, icons: j.icons.length, theme: j.theme_color };
        }""")
        print("manifest:", manifest)

        print("JS errors:", len(errors))
        for e in errors[:5]: print("  ", e)
        await browser.close()

asyncio.run(main())
