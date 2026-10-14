
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

  await page.waitForTimeout(3000);

  const result = await page.evaluate(() => {
    const names = ["ines", "ziziii", "shopdress"];

    return names.map((name) => {
      const elements = [...document.querySelectorAll("body *")];
      const matches = elements.filter(
        (el) => el.children.length === 0 &&
          el.textContent.trim() === name
      );

      return {
        name,
        matches: matches.slice(0, 3).map((el) => {
          let parent = el;
          const ancestors = [];

          for (let i = 0; i < 5 && parent; i++, parent = parent.parentElement) {
            ancestors.push({
              tag: parent.tagName,
              role: parent.getAttribute("role"),
              className:
                typeof parent.className === "string"
                  ? parent.className.slice(0, 120)
                  : "",
              text: (parent.innerText || "").slice(0, 180),
            });
          }

          return ancestors;
        }),
      };
    });
  });

  console.log(JSON.stringify(result, null, 2));
  await context.close();
}

main().catch((error) => {
  console.error("Terjadi kesalahan:", error.message);
  process.exitCode = 1;
});
