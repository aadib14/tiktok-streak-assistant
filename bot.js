const { chromium } = require("playwright");

const fs = require("node:fs");
const readline = require("node:readline");

const config = require("./config.json");

function validateConfig() {
  const errors = [];

  if (typeof config.enabled !== "boolean") {
    errors.push('"enabled" harus bernilai true atau false.');
  }

  if (
    typeof config.message !== "string" ||
    config.message.trim() === ""
  ) {
    errors.push('"message" tidak boleh kosong.');
  }

  if (!Array.isArray(config.friends)) {
    errors.push('"friends" harus berupa daftar nama.');
  } else {
    if (
      config.friends.some(
        (friend) =>
          typeof friend !== "string" ||
          friend.trim() === ""
      )
    ) {
      errors.push("Daftar teman mengandung nama yang tidak valid.");
    }

    const names = config.friends.map((friend) =>
      typeof friend === "string"
        ? friend.trim().toLowerCase()
        : ""
    );

    if (new Set(names).size !== names.length) {
      errors.push("Daftar teman mengandung nama duplikat.");
    }
  }

  if (errors.length > 0) {
    console.error("\nKonfigurasi tidak valid:");

    for (const error of errors) {
      console.error(`- ${error}`);
    }

    process.exit(1);
  }

  console.log("Konfigurasi berhasil diperiksa.");
}

validateConfig();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function saveConfig() {
  fs.writeFileSync(
    "./config.json",
    JSON.stringify(config, null, 2) + "\n",
    "utf8"
  );
}

async function prepareMessage(friend) {
  const message =
    `Menyiapkan pesan untuk ${friend}: ${config.message}`;

  console.log(message);

  const logEntry =
    `${new Date().toLocaleString("id-ID")} | ${message}\n`;

  fs.appendFileSync("./activity.log", logEntry);
}

async function runSimulation() {
  if (!config.enabled) {
    console.log("\nBot sedang dinonaktifkan.");
    return;
  }

  console.log("\nMemulai simulasi...\n");

  for (const friend of config.friends) {
    await prepareMessage(friend);
    console.log("Menunggu 2 detik...\n");
    await wait(2000);
  }

  console.log("Simulasi selesai!");
}

function showFriends() {
  console.log("\nDaftar teman:");

  if (config.friends.length === 0) {
    console.log("Belum ada teman yang ditambahkan.");
    return;
  }

  config.friends.forEach((friend, index) => {
    console.log(`${index + 1}. ${friend}`);
  });
}

async function addFriend() {
  const name = (await ask("\nMasukkan nama teman baru: ")).trim();

  if (!name) {
    console.log("Nama tidak boleh kosong.");
    return;
  }

  const alreadyExists = config.friends.some(
    (friend) => friend.toLowerCase() === name.toLowerCase()
  );

  if (alreadyExists) {
    console.log("Nama teman tersebut sudah ada.");
    return;
  }

  config.friends.push(name);
  saveConfig();

  console.log(`Teman "${name}" berhasil ditambahkan dan disimpan.`);
}


async function removeFriend() {
  showFriends();

  if (config.friends.length === 0) return;

  const answer = await ask(
    "\nMasukkan nomor teman yang ingin dihapus: "
  );

  const index = Number(answer) - 1;

  if (
    !Number.isInteger(Number(answer)) ||
    answer.trim() === "" ||
    index < 0 ||
    index >= config.friends.length
  ) {
    console.log("Nomor teman tidak valid.");
    return;
  }

  const removed = config.friends.splice(index, 1)[0];

  saveConfig();

  console.log(`Teman "${removed}" berhasil dihapus.`);
}

async function changeMessage() {
  console.log(`\nPesan saat ini: ${config.message}`);

  const newMessage = (
    await ask("Masukkan pesan baru: ")
  ).trim();

  if (!newMessage) {
    console.log("Pesan tidak boleh kosong.");
    return;
  }

  config.message = newMessage;
  saveConfig();

  console.log("Pesan berhasil diperbarui dan disimpan.");
}

