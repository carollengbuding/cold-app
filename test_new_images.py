import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path="/usr/bin/chromium", args=["--no-sandbox"])
        page = await browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
        await page.goto("http://localhost:8000/index.html", wait_until="networkidle")
        # 清缓存
        await page.evaluate("navigator.serviceWorker.getRegistrations().then(r=>r.forEach(x=>x.unregister()))")
        await page.evaluate("caches.keys().then(ks=>Promise.all(ks.map(k=>caches.delete(k))))")
        await page.reload(wait_until="networkidle")
        await page.wait_for_timeout(2200)

        # 1. 奖励弹窗（用新图1 粉红举手小熊）
        await page.evaluate("Nav.go('morning')"); await page.wait_for_timeout(400)
        await page.click('input[data-task="morning"] + .check-box')
        await page.wait_for_timeout(700)
        await page.screenshot(path="/workspace/cold-app/shots/reward_new.png")
        print("reward modal src:", await page.evaluate("document.querySelector('.reward-img').src"))
        await page.click('#rewardClose')
        await page.wait_for_timeout(300)

        # 2. 警告弹窗（用新图2 粉红严肃熊）
        import json, datetime
        yesterday = (datetime.date.today() - datetime.timedelta(days=1)).isoformat()
        preset = {
            "createdAt": 0, "lastDate": yesterday, "streak": 0, "totalDone": 0, "totalPenalty": 0,
            "days": {
                yesterday: {
                    "date": yesterday, "tasks": {
                        "morning": {"done": True}, "baduanjin": {"done": False},
                        "plan": {"done": True}, "exercise": {"done": False},
                        "study": {"done": True}, "skill": {"done": False},
                        "review": {"done": True}, "sleep": {"done": True}
                    },
                    "exercise": {}, "study": {}, "skill": {}, "meals": [], "review": {}, "plan": "", "baduanjinNote": ""
                }
            },
            "penalties": [], "unlockedBadges": []
        }
        await page.evaluate(f"localStorage.setItem('cold_but_strong_v1', '{json.dumps(preset)}')")
        await page.reload(wait_until="networkidle")
        await page.wait_for_timeout(2500)
        await page.screenshot(path="/workspace/cold-app/shots/penalty_new.png")
        print("penalty modal img src:", await page.evaluate("document.querySelector('.penalty-img').src"))
        print("penalty title:", await page.evaluate("document.querySelector('#penaltyModal h3').textContent"))

        print("done")
        await browser.close()

asyncio.run(main())
