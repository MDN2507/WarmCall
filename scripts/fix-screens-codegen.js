// Works around a react-native-screens codegen bug: a union-type event field
// ("environment: 'regular' | 'inline'") that the current RN codegen version
// can't turn into native event-emitter code. The app doesn't use the Tabs
// API this file belongs to, so widening the type to `string` is safe and
// side-effect-free. This runs after every `pnpm install` since the file
// lives inside node_modules and would otherwise be overwritten on reinstall.
const fs = require("fs");
const path = require("path");

const TARGET_FILENAME = "TabsBottomAccessoryNativeComponent.ts";
const OLD = `environment: 'regular' | 'inline';`;
const NEW = `environment: string;`;

function walk(dir, found) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, found);
    } else if (entry.name === TARGET_FILENAME) {
      found.push(full);
    }
  }
}

const nodeModules = path.resolve(__dirname, "..", "node_modules");
const found = [];
walk(nodeModules, found);

if (found.length === 0) {
  console.log("[fix-screens-codegen] Файл не найден (возможно, версия react-native-screens изменилась) — пропускаю.");
  process.exit(0);
}

let patchedCount = 0;
for (const file of found) {
  const content = fs.readFileSync(file, "utf8");
  if (content.includes(OLD)) {
    fs.writeFileSync(file, content.replace(OLD, NEW), "utf8");
    patchedCount++;
    console.log(`[fix-screens-codegen] Пропатчен: ${file}`);
  }
}

console.log(`[fix-screens-codegen] Готово. Пропатчено файлов: ${patchedCount} из ${found.length} найденных.`);