async function scanInbox() {
  if (!config.enabled) {
    console.log("\nBot sedang dinonaktifkan.");
    return;
  }

  let context;

  try {
    console.log("\nMembuka inbox TikTok...");

    context = await chromium.launchPersistentContext("./.profile", {
      headless: false,
      viewport: null,
    });

    const page = context.pages()[0];

    await page.goto("https://www.tiktok.com/messages", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    await page.waitForTimeout(3000);

    const results = await page.evaluate((names) => {
      const elements = [...document.querySelectorAll("span")];

      return names.map((name) => {
        const matches = elements.filter(
          (el) =>
            el.textContent.trim().toLowerCase() ===
            name.trim().toLowerCase()
        );

        const rows = matches.map((el) => {
          const row = el.closest('[class*="DivItemWrapper"]');

          return {
            found: Boolean(row),
            text: row ? row.innerText.trim().slice(0, 250) : "",
          };
        });

        return { name, count: matches.length, rows };
      });
    }, config.friends);

    console.log("\n=== HASIL PEMERIKSAAN INBOX ===");

    for (const result of results) {
      if (result.count === 0) {
        console.log(`❓ ${result.name}: belum ditemukan`);
      } else if (result.count > 1) {
        console.log(`⚠️ ${result.name}: ditemukan ${result.count} elemen`);
      } else if (!result.rows[0].found) {
        console.log(`⚠️ ${result.name}: baris chat belum dikenali`);
      } else {
        console.log(`✅ ${result.name}: ditemukan di inbox`);
      }
    }

    console.log("\nPemeriksaan selesai. Tidak ada pesan yang dikirim.");
  } catch (error) {
    console.error("\nPemeriksaan inbox gagal:", error.message);
  } finally {
    if (context) {
      await context.close();
    }
  }
}

async function openFriendChat(friendName) {
  let context;

  try {
    context = await chromium.launchPersistentContext("./.profile", {
      headless: false,
      viewport: null,
    });

    const page = context.pages()[0];

    await page.goto("https://www.tiktok.com/messages", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    await page.waitForTimeout(3000);

    const escapedName = friendName.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    const nickname = page.locator("span").filter({
      hasText: new RegExp(`^${escapedName}$`, "i"),
    });

    await nickname.first().waitFor({
      state: "visible",
      timeout: 10000,
    });

    const count = await nickname.count();

    if (count !== 1) {
      console.log(
        `Chat "${friendName}" tidak ditemukan secara unik. Jumlah elemen: ${count}`
      );
      return;
    }

    await nickname.click();
    await page.waitForTimeout(2000);


    const editor = page.locator(
      '[data-e2e="dm-new-input-editor"] [contenteditable="true"]'
    );

    try {
      await editor.first().waitFor({
        state: "visible",
        timeout: 15000,
      });
    } catch {
      console.log(`Editor chat "${friendName}" tidak ditemukan.`);
      console.log("URL saat ini:", page.url());
      console.log(
        "Jumlah editor yang ditemukan:",
        await editor.count()
      );
      return;
    }

    
      console.log(`Berhasil membuka chat "${friendName}".`);
      console.log("Editor pesan terdeteksi.");

      // Tes mengetik tanpa mengirim pesan.
      await editor.fill(config.message);

      const sendButton = page.locator(
        '[data-e2e="dm-new-send-btn"]'
      );

      console.log("Jumlah tombol Send setelah mengetik:", await sendButton.count());
      console.log(
        "Tombol Send terlihat:",
        await sendButton.isVisible().catch(() => false)
      );

    const typedMessageAfterTyping = (await editor.innerText()).trim();

    console.log("Pesan konfigurasi:", JSON.stringify(config.message.trim()));
    console.log("Isi editor terbaca:", JSON.stringify(typedMessageAfterTyping));

    if (typedMessageAfterTyping === config.message.trim()) {
      console.log("Pesan cocok dengan konfigurasi.");
      console.log("Pesan BELUM dikirim.");
    } else {
      console.log("Isi kolom belum cocok dengan pesan konfigurasi.");
}

      // Kosongkan kolom agar tidak meninggalkan teks tes.
      await editor.fill("");


          const typedMessage = await editor.innerText();

          if (typedMessage.trim() === config.message.trim()) {
            console.log("Pesan berhasil dimasukkan ke kolom chat.");
            console.log("Pesan BELUM dikirim.");
          }

          // Kosongkan kolom agar tidak meninggalkan teks tes.
          await editor.fill("");

  } catch (error) {
    console.error("Gagal membuka chat:", error.message);
  } finally {
    if (context) {
      await context.close();
    }
  }
}


async function processAllFriends(scheduled = false) {
  if (!config.enabled) {
    console.log("\nBot sedang dinonaktifkan.");
    return;
  }

  if (!config.friends.length) {
    console.log("\nDaftar teman masih kosong.");
    return;
  }

  // Hindari memproses nama yang sama dua kali dalam satu sesi.
  const friends = [...new Set(
    config.friends.map((name) => name.trim()).filter(Boolean)
  )];

  console.log(`\nAkan memproses ${friends.length} teman.`);
  console.log("Pesan:", config.message);

if (!scheduled) {
  const confirm = (
    await ask("\nMulai pengiriman otomatis? (y/n): ")
  ).trim().toLowerCase();

  if (confirm !== "y") {
    console.log("Proses dibatalkan.");
    return;
  }
} else {
  console.log("Mode terjadwal aktif. Memulai pengiriman otomatis.");
}

  let context;

  try {
    context = await chromium.launchPersistentContext("./.profile", {
      headless: false,
      viewport: null,
    });

    const page = context.pages()[0];
    for (const friend of friends) {
     console.log(`\nMemproses: ${friend}`);
     await prepareMessage(friend);

      try {
        await page.goto("https://www.tiktok.com/messages", {
          waitUntil: "domcontentloaded",
          timeout: 60000,
        });

        await page.waitForTimeout(2500);

        const escapedName = friend.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );

        const nickname = page.locator("span").filter({
          hasText: new RegExp(`^${escapedName}$`, "i"),
        });

        await nickname.first().waitFor({
          state: "visible",
          timeout: 10000,
        });

        const count = await nickname.count();

        if (count !== 1) {
          console.log(
            `Dilewati: nama tidak ditemukan secara unik (${count} elemen).`
          );
          continue;
        }

        await nickname.click();
        await page.waitForTimeout(1500);

        const editor = page.locator(
          '[data-e2e="dm-new-input-editor"] [contenteditable="true"]'
        );

        await editor.first().waitFor({
          state: "visible",
          timeout: 15000,
        });

        if (await editor.count() !== 1) {
          console.log("Dilewati: kolom pesan tidak ditemukan secara unik.");
          continue;
        }

        await editor.fill(config.message);

        const typedMessage = (await editor.innerText()).trim();

        if (typedMessage !== config.message.trim()) {
          await editor.fill("");
          console.log("Dilewati: isi pesan tidak cocok.");
          continue;
        }

        // Cari tombol setelah teks dimasukkan.
        const sendButton = page.locator(
          '[data-e2e="dm-new-send-btn"]'
        );

        await sendButton.waitFor({
          state: "visible",
          timeout: 10000,
        });

        // Validasi ulang tepat sebelum mengirim.
        const currentMessage = (await editor.innerText()).trim();

        if (currentMessage !== config.message.trim()) {
          await editor.fill("");
          console.log("Dilewati: isi pesan berubah.");
          continue;
        }

        await sendButton.click();
        await page.waitForTimeout(1500);

        // Indikator awal bahwa kolom sudah kosong setelah pengiriman.
        const remainingText = (await editor.innerText()).trim();

          if (remainingText === "") {
            const status =
              `Indikasi pengiriman berhasil: ${friend}`;

            console.log(status);

            fs.appendFileSync(
              "./activity.log",
              `${new Date().toLocaleString("id-ID")} | ${status}\n`,
              "utf8"
            );
          } else {
          const status =
            `Status pengiriman belum bisa dipastikan: ${friend}`;

          console.log(status);

          fs.appendFileSync(
            "./activity.log",
            `${new Date().toLocaleString("id-ID")} | ${status}\n`,
            "utf8"
          );
        }
      } catch (error) {
        console.log(`Gagal memproses ${friend}: ${error.message}`);
      }

      // Jeda antarchat.
      await wait(2500);
    }

    console.log("\nSelesai memproses daftar teman.");
  } catch (error) {
    console.error("\nProses gagal:", error.message);
  } finally {
    if (context) {
      await context.close();
    }
  }
}

async function main() {
  let running = true;

  while (running) {
    console.log("\n=== TikTok Streak Assistant ===\n");
    console.log("1. Jalankan simulasi");
    console.log("2. Lihat daftar teman");
    console.log("3. Tambahkan teman");
    console.log("4. Hapus teman");
    console.log("5. Ubah pesan");
    console.log("6. Periksa teman di inbox TikTok");
    console.log("7. Uji buka chat teman");
    console.log("8. Keluar");
    console.log("9. Proses semua teman");

    const choice = await ask("\nPilih menu (1-9): ");

    switch (choice.trim()) {
      case "1":
        await runSimulation();
        break;
      case "2":
        showFriends();
        break;
      case "3":
        await addFriend();
        break;
      case "4":
        await removeFriend();
        break;
      case "5":
        await changeMessage();
        break;
      case "6":
        await scanInbox();
      break;
      case "7": {
        const friendName = (
        await ask("\nMasukkan nama teman yang ingin dibuka: ")
        ).trim();

        if (!friendName) {
         console.log("Nama tidak boleh kosong.");
         break;
        }

        await openFriendChat(friendName);
        break;
      }
      case "8":
        running = false;
        console.log("\nProgram ditutup. Sampai jumpa!");
      break;
      case "9":
        await processAllFriends();
        break;
      default:
        console.log("\nPilihan tidak valid. Masukkan 1, 2, 3, atau 4.");
    }
  }

  rl.close();
}


async function startApp() {
  const scheduled = process.argv.includes("--scheduled");

  try {
    if (scheduled) {
      console.log("=== TikTok Streak Assistant: Mode Terjadwal ===");
      await processAllFriends(true);
    } else {
      await main();
    }
  } catch (error) {
    console.error("Program gagal:", error.message);
    process.exitCode = 1;
  } finally {
    if (scheduled) {
      rl.close();
    }
  }
}

startApp();
