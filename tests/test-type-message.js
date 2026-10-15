
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
  console.log("Klik area pesan, lalu tekan ENTER di terminal.");

  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  await new Promise((resolve) => rl.question("", resolve));
  rl.close();

  const editor = page.getByRole("textbox", {
    name: "Send a message...",
  });

  console.log("Jumlah editor:", await editor.count());

  if (await editor.count() !== 1) {
    console.log("Editor tidak ditemukan secara unik. Tes dihentikan.");
    await context.close();
    return;
  }

  await editor.fill("TEST BOT - tidak dikirim");

  console.log("Teks di editor:", await editor.innerText());
  console.log("Pesan hanya berada di kolom editor, belum dikirim.");

  await page.waitForTimeout(2000);
  await editor.fill("");

  console.log("Editor dikosongkan kembali.");

  await context.close();
}

main().catch((error) => {
  console.error("Terjadi kesalahan:", error.message);
  process.exitCode = 1;
});
