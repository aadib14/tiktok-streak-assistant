
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

  const targetName = "ines";

  const nickname = page.locator("span").filter({
    hasText: new RegExp(`^${targetName}$`, "i"),
  });

  const count = await nickname.count();
  console.log(`Elemen dengan nama "${targetName}": ${count}`);

  if (count === 0) {
    console.log("Nama tidak ditemukan. Tidak ada chat yang dibuka.");
    await context.close();
    return;
  }

  await nickname.first().click();
  await page.waitForTimeout(2000);

  console.log("\n=== HASIL MEMBUKA CHAT ===");
  console.log("URL:", page.url());
  console.log("\n=== TEKS CHAT ===");
  console.log((await page.locator("body").innerText()).slice(-5000));

  console.log("\nPemeriksaan selesai. Tidak ada pesan yang dikirim.");
  await context.close();
}

main().catch((error) => {
  console.error("Terjadi kesalahan:", error.message);
  process.exitCode = 1;
});
