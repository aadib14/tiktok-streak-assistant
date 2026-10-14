
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

  console.log("\n=== INFORMASI HALAMAN TIKTOK ===");
  console.log("URL:", page.url());
  console.log("Judul:", await page.title());

  const bodyText = await page.locator("body").innerText();

  console.log("\n=== POTONGAN TEKS HALAMAN ===");
  console.log(bodyText.slice(0, 1500));

  console.log("\nPemeriksaan selesai.");

  await context.close();
}

main().catch((error) => {
  console.error("Terjadi kesalahan:", error.message);
  process.exitCode = 1;
});
