
const { chromium } = require("playwright");

async function main() {
  const context = await chromium.launchPersistentContext("./.profile", {
    headless: false,
    viewport: null,
  });

  const page = context.pages()[0];

  await page.goto("https://www.tiktok.com/", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  console.log("Browser siap.");
  console.log("Klik Messages secara manual sampai inbox terbuka.");
  console.log("Setelah inbox terbuka, tekan ENTER di terminal ini.");

  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  await new Promise((resolve) => rl.question("", resolve));
  rl.close();

  console.log("\n=== URL HALAMAN ===");
  console.log(page.url());

  console.log("\n=== TEKS HALAMAN ===");
  console.log((await page.locator("body").innerText()).slice(0, 8000));

  await context.close();
}

main().catch((error) => {
  console.error("Terjadi kesalahan:", error.message);
  process.exitCode = 1;
});
