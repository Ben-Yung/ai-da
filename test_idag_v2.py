#!/usr/bin/env python3
"""測試「愛打」Web App E2E — v2 正確版本"""
import asyncio, json, os, sys
from datetime import datetime
from playwright.async_api import async_playwright, TimeoutError as PTimeout

BASE_URL = "https://liable-tennis-outreach-pediatric.trycloudflare.com"
SCREENSHOT_DIR = "/home/ubuntu/.openclaw/workspace/test_screenshots_v2"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

report = {
    "timestamp": datetime.now().isoformat(),
    "url": BASE_URL,
    "tests": [],
    "js_errors": [],
    "bugs": []
}

def R(name, status, detail="", screenshot=None):
    report["tests"].append({"name": name, "status": status, "detail": detail, "screenshot": screenshot})
    print(f"  [{status:6}] {name}: {detail[:100] if detail else 'OK'}", flush=True)

def BUG(severity, desc, test=None):
    report["bugs"].append({"severity": severity, "description": desc, "test": test})
    print(f"  🐛 [{severity}] {desc[:120]}", flush=True)

async def screenshot(page, name):
    p = os.path.join(SCREENSHOT_DIR, f"{name}.png")
    await page.screenshot(path=p, full_page=False)
    return p

async def wait_stable(page, t=1.0):
    await asyncio.sleep(t)

async def find_visible_buttons(page, keywords):
    """Find visible clickable elements by text keywords"""
    result = await page.evaluate(f"""({json.dumps(keywords)}) => {{
        const all = document.querySelectorAll('button, a, [role="button"], .home-card, .card, [class*="btn"], [onclick]');
        const found = [];
        all.forEach(el => {{
            const text = (el.textContent || '').trim().toLowerCase();
            const rect = el.getBoundingClientRect();
            const style = window.getComputedStyle(el);
            const visible = rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
            for (const kw of keywords) {{
                if (text.includes(kw.toLowerCase())) {{
                    found.push({{
                        tag: el.tagName, id: el.id, class: el.className,
                        text: (el.textContent || '').trim().slice(0, 40),
                        rect: {{x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height)}},
                        visible: visible
                    }});
                    break;
                }}
            }}
        }});
        return found;
    }}""")
    return result

async def click_visible(page, text_pattern):
    """Click first visible element whose text matches the pattern"""
    els = await page.query_selector_all(f'button:has-text("{text_pattern}"), a:has-text("{text_pattern}"), .home-card:has-text("{text_pattern}"), [role="button"]:has-text("{text_pattern}")')
    for el in els:
        if await el.is_visible():
            await el.click()
            return True

    # Try with broader search
    els = await page.query_selector_all(f'text="{text_pattern}"')
    for el in els:
        if await el.is_visible():
            await el.click()
            return True

    return False

