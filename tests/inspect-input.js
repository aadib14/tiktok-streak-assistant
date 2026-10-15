
const { chromium } = require("playwright");

async function main() {
  const context = await chromium.launchPersistentContext("./.profile", {
    headless: false,
    viewport: null,
  });

  const page = context.pages()[0];

  await page.goto("https://www.tiktok.com/messages", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  await page.waitForTimeout(2000);

  const result = await page.evaluate(() => {
    const elements = [
      ...document.querySelectorAll(
        'input, textarea, [contenteditable="true"], [role="textbox"]'
      ),
    ];

    return elements.map((el, index) => ({
      index,
      tag: el.tagName,
      placeholder: el.getAttribute("placeholder"),
      ariaLabel: el.getAttribute("aria-label"),
      role: el.getAttribute("role"),
      contentEditable: el.getAttribute("contenteditable"),
      visible: el.getClientRects().length > 0,
    }));
  });

  console.log("=== ELEMEN INPUT ===");
  console.log(JSON.stringify(result, null, 2));

  await context.close();
}

main().catch((error) => {
  console.error("Terjadi kesalahan:", error.message);
  process.exitCode = 1;
});
