
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

  const messages = page.getByText("Messages", {
    exact: true,
  });

  const count = await messages.count();

  console.log("Jumlah elemen Messages:", count);

  if (count > 0) {
    console.log(
      "Apakah Messages terlihat:",
      await messages.first().isVisible()
    );
  } else {
    console.log(
      "Elemen Messages tidak ditemukan dengan pencarian teks."
    );
  }

  await context.close();
}

main().catch((error) => {
  console.error("Terjadi kesalahan:", error.message);
  process.exitCode = 1;
});
