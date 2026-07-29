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
        await page.evaluate("navigator.serviceWorker.getRegistrations().then(r=>r.forEach(x=>x.unregister()))")
        await page.evaluate("caches.keys().then(ks=>Promise.all(ks.map(k=>caches.delete(k))))")
        await page.reload(wait_until="networkidle")
        await page.wait_for_timeout(2200)

        # 任务数与图标
        task_count = await page.eval_on_selector_all(".task-mini", "els=>els.length")
        print("task count:", task_count)
        ico_imgs = await page.eval_on_selector_all(".task-mini-ico img", "els=>els.map(e=>e.getAttribute('src'))")
        print("first 5 task icon imgs:", ico_imgs)
        ico_text = await page.eval_on_selector_all(".task-mini-ico", "els=>els.map(e=>e.textContent.trim())")
        print("all task ico text:", ico_text)

        # 三语页面与 nav-item 不存在
        en_page = await page.evaluate("!!document.querySelector('.page[data-page=english]')")
        ko_page = await page.evaluate("!!document.querySelector('.page[data-page=korean]')")
        ja_page = await page.evaluate("!!document.querySelector('.page[data-page=japanese]')")
        print("english page exists:", en_page)
        print("korean page exists:", ko_page)
        print("japanese page exists:", ja_page)

        nav_en = await page.evaluate("!!document.querySelector('.nav-item[data-page=english]')")
        nav_ko = await page.evaluate("!!document.querySelector('.nav-item[data-page=korean]')")
        nav_ja = await page.evaluate("!!document.querySelector('.nav-item[data-page=japanese]')")
        print("nav english:", nav_en, "korean:", nav_ko, "japanese:", nav_ja)

        # 今日学习 section 不存在
        home_en = await page.evaluate("!!document.querySelector('#homeEn')")
        print("home english card:", home_en)

        # 截图首页
        await page.screenshot(path="/workspace/cold-app/shots/home_new.png")

        # 侧边栏截图
        await page.click('#menuBtn')
        await page.wait_for_timeout(500)
        await page.screenshot(path="/workspace/cold-app/shots/sidebar_new.png")

        print("JS errors:", len(errors))
        for e in errors[:5]: print("  ", e)
        await browser.close()

asyncio.run(main())
