
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

  console.log("TikTok Web sudah terbuka.");
  console.log("Silakan periksa status login di browser.");
  console.log("Tutup browser secara manual jika sudah selesai.");

  await new Promise(() => {});
}

main().catch((error) => {
  console.error("Terjadi kesalahan:", error.message);
  process.exitCode = 1;
});
