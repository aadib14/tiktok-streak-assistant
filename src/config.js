
const fs = require("node:fs");
const path = require("node:path");

const configPath = path.join(__dirname, "..", "config", "config.json");

function loadConfig() {
  const config = JSON.parse(
    fs.readFileSync(configPath, "utf8")
  );

  validateConfig(config);

  return config;
}

function validateConfig(config) {
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
    throw new Error(
      "Konfigurasi tidak valid:\n- " + errors.join("\n- ")
    );
  }

  return true;
}

function saveConfig(config) {
  validateConfig(config);

  fs.writeFileSync(
    configPath,
    JSON.stringify(config, null, 2) + "\n",
    "utf8"
  );
}

module.exports = {
  loadConfig,
  saveConfig,
  validateConfig,
};