async def main():
    print("🧪 測試「愛打」Web App v2", flush=True)
    print(f"   URL: {BASE_URL}", flush=True)
    print("=" * 60, flush=True)

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True, args=["--no-sandbox"])
        context = await browser.new_context(viewport={"width": 390, "height": 844})  # iPhone 14 size
        page = await context.new_page()

        # Collect console errors
        js_errors = []
        page.on("console", lambda msg: js_errors.append({"type": msg.type, "text": msg.text[:200]}) if msg.type == "error" else None)
        page.on("pageerror", lambda err: js_errors.append({"type": "pageerror", "text": str(err)[:200]}))

        # ─────── 1. 首頁載入 ───────
        print("\n=== 1. 首頁載入 ===", flush=True)
        await page.goto(BASE_URL, wait_until="networkidle", timeout=30000)
        await wait_stable(page, 0.5)

        # Check splash is showing
        splash_visible = await page.evaluate("() => document.getElementById('splash-screen') && !document.getElementById('splash-screen').classList.contains('hidden')")
        R("splash-visible", "PASS" if splash_visible else "WARN",
          f"Splash screen visible: {splash_visible}",
          await screenshot(page, "01-splash"))

        # Skip splash by clicking canvas
        canvas = await page.query_selector('#splash-canvas')
        if canvas:
            await canvas.click()
            await wait_stable(page, 0.5)

        # Check if splash skipped and auth appeared
        auth_visible = await page.evaluate("() => document.getElementById('auth-screen') && !document.getElementById('auth-screen').classList.contains('hidden')")
        R("splash-skip", "PASS" if auth_visible else "WARN",
          f"Auth screen after splash skip: {auth_visible}",
          await screenshot(page, "01-after-splash"))

        # Take a stab: try waiting for auto-complete (splash = 12s)
        if not auth_visible:
            # Wait for splash to finish naturally
            print("  Waiting for splash animation to auto-complete...", flush=True)
            try:
                await page.wait_for_function("() => document.getElementById('auth-screen') && !document.getElementById('auth-screen').classList.contains('hidden')", timeout=15000)
            except:
                try:
                    await page.wait_for_function("() => document.getElementById('home-screen') && !document.getElementById('home-screen').classList.contains('hidden')", timeout=5000)
                except:
                    pass
                pass
            await wait_stable(page, 0.5)

        auth_visible2 = await page.evaluate("() => document.getElementById('auth-screen') && !document.getElementById('auth-screen').classList.contains('hidden')")
        home_visible = await page.evaluate("() => document.getElementById('home-screen') && !document.getElementById('home-screen').classList.contains('hidden')")
        current_screen = "auth" if auth_visible2 else ("home" if home_visible else "splash/stuck")

        R("post-splash-state", "PASS" if current_screen != "splash/stuck" else "FAIL",
          f"Current screen: {current_screen}",
          await screenshot(page, f"01-state-{current_screen}"))

        # Report JS errors from loading
        for je in js_errors[:5]:
            BUG("MEDIUM", f"JS Error on load: {je['text']}", "homepage")
        js_errors.clear()

        # If stuck on splash, try clicking canvas multiple times
        if current_screen == "splash/stuck":
            canvas = await page.query_selector('#splash-canvas')
            if canvas:
                await canvas.click()
                await canvas.click()
                await canvas.click()
                await wait_stable(page, 1)
                auth_visible2 = await page.evaluate("() => document.getElementById('auth-screen') && !document.getElementById('auth-screen').classList.contains('hidden')")
                home_visible = await page.evaluate("() => document.getElementById('home-screen') && !document.getElementById('home-screen').classList.contains('hidden')")
                current_screen = "auth" if auth_visible2 else ("home" if home_visible else "stuck")
                if current_screen != "stuck":
                    R("splash-retry", "PASS", f"After retry click: {current_screen}")
                else:
                    BUG("HIGH", "Splash screen stuck - cannot transition to auth/home", "homepage")

        # ─────── 2. Auth Flow ───────
        print("\n=== 2. Auth 流程 ===", flush=True)
        test_user = f"tester_{datetime.now().strftime('%m%d%H%M')}"
        test_pass = "test1234"

        # If we're on home screen (already logged in somehow), go back to auth or do logout first
        if current_screen == "home":
            R("auth-skip", "INFO", "Already on home screen (cached login?), skipping to game test")
        elif current_screen == "auth" or current_screen == "login":
            # Fill register form
            reg_username = await page.query_selector('#register-username')
            reg_password = await page.query_selector('#register-password')
            reg_submit = await page.query_selector('#register-form button[type="submit"]')

            if reg_username and reg_password and reg_submit:
                await reg_username.fill(test_user)
                await reg_password.fill(test_pass)
                await wait_stable(page, 0.3)

                R("register-fill", "PASS", f"Filled user={test_user}, pass={test_pass}",
                  await screenshot(page, "02-register-filled"))

                # Click register tab first to ensure register form is shown
                register_tab = await page.query_selector('.auth-tab[data-tab="register"]')
                if register_tab:
                    await register_tab.click()
                    await wait_stable(page, 0.3)

                # Fill again after switching tab
                reg_username = await page.query_selector('#register-username')
                reg_password = await page.query_selector('#register-password')
                if reg_username and reg_password:
                    await reg_username.fill(test_user)
                    await reg_password.fill(test_pass)
                    await wait_stable(page, 0.2)

                await reg_submit.click()
                await wait_stable(page, 1.5)

                # Check result - should see home screen or error
                after_reg = await page.evaluate("""() => {
                    const home = document.getElementById('home-screen');
                    const auth = document.getElementById('auth-screen');
                    const err = document.getElementById('register-error');
                    return {
                        homeHidden: home ? home.classList.contains('hidden') : 'N/A',
                        authHidden: auth ? auth.classList.contains('hidden') : 'N/A',
                        error: err ? err.textContent : 'N/A'
                    };
                }""")
                R("register-result", "PASS" if after_reg.get("homeHidden") == False else "WARN",
                  f"Home hidden: {after_reg['homeHidden']}, Auth hidden: {after_reg['authHidden']}, Error: {after_reg['error']}",
                  await screenshot(page, "02-after-register"))

                if after_reg.get("homeHidden") == False:
                    current_screen = "home"
                elif "already" in after_reg.get("error", "").lower() or "exist" in after_reg.get("error", "").lower():
                    R("register-existing", "INFO", f"User may already exist: {after_reg['error']}")
                    # Try login instead
                    login_tab = await page.query_selector('.auth-tab[data-tab="login"]')
                    if login_tab:
                        await login_tab.click()
                        await wait_stable(page, 0.3)
                    login_user = await page.query_selector('#login-username')
                    login_pass = await page.query_selector('#login-password')
                    login_btn = await page.query_selector('#login-form button[type="submit"]')
                    if login_user and login_pass and login_btn:
                        await login_user.fill(test_user)
                        await login_pass.fill(test_pass)
                        await login_btn.click()
                        await wait_stable(page, 1.5)
                        after_login = await page.evaluate("() => document.getElementById('home-screen') && !document.getElementById('home-screen').classList.contains('hidden')")
                        R("login", "PASS" if after_login else "FAIL",
                          f"Login success: {after_login}",
                          await screenshot(page, "02-after-login"))
                        if after_login:
                            current_screen = "home"
            else:
                BUG("HIGH", f"Register form elements not found: username={bool(reg_username)}, password={bool(reg_password)}, submit={bool(reg_submit)}", "auth")
                R("register-form", "FAIL", "Register form elements missing",
                  await screenshot(page, "02-auth-form-missing"))

        # Test logout if logged in
        if current_screen == "home":
            logout_btn = await page.query_selector('#btn-logout')
            if logout_btn and await logout_btn.is_visible():
                await logout_btn.click()
                await wait_stable(page, 1)
                auth_after_logout = await page.evaluate("() => document.getElementById('auth-screen') && !document.getElementById('auth-screen').classList.contains('hidden')")
                R("logout", "PASS" if auth_after_logout else "WARN",
                  f"Auth screen after logout: {auth_after_logout}",
                  await screenshot(page, "02-after-logout"))
                if auth_after_logout:
                    current_screen = "auth"

        for je in js_errors[:5]:
            BUG("MEDIUM", f"JS Error in auth: {je['text']}", "auth")
        js_errors.clear()

        # ─────── 3. 打小人 Flow ───────
        print("\n=== 3. 打小人 Flow ===", flush=True)
        # Need to be on auth or home. If auth, login first.
        if current_screen == "auth":
            login_tab = await page.query_selector('.auth-tab[data-tab="login"]')
            if login_tab:
                await login_tab.click()
                await wait_stable(page, 0.3)
            login_user = await page.query_selector('#login-username')
            login_pass = await page.query_selector('#login-password')
            login_btn = await page.query_selector('#login-form button[type="submit"]')
            if login_user and login_pass and login_btn:
                await login_user.fill(test_user)
                await login_pass.fill(test_pass)
                await login_btn.click()
                await wait_stable(page, 1.5)
                if await page.evaluate("() => document.getElementById('home-screen') && !document.getElementById('home-screen').classList.contains('hidden')"):
                    current_screen = "home"

        if current_screen == "home":
            # Click "打小人" home card
            beat_card = await page.query_selector('.home-card[data-page="beat"]')
            if beat_card and await beat_card.is_visible():
                await beat_card.click()
                await wait_stable(page, 1.5)
                prescreen_visible = await page.evaluate("() => document.getElementById('game-prescreen-screen') && !document.getElementById('game-prescreen-screen').classList.contains('hidden')")
                R("prescreen", "PASS" if prescreen_visible else "FAIL",
                  f"Prescreen visible: {prescreen_visible}",
                  await screenshot(page, "03-prescreen"))

                if prescreen_visible:
                    # Check prescreen content
                    title = await page.evaluate("() => document.getElementById('prescreen-title')?.textContent || ''")
                    has_dolls = await page.evaluate("() => document.querySelectorAll('.doll-option').length > 0")
                    has_tools = await page.evaluate("() => document.querySelectorAll('.tool-option').length > 0")
                    has_diffs = await page.evaluate("() => document.querySelectorAll('.diff-btn').length > 0")
                    has_input = await page.evaluate("() => !!document.getElementById('doll-name-input')")
                    has_start = await page.evaluate("() => !!document.getElementById('btn-start-game')")

                    R("prescreen-content", "PASS" if (has_dolls and has_tools and has_diffs and has_start) else "WARN",
                      f"Title: {title}, Dolls: {has_dolls}, Tools: {has_tools}, Difficulty: {has_diffs}, Input: {has_input}, Start: {has_start}",
                      await screenshot(page, "03-prescreen-content"))

                    # Try selecting different options
                    doll_opts = await page.query_selector_all('.doll-option')
                    if len(doll_opts) > 1:
                        await doll_opts[2].click()  # Select 3rd doll
                        await wait_stable(page, 0.3)
                    tool_opts = await page.query_selector_all('.tool-option')
                    if len(tool_opts) > 1:
                        await tool_opts[1].click()  # Select 2nd tool
                        await wait_stable(page, 0.3)
                    diff_btns = await page.query_selector_all('.diff-btn')
                    if len(diff_btns) > 1:
                        await diff_btns[2].click()  # Select hard
                        await wait_stable(page, 0.3)

                    # Set custom name
                    name_input = await page.query_selector('#doll-name-input')
                    if name_input:
                        await name_input.fill('測試小人')
                        await wait_stable(page, 0.3)

                    R("prescreen-selections", "PASS", "Selected doll, tool, difficulty, name",
                      await screenshot(page, "03-prescreen-selected"))

                    # Start game
                    start_btn = await page.query_selector('#btn-start-game')
                    if start_btn and await start_btn.is_visible():
                        await start_btn.click()
                        await wait_stable(page, 2)

                        game_visible = await page.evaluate("() => document.getElementById('game-screen') && !document.getElementById('game-screen').classList.contains('hidden')")
                        R("game-start", "PASS" if game_visible else "FAIL",
                          f"Game screen visible: {game_visible}",
                          await screenshot(page, "03-game-screen"))

                        if game_visible:
                            # Try game interaction - click on canvas
                            game_canvas = await page.query_selector('#game-canvas')
                            if game_canvas:
                                box = await game_canvas.bounding_box()
                                if box:
                                    # Multiple clicks to simulate game play
                                    for _ in range(5):
                                        x = box['x'] + box['width'] * 0.3 + box['width'] * 0.4 * (await page.evaluate("Math.random()"))
                                        y = box['y'] + box['height'] * 0.3 + box['height'] * 0.4 * (await page.evaluate("Math.random()"))
                                        await page.mouse.click(x, y)
                                        await asyncio.sleep(0.2)

                                R("game-interaction", "INFO", "Game canvas clicked for interaction",
                                  await screenshot(page, "03-game-playing"))
                    else:
                        BUG("MEDIUM", "Start game button not found or not visible", "da_xiao_ren")
            else:
                BUG("HIGH", f"Beat card not found (card={bool(beat_card)}, visible={await beat_card.is_visible() if beat_card else 'N/A'})", "da_xiao_ren")
                R("home-card-missing", "FAIL", "打小人 home card not found/visible",
                  await screenshot(page, "03-home-missing"))
        else:
            BUG("HIGH", f"Cannot test 打小人 - not on home screen (current: {current_screen})", "da_xiao_ren")
            R("skip-beat", "SKIP", f"Not on home screen (current={current_screen})")

        for je in js_errors[:5]:
            BUG("MEDIUM", f"JS Error in 打小人: {je['text']}", "da_xiao_ren")
        js_errors.clear()

        # ─────── 4. 愛的抱抱 Flow ───────
        print("\n=== 4. 愛的抱抱 Flow ===", flush=True)
        # Navigate to home screen directly via JS (safe universal approach)
        await page.evaluate("() => { document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden')); document.getElementById('home-screen')?.classList.remove('hidden'); }")
        await wait_stable(page, 0.5)

        # Click hug card
        hug_card = await page.query_selector('.home-card[data-page="hug"]')
        if hug_card and await hug_card.is_visible():
            await hug_card.click()
            await wait_stable(page, 1.5)
            prescreen_hug = await page.evaluate("() => document.getElementById('game-prescreen-screen') && !document.getElementById('game-prescreen-screen').classList.contains('hidden')")
            R("hug-prescreen", "PASS" if prescreen_hug else "FAIL",
              f"Hug prescreen visible: {prescreen_hug}",
              await screenshot(page, "04-hug-prescreen"))

            if prescreen_hug:
                title = await page.evaluate("() => document.getElementById('prescreen-title')?.textContent || ''")
                has_hug_tools = await page.evaluate("() => document.querySelectorAll('.tool-option').length > 0")
                R("hug-prescreen-content", "INFO",
                  f"Title: {title}, Tools: {has_hug_tools}",
                  await screenshot(page, "04-hug-content"))

                # Select options
                hug_tools = await page.query_selector_all('.tool-option')
                if len(hug_tools) > 1:
                    await hug_tools[1].click()
                    await wait_stable(page, 0.3)

                name_input = await page.query_selector('#doll-name-input')
                if name_input:
                    await name_input.fill('測試寶貝')
                    await wait_stable(page, 0.3)

                start_btn = await page.query_selector('#btn-start-game')
                if start_btn:
                    await start_btn.click()
                    await wait_stable(page, 2)
                    hug_game = await page.evaluate("() => document.getElementById('game-screen') && !document.getElementById('game-screen').classList.contains('hidden')")
                    R("hug-game-start", "PASS" if hug_game else "FAIL",
                      f"Hug game visible: {hug_game}",
                      await screenshot(page, "04-hug-game"))
        else:
            R("hug-card", "WARN", "Hug card not found/visible",
              await screenshot(page, "04-hug-card-missing"))

        for je in js_errors[:5]:
            BUG("MEDIUM", f"JS Error in hug: {je['text']}", "hug_mode")
        js_errors.clear()

        # ─────── 5. 排行榜/記錄頁 ───────
        print("\n=== 5. 排行榜/記錄頁 ===", flush=True)
        await page.evaluate("() => { document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden')); document.getElementById('home-screen')?.classList.remove('hidden'); }")
        await wait_stable(page, 0.5)

        # Click history card
        history_card = await page.query_selector('.home-card[data-page="history"]')
        if history_card and await history_card.is_visible():
            await history_card.click()
            await wait_stable(page, 1.5)
            history_visible = await page.evaluate("() => document.getElementById('history-screen') && !document.getElementById('history-screen').classList.contains('hidden')")
            R("history-screen", "PASS" if history_visible else "WARN",
              f"History screen visible: {history_visible}",
              await screenshot(page, "05-history"))
            if history_visible:
                content = await page.evaluate("() => document.getElementById('leaderboard-list')?.innerHTML?.slice(0, 200) || 'no leaderboard-list'")
                R("history-content", "INFO", f"Leaderboard content: {content[:100]}")
        else:
            R("history-card", "WARN", "History card not found/visible",
              await screenshot(page, "05-history-missing"))

        # Try records page
        await page.evaluate("() => { document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden')); document.getElementById('home-screen')?.classList.remove('hidden'); }")
        await wait_stable(page, 0.5)
        records_card = await page.query_selector('.home-card[data-page="records"]')
        if records_card and await records_card.is_visible():
            await records_card.click()
            await wait_stable(page, 1.5)
            records_visible = await page.evaluate("() => document.getElementById('records-screen') && !document.getElementById('records-screen').classList.contains('hidden')")
            R("records-screen", "INFO" if records_visible else "WARN",
              f"Records screen visible: {records_visible}",
              await screenshot(page, "05-records"))
        else:
            R("records-card", "WARN", "Records card not found/visible")

        # ─────── 6. 設定頁 ───────
        print("\n=== 6. 設定頁 ===", flush=True)
        await page.evaluate("() => { document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden')); document.getElementById('home-screen')?.classList.remove('hidden'); }")
        await wait_stable(page, 0.5)

        settings_card = await page.query_selector('.home-card[data-page="settings"]')
        if settings_card and await settings_card.is_visible():
            await settings_card.click()
            await wait_stable(page, 1.5)
            settings_visible = await page.evaluate("() => document.getElementById('settings-screen') && !document.getElementById('settings-screen').classList.contains('hidden')")
            R("settings-screen", "PASS" if settings_visible else "FAIL",
              f"Settings visible: {settings_visible}",
              await screenshot(page, "06-settings"))

            if settings_visible:
                # Use JS to toggle checkboxes (inputs may be visually hidden, replaced by styled labels)
                toggle_result = await page.evaluate("""() => {
                    const ids = ['setting-sound', 'setting-music', 'setting-vibrate'];
                    const results = [];
                    ids.forEach(id => {
                        const cb = document.getElementById(id);
                        if (cb) {
                            const before = cb.checked;
                            cb.click();
                            // Also try clicking associated label
                            const label = document.querySelector('label[for="' + id + '"]');
                            if (label) label.click();
                            const after = cb.checked;
                            results.push({id, before, after, changed: before !== after});
                        } else {
                            results.push({id, found: false});
                        }
                    });
                    return results;
                }""")

                toggles_found = sum(1 for t in toggle_result if t.get('found', True))
                toggles_clicked = sum(1 for t in toggle_result if t.get('changed', False))
                for t in toggle_result:
                    if t.get('found', True):
                        R(f"toggle-{t['id']}", "PASS" if t.get('changed') else "WARN",
                          f"before={t.get('before','?')} after={t.get('after','?')}")
                    else:
                        R(f"toggle-{t['id']}", "FAIL", f"Checkbox not found in DOM")

                R("settings-toggles", "PASS" if toggles_clicked > 0 else "WARN",
                  f"Toggles found: {toggles_found}, toggles changed: {toggles_clicked}",
                  await screenshot(page, "06-toggled"))
        else:
            R("settings-card", "WARN", "Settings card not found/visible",
              await screenshot(page, "06-settings-missing"))

        # Collect remaining JS errors
        for je in js_errors:
            BUG("MEDIUM", f"JS Error: {je['text']}", "general")
        js_errors.clear()

        # ─────── 顯示 Console Output ───────
        console_logs = await page.evaluate("""() => {
            const logs = [];
            const origLog = console.log;
            return logs.slice(0, 30);
        }""")

        await browser.close()

    # ─────── 測試報告 ───────
    print("\n" + "=" * 60, flush=True)
    print("📋 測試報告", flush=True)
    print("=" * 60, flush=True)

    total = len(report["tests"])
    passed = sum(1 for t in report["tests"] if t["status"] == "PASS")
    failed = sum(1 for t in report["tests"] if t["status"] == "FAIL")
    warned = sum(1 for t in report["tests"] if t["status"] in ("WARN", "PARTIAL"))
    skipped = sum(1 for t in report["tests"] if t["status"] in ("SKIP", "INFO"))

    print(f"Total: {total} | ✅ PASS: {passed} | ⚠️ WARN: {warned} | ❌ FAIL: {failed} | ℹ️ INFO/SKIP: {skipped}", flush=True)

    if report["bugs"]:
        print(f"\n🐛 Bugs ({len(report['bugs'])}):", flush=True)
        for b in report["bugs"]:
            print(f"  [{b['severity']}] {b['description'][:150]}", flush=True)

    print(f"\n📁 截圖: {SCREENSHOT_DIR}", flush=True)
    report_path = os.path.join(SCREENSHOT_DIR, "test_report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print(f"📄 報告: {report_path}", flush=True)

    return report

if __name__ == "__main__":
    asyncio.run(main())
