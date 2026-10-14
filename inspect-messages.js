
const { chromium } = require("playwright");

async function main() {
  const context = await chromium.launchPersistentContext(
    "./.profile",
    {
      headless: false,
      viewport: null,
    }
  );

  const page = context.pages()[0];

  await page.goto("https://www.tiktok.com/", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  await page.waitForTimeout(3000);

  const result = await page.evaluate(() => {
    return [...document.querySelectorAll("a, button, [role='button']")]
      .filter((element) =>
        element.innerText?.trim().includes("Messages")
      )
      .map((element) => ({
        tag: element.tagName,
        text: element.innerText.trim().slice(0, 100),
        role: element.getAttribute("role"),
        ariaLabel: element.getAttribute("aria-label"),
        href: element.getAttribute("href"),
      }));
  });

  console.log("Elemen navigasi yang cocok:");

  console.log(JSON.stringify(result, null, 2));

  await context.close();
}

main().catch((error) => {
  console.error("Terjadi kesalahan:", error.message);
  process.exitCode = 1;
});
