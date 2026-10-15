
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

  console.log("Buka chat teman secara manual di browser.");
  console.log("Setelah chat terbuka, tekan ENTER di terminal.");

  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  await new Promise((resolve) => rl.question("", resolve));
  rl.close();

  const result = await page.evaluate(() => {
    return [...document.querySelectorAll("body *")]
      .filter((el) => {
        const text = (el.innerText || el.textContent || "").trim();
        return (
          text === "Send a message..." ||
          text === "Send a message"
        );
      })
      .slice(0, 10)
      .map((el) => ({
        tag: el.tagName,
        role: el.getAttribute("role"),
        placeholder: el.getAttribute("placeholder"),
        ariaLabel: el.getAttribute("aria-label"),
        contentEditable: el.getAttribute("contenteditable"),
        className:
          typeof el.className === "string"
            ? el.className.slice(0, 160)
            : "",
        parentTag: el.parentElement?.tagName,
        parentRole: el.parentElement?.getAttribute("role"),
        parentClass:
          typeof el.parentElement?.className === "string"
            ? el.parentElement.className.slice(0, 160)
            : "",
      }));
  });

  console.log("\n=== HASIL PEMERIKSAAN ===");
  console.log(JSON.stringify(result, null, 2));

  await context.close();
}

main().catch((error) => {
  console.error("Terjadi kesalahan:", error.message);
  process.exitCode = 1;
});
