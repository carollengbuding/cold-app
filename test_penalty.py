import asyncio, json, datetime
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path="/usr/bin/chromium", args=["--no-sandbox"])
        page = await browser.new_page(viewport={"width": 390, "height": 844})
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))

        # 预设 localStorage：模拟昨天有任务未完成
        await page.goto("http://localhost:8765/index.html", wait_until="domcontentloaded")
        # 清除旧的 service worker 与缓存（防止返回旧版 app.js）
        await page.evaluate("navigator.serviceWorker.getRegistrations().then(r=>r.forEach(x=>x.unregister()))")
        await page.evaluate("caches.keys().then(ks=>Promise.all(ks.map(k=>caches.delete(k))))")
        yesterday = (datetime.date.today() - datetime.timedelta(days=1)).isoformat()
        preset = {
            "createdAt": 0, "lastDate": yesterday, "streak": 0, "totalDone": 0, "totalPenalty": 0,
            "days": {
                yesterday: {
                    "date": yesterday, "tasks": {
                        "morning": {"done": True},
                        "baduanjin": {"done": False},
                        "plan": {"done": True},
                        "exercise": {"done": False},
                        "study": {"done": True},
                        "skill": {"done": False},
                        "review": {"done": True},
                        "sleep": {"done": True}
                    },
                    "exercise": {}, "study": {}, "skill": {}, "meals": [], "review": {}, "plan": "", "baduanjinNote": ""
                }
            },
            "penalties": [], "unlockedBadges": []
        }
        await page.evaluate(f"localStorage.setItem('cold_but_strong_v1', '{json.dumps(preset)}')")
        await page.reload(wait_until="networkidle")
        await page.wait_for_timeout(2500)

        # 调试：直接看 APP.userData 和日期
        debug = await page.evaluate("""() => {
            const u = APP.userData;
            return {
                lastDate: u.lastDate,
                today: new Date().toISOString().slice(0,10),
                yesterdayKey: (() => { const d=new Date(); d.setDate(d.getDate()-1); return d.toISOString().slice(0,10); })(),
                hasYesterday: !!(u.days && (u.days[Object.keys(u.days).find(k=>k<new Date().toISOString().slice(0,10))])),
                daysKeys: Object.keys(u.days||{}),
                yesterdayTasks: u.days ? Object.entries(u.days).filter(([k])=>k<new Date().toISOString().slice(0,10))[0]?.[1]?.tasks : null,
                totalPenalty: u.totalPenalty,
                penaltiesList: u.penalties
            };
        }""")
        print("DEBUG:", json.dumps(debug, ensure_ascii=False, indent=2, default=str))

        # 1. 翻倍惩罚弹窗应弹出
        penalty_modal = await page.evaluate("document.querySelector('#penaltyModal').classList.contains('show')")
        print("penalty modal shown:", penalty_modal)
        penalty_items = await page.eval_on_selector_all("#penaltyListModal .p-item", "els => els.length")
        print("penalty list items:", penalty_items)

        # 2. 周历中昨天应标红
        penalty_days = await page.eval_on_selector_all(".week-day.penalty", "els => els.length")
        print("week day penalty marked:", penalty_days)

        # 3. 今天的数据应包含翻倍标记
        today = datetime.date.today().isoformat()
        d = json.loads(await page.evaluate("localStorage.getItem('cold_but_strong_v1')"))
        today_tasks = d["days"].get(today, {}).get("tasks", {})
        doubled = sum(1 for v in today_tasks.values() if v.get("double"))
        print("today double tasks:", doubled)
        yesterday_tasks = d["days"][yesterday]["tasks"]
        marked = sum(1 for v in yesterday_tasks.values() if v.get("penaltyMarked"))
        print("yesterday penalty marked:", marked)
        total_penalty = d.get("totalPenalty", 0)
        print("totalPenalty count:", total_penalty)
        print("penalties list:", len(d.get("penalties", [])))

        # 4. 首页任务应显示翻倍警告样式
        penalty_tasks_home = await page.eval_on_selector_all(".task-mini.penalty", "els => els.length")
        print("home task-mini penalty count:", penalty_tasks_home)

        # 关闭弹窗后再截图
        await page.click('#penaltyClose')
        await page.wait_for_timeout(400)
        await page.screenshot(path="/workspace/cold-app/shots/penalty_home.png")

        # 截图统计页的翻倍记录
        await page.evaluate("Nav.go('stats')")
        await page.wait_for_timeout(500)
        await page.screenshot(path="/workspace/cold-app/shots/penalty_stats.png")

        print("\n=== JS ERRORS ===", len(errors))
        for e in errors: print(e)
        await browser.close()

asyncio.run(main())
