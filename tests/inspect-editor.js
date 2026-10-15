
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

  console.log("Buka chat teman secara manual.");
  console.log("Klik area Send a message..., lalu tekan ENTER di terminal.");

  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  await new Promise((resolve) => rl.question("", resolve));
  rl.close();

  const result = await page.evaluate(() => {
    const editor = document.querySelector(".DraftEditor-root");

    if (!editor) {
      return { error: "DraftEditor-root tidak ditemukan" };
    }

    return {
      editorHTML: editor.outerHTML.slice(0, 3000),
      descendants: [...editor.querySelectorAll("*")].slice(0, 15).map((el) => ({
        tag: el.tagName,
        role: el.getAttribute("role"),
        ariaLabel: el.getAttribute("aria-label"),
        contentEditable: el.getAttribute("contenteditable"),
        dataText: el.getAttribute("data-text"),
        className:
          typeof el.className === "string"
            ? el.className.slice(0, 120)
            : "",
      })),
    };
  });

  console.log("\n=== STRUKTUR EDITOR ===");
  console.log(JSON.stringify(result, null, 2));

  await context.close();
}

main().catch((error) => {
  console.error("Terjadi kesalahan:", error.message);
  process.exitCode = 1;
});
