import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path="/usr/bin/chromium", args=["--no-sandbox"])
        page = await browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
        await page.goto("http://localhost:8765/index.html", wait_until="networkidle")
        await page.evaluate("navigator.serviceWorker.getRegistrations().then(r=>r.forEach(x=>x.unregister()))")
        await page.evaluate("caches.keys().then(ks=>Promise.all(ks.map(k=>caches.delete(k))))")
        await page.reload(wait_until="networkidle")
        await page.wait_for_timeout(2200)

        # 1. 奖励弹窗 - 在晨间页勾选"7:20 起床"
        await page.evaluate("Nav.go('morning')"); await page.wait_for_timeout(500)
        await page.click('input[data-task="morning"] + .check-box')
        await page.wait_for_timeout(700)
        await page.screenshot(path="/workspace/cold-app/shots/reward.png")
        await page.click('#rewardClose')
        await page.wait_for_timeout(300)

        # 2. 饮食页 - 添加一条记录
        await page.evaluate("Nav.go('diet')"); await page.wait_for_timeout(400)
        await page.fill('#mealContent', '燕麦粥 + 水煮蛋')
        await page.fill('#mealKcal', '420')
        await page.fill('#mealWater', '300')
        await page.click('.meal-tab[data-meal="lunch"]')
        await page.fill('#mealContent', '糙米饭 + 清炒西兰花 + 鸡胸肉')
        await page.fill('#mealKcal', '550')
        await page.click('#saveMealBtn')
        await page.wait_for_timeout(500)
        await page.screenshot(path="/workspace/cold-app/shots/diet_full.png")

        # 3. 英语页 - 滚动到词汇
        await page.evaluate("Nav.go('english')"); await page.wait_for_timeout(500)
        await page.evaluate("document.querySelector('main').scrollTo(0, 800)")
        await page.wait_for_timeout(300)
        await page.screenshot(path="/workspace/cold-app/shots/english_vocab.png")

        # 4. 韩语
        await page.evaluate("Nav.go('korean')"); await page.wait_for_timeout(500)
        await page.evaluate("document.querySelector('main').scrollTo(0, 600)")
        await page.wait_for_timeout(300)
        await page.screenshot(path="/workspace/cold-app/shots/korean_vocab.png")

        # 5. 晨间流程
        await page.evaluate("Nav.go('morning')"); await page.wait_for_timeout(500)
        await page.screenshot(path="/workspace/cold-app/shots/morning.png")

        # 6. 睡前复盘
        await page.evaluate("Nav.go('review')"); await page.wait_for_timeout(500)
        await page.screenshot(path="/workspace/cold-app/shots/review.png")

        # 7. 技能页
        await page.evaluate("Nav.go('skill')"); await page.wait_for_timeout(500)
        await page.screenshot(path="/workspace/cold-app/shots/skill.png")

        print("done")
        await browser.close()

asyncio.run(main())
