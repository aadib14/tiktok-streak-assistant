
const { chromium } = require("playwright");

async function main() {
  console.log("Menjalankan Chromium...");

  const browser = await chromium.launch({
    headless: false,
  });

  const page = await browser.newPage();

  console.log("Membuka TikTok Web...");
  await page.goto("https://www.tiktok.com/", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  console.log("Judul halaman:", await page.title());
  console.log("URL halaman:", page.url());

  console.log("Tes selesai. Browser akan tetap terbuka.");
  console.log("Tutup browser secara manual setelah selesai.");

  await new Promise(() => {});
}

main().catch((error) => {
  console.error("Terjadi kesalahan:", error.message);
  process.exitCode = 1;
});
