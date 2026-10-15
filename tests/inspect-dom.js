
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
    return [...document.querySelectorAll("body *")]
      .filter((element) => {
        const text = element.textContent?.trim();
        return text === "Messages";
      })
      .slice(0, 10)
      .map((element) => ({
        tag: element.tagName,
        text: element.textContent.trim(),
        className:
          typeof element.className === "string"
            ? element.className
            : "",
        role: element.getAttribute("role"),
        ariaLabel: element.getAttribute("aria-label"),
      }));
  });

  console.log("Elemen yang teksnya tepat Messages:");
  console.log(JSON.stringify(result, null, 2));

  await context.close();
}

main().catch((error) => {
  console.error("Terjadi kesalahan:", error.message);
  process.exitCode = 1;
});
