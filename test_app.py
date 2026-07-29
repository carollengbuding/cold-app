import asyncio, json, datetime
from playwright.async_api import async_playwright

async def main():
    errors = []
    logs = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path="/usr/bin/chromium",
            args=["--no-sandbox", "--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"]
        )
        page = await browser.new_page(viewport={"width": 390, "height": 844}, is_mobile=True)
        page.on("console", lambda m: logs.append(f"{m.type}: {m.text}"))
        page.on("pageerror", lambda e: errors.append(str(e)))
        await page.goto("http://localhost:8765/index.html", wait_until="networkidle")
        await page.wait_for_timeout(2200)

        app_visible = await page.evaluate("!document.querySelector('#app').classList.contains('hidden')")
        print("app visible after splash:", app_visible)
        task_count = await page.eval_on_selector_all(".task-mini", "els => els.length")
        print("task mini count:", task_count)

        # 打开侧边栏
        await page.click('#menuBtn')
        await page.wait_for_timeout(500)
        sidebar_open = await page.evaluate("document.querySelector('#sidebar').classList.contains('open')")
        print("sidebar open:", sidebar_open)

        # 导航测试 - 点击运动
        await page.click('.nav-item[data-page="exercise"]')
        await page.wait_for_timeout(500)
        exercise_active = await page.evaluate("document.querySelector('.page[data-page=exercise]').classList.contains('active')")
        print("exercise page active:", exercise_active)
        ex_items = await page.eval_on_selector_all("#exerciseList .exercise-item", "els => els.length")
        print("exercise recommend items:", ex_items)

        await page.click('[data-ex-idx="0"]')
        await page.wait_for_timeout(500)
        reward_shown = await page.evaluate("document.querySelector('#rewardModal').classList.contains('show')")
        print("reward modal shown on exercise check:", reward_shown)
        await page.click('#rewardClose')
        await page.wait_for_timeout(300)

        # 英语页面
        await page.click('#menuBtn'); await page.wait_for_timeout(400)
        await page.click('.nav-item[data-page="english"]')
        await page.wait_for_timeout(500)
        en_word = await page.evaluate("document.querySelector('#enEn').textContent")
        print("english word:", en_word)
        print("english record btn:", await page.evaluate("!!document.querySelector('#enRecord')"))
        vocab = await page.eval_on_selector_all("#enVocab .vocab-item", "els=>els.length")
        print("english vocab items:", vocab)
        ko_vocab = await page.eval_on_selector_all("#koVocab .vocab-item", "els=>els.length")
        print("korean vocab items:", ko_vocab)
        ja_vocab = await page.eval_on_selector_all("#jaVocab .vocab-item", "els=>els.length")
        print("japanese vocab items:", ja_vocab)

        await page.click('#menuBtn'); await page.wait_for_timeout(400)
        await page.click('.nav-item[data-page="korean"]')
        await page.wait_for_timeout(300)
        print("korean word:", await page.evaluate("document.querySelector('#koWord').textContent"))

        await page.click('#menuBtn'); await page.wait_for_timeout(400)
        await page.click('.nav-item[data-page="japanese"]')
        await page.wait_for_timeout(300)
        print("japanese word:", await page.evaluate("document.querySelector('#jaWord').textContent"))

        await page.click('#menuBtn'); await page.wait_for_timeout(400)
        await page.click('.nav-item[data-page="news"]')
        await page.wait_for_timeout(300)
        print("news items (world):", await page.eval_on_selector_all("#newsContent .news-item", "els=>els.length"))

        await page.click('#menuBtn'); await page.wait_for_timeout(400)
        await page.click('.nav-item[data-page="diet"]')
        await page.wait_for_timeout(300)
        await page.fill('#mealContent', '燕麦粥')
        await page.fill('#mealKcal', '300')
        await page.click('#saveMealBtn')
        await page.wait_for_timeout(500)
        print("meal items after save:", await page.eval_on_selector_all("#mealList .meal-item", "els=>els.length"))
        print("total kcal:", await page.evaluate("document.querySelector('#totalKcal').textContent"))

        # 晨间流程测试
        await page.click('#menuBtn'); await page.wait_for_timeout(400)
        await page.click('.nav-item[data-page="morning"]')
        await page.wait_for_timeout(300)
        await page.click('input[data-task="baduanjin"] + .check-box')
        await page.wait_for_timeout(400)
        modal = await page.evaluate("document.querySelector('#rewardModal').classList.contains('show')")
        print("reward modal on baduanjin check:", modal)
        await page.click('#rewardClose')
        await page.wait_for_timeout(300)
        print("baduanjin meta:", await page.evaluate("document.querySelector('#baduanjinMeta').textContent"))

        await page.click('#menuBtn'); await page.wait_for_timeout(400)
        await page.click('.nav-item[data-page="stats"]')
        await page.wait_for_timeout(500)
        print("badge items:", await page.eval_on_selector_all("#badgeList .badge-item", "els=>els.length"))
        print("stat today:", await page.evaluate("document.querySelector('#statToday').textContent"))

        storage = await page.evaluate("localStorage.getItem('cold_but_strong_v1')")
        print("storage exists:", bool(storage))
        if storage:
            d = json.loads(storage)
            today = datetime.date.today().isoformat()
            meals = (d.get('days') or {}).get(today, {}).get('meals', [])
            print("today meals in storage:", len(meals))

        print("\n=== JS ERRORS ===")
        print(len(errors), "errors")
        for e in errors: print(e)
        print("\n=== CONSOLE ERRORS ===")
        for l in logs:
            if 'error' in l.lower(): print(l)

        await browser.close()

asyncio.run(main())
