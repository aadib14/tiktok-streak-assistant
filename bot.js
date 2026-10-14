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

      console.log("URL saat ini:", page.url());
      console.log("Judul halaman:", await page.title());

      const bodyText = await page.locator("body").innerText();
      console.log("Nama ines muncul di halaman:", bodyText.toLowerCase().includes(friendName.toLowerCase()));

      const escapedName = friendName.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    const nickname = page.locator("span").filter({
      hasText: new RegExp(`^${escapedName}$`, "i"),
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

    const editor = page.getByRole("textbox", {
      name: "Send a message...",
    });

    await editor.fill("TEST BOT - tidak dikirim");

    const editorInfo = await editor.evaluate((el) => {
      const parent = el.closest('[class*="DivChatBottom"]');

      return {
        editorTag: el.tagName,
        editorRole: el.getAttribute("role"),
        editorLabel: el.getAttribute("aria-label"),
        editorClass: el.className,
        parentHTML: parent ? parent.outerHTML.slice(0, 12000) : "Area chat tidak ditemukan",
      };
    });

    console.log("\n=== STRUKTUR AREA PESAN ===");
    console.log(JSON.stringify(editorInfo, null, 2));

    // Kosongkan kembali; jangan klik tombol apa pun.
    await editor.fill("");

    if (await editor.count() === 1 && await editor.isVisible()) {
      console.log(`Berhasil membuka chat "${friendName}".`);
      console.log("Editor pesan terdeteksi.");

      if (await editor.count() === 1 && await editor.isVisible()) {
        console.log(`Berhasil membuka chat "${friendName}".`);
        console.log("Editor pesan terdeteksi.");

        const sendButton = page.locator('[data-e2e="dm-new-send-btn"]');
        console.log("Jumlah tombol Send:", await sendButton.count());
        console.log("Tombol terlihat:", await sendButton.isVisible());

        // kode lama di bawahnya tetap biarkan
      const buttons = await page.locator("button").evaluateAll((elements) =>
        elements.map((button, index) => ({
          index,
          text: button.innerText.trim(),
          ariaLabel: button.getAttribute("aria-label"),
          dataE2e: button.getAttribute("data-e2e"),
          disabled: button.disabled,
        }))
      );

      console.log("\n=== PEMERIKSAAN TOMBOL ===");

      for (const button of buttons) {
        console.log(JSON.stringify(button));
      }

      console.log("\nPemeriksaan selesai. Tidak ada tombol yang diklik.");


      // Isi kolom pesan, tetapi jangan kirim.
      await editor.fill(config.message);

     const typedMessage = await editor.innerText();

   
if (typedMessage.trim() === config.message.trim()) {
  console.log("Pesan berhasil dimasukkan ke kolom chat.");
  console.log(`Isi pesan: ${typedMessage}`);
  console.log("Pesan BELUM dikirim.");
} else {
  console.log("Isi kolom belum cocok dengan pesan konfigurasi.");
}

// Kosongkan kembali kolom setelah tes.
await editor.fill("");
console.log("Kolom pesan sudah dikosongkan kembali.");
} else {
  console.log("Chat diklik, tetapi editor belum terverifikasi.");
}
  } catch (error) {
    console.error("Gagal membuka chat:", error.message);
  } finally {
    if (context) {
      await context.close();
    }
  }
}

async function processAllFriends() {
  if (!config.enabled) {
    console.log("\nBot sedang dinonaktifkan.");
    return;
  }

  if (config.friends.length === 0) {
    console.log("\nDaftar teman masih kosong.");
    return;
  }

  console.log(`\nAkan memproses ${config.friends.length} teman.`);
  console.log("Pesan:", config.message);

  const confirm = (
    await ask("\nMulai proses? Ketik y untuk lanjut: ")
  ).trim().toLowerCase();

  if (confirm !== "y") {
    console.log("Proses dibatalkan.");
    return;
  }

  let context;

  try {
    context = await chromium.launchPersistentContext("./.profile", {
      headless: false,
      viewport: null,
    });

    const page = context.pages()[0];

    for (const friend of config.friends) {
      console.log(`\nMemproses: ${friend}`);

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

        // Tunggu hingga nama teman muncul, maksimal 10 detik.
        try {
          await nickname.first().waitFor({
            state: "visible",
            timeout: 10000,
          });
        } catch {
          console.log("Nama teman belum muncul setelah menunggu 10 detik.");
        }

        const count = await nickname.count();   

        if (count !== 1) {
          console.log(
            `Dilewati: nama tidak ditemukan secara unik (${count} elemen).`
          );
          continue;
        }

        await nickname.click();
        await page.waitForTimeout(1500);

        const editor = page.getByRole("textbox", {
          name: "Send a message...",
        });

        if (
          await editor.count() !== 1 ||
          !(await editor.isVisible())
        ) {
          console.log("Dilewati: kolom pesan tidak ditemukan.");
          continue;
        }

        await editor.fill(config.message);

        const typedMessage = (await editor.innerText()).trim();

        if (typedMessage !== config.message.trim()) {
          await editor.fill("");
          console.log("Dilewati: isi pesan tidak cocok.");
          continue;
        }

        console.log(`Chat: ${friend}`);
        console.log(`Pesan siap: ${typedMessage}`);

        const approval = (
          await ask("Kirim pesan ini? (y/n): ")
        ).trim().toLowerCase();


        if (approval === "y") {
          // Periksa ulang isi kolom sebelum melanjutkan.
          const currentMessage = (await editor.innerText()).trim();

          if (currentMessage !== config.message.trim()) {
            console.log("Isi pesan berubah. Pesan tidak dikirim.");
            await editor.fill("");
            continue;
          }

          console.log("Konfirmasi diterima.");
          console.log(
            "Pengiriman belum dilakukan oleh versi ini."
          );
        } else {
          console.log("Pesan dilewati.");
        }

        await editor.fill("");

      } catch (error) {
        console.log(`Gagal memproses ${friend}: ${error.message}`);
      }

      await wait(1500);
    }

    console.log("\nSelesai memeriksa daftar teman.");
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

main();
