import time
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Listen to console events
        def handle_console(msg):
            print(f"CONSOLE {msg.type}: {msg.text}")
            
        page.on("console", handle_console)
        page.on("pageerror", lambda err: print(f"PAGE ERROR: {err.message}"))

        try:
            print("Connecting to http://localhost:3001 ...")
            page.goto('http://localhost:3001')
            page.wait_for_load_state('domcontentloaded')
            print("Loaded DOM. Waiting 3 seconds for Phaser setup...")
            page.wait_for_timeout(3000)
            
            # Press Enter to start the game
            print("Pressing Enter to start game...")
            page.keyboard.press("Enter")
            page.wait_for_timeout(1000)
            
            # Press Enter/1/START1 to get past tutorial?
            # Let's press Enter again to skip tutorial if we are in TUTOR state
            print("Pressing Enter again to start actual gameplay...")
            page.keyboard.press("Enter")
            page.wait_for_timeout(1500)
            
            # Move around and slash
            print("Pressing w, a, s, d (movement) and u (slash)...")
            page.keyboard.down("w")
            page.wait_for_timeout(300)
            page.keyboard.up("w")
            
            page.keyboard.down("a")
            page.wait_for_timeout(300)
            page.keyboard.up("a")
            
            # Perform a slash
            print("Slashing (u)...")
            page.keyboard.press("u") # Slash
            page.wait_for_timeout(1000)
            
            # Take a screenshot to verify state
            page.screenshot(path='.agents/game_screenshot.png')
            print("Screenshot saved to .agents/game_screenshot.png")
            
        except Exception as e:
            print(f"Exception occurred: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
