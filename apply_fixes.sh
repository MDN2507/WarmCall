#!/bin/bash
set -e

# Этот скрипт нужно запускать из папки проекта (~/WarmCall), в Git Bash.
# Перед запуском убедись, что WarmCall-fixed.zip скачан (обычно в ~/Downloads).

ZIP_NAME="WarmCall-fixed.zip"
ZIP_PATH=""

# Ищем архив в стандартных местах
for candidate in "./$ZIP_NAME" "$HOME/Downloads/$ZIP_NAME" "$HOME/Загрузки/$ZIP_NAME"; do
  if [ -f "$candidate" ]; then
    ZIP_PATH="$candidate"
    break
  fi
done

if [ -z "$ZIP_PATH" ]; then
  echo "❌ Не нашёл $ZIP_NAME ни в текущей папке, ни в Downloads/Загрузки."
  echo "   Укажи путь к файлу вручную, например:"
  echo "   bash apply_fixes.sh \"C:/Users/ASUS/Downloads/WarmCall-fixed.zip\""
  if [ -n "$1" ]; then
    ZIP_PATH="$1"
  else
    exit 1
  fi
fi

echo "📦 Использую архив: $ZIP_PATH"

TMP_DIR=$(mktemp -d)
unzip -q "$ZIP_PATH" -d "$TMP_DIR"

SRC="$TMP_DIR/WarmCall-main"

if [ ! -d "$SRC" ]; then
  echo "❌ Не нашёл папку WarmCall-main внутри архива. Что-то пошло не так."
  exit 1
fi

echo "📁 Копирую исправленные файлы..."

mkdir -p "./app/utils"

cp "$SRC/app/context/AppContext.tsx"   "./app/context/AppContext.tsx"
cp "$SRC/app/(tabs)/history.tsx"       "./app/(tabs)/history.tsx"
cp "$SRC/app/(tabs)/parent.tsx"        "./app/(tabs)/parent.tsx"
cp "$SRC/app/(tabs)/index.tsx"         "./app/(tabs)/index.tsx"
cp "$SRC/app/utils/dates.ts"           "./app/utils/dates.ts"

rm -rf "$TMP_DIR"

echo "✅ Готово! Заменены/добавлены файлы:"
echo "   - app/context/AppContext.tsx"
echo "   - app/(tabs)/history.tsx"
echo "   - app/(tabs)/parent.tsx"
echo "   - app/(tabs)/index.tsx"
echo "   - app/utils/dates.ts (новый)"
echo ""
echo "Дальше:"
echo "   git add ."
echo "   git commit -m \"fix bugs\""
echo "   git push"
