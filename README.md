# Генератор паролів і ключів

Односторінковий додаток: Vite + React + TypeScript. Без бекенду, генерація через `crypto.getRandomValues`.

## Запуск

```bash
npm install
npm run dev      # розробка на http://localhost:5173
npm run build    # збірка в dist/
```

## Публікація на Netlify

1. `git init && git add . && git commit -m "init"`
2. Створіть репозиторій на GitHub, `git remote add origin <url>`, `git push -u origin main`
3. Netlify → Add new site → Import from Git → оберіть репозиторій.
   Налаштування підтягнуться з `netlify.toml` (build: `npm run build`, publish: `dist`).

## Безпечні символи

Для паролів використовується лише `- _ . ~` (unreserved-символи RFC 3986).
Щоб додати інші, змініть `SAFE_SYMBOLS` у `src/lib/generator.ts`.

## Структура

- `src/lib/generator.ts` — генерація (Web Crypto, без зміщення), оцінка надійності
- `src/hooks/useSettings.ts` — налаштування в `localStorage` (самі паролі не зберігаються)
- `src/components/` — `OutputCard`, `LengthControl`, `Toggle`
- `public/_headers` — заголовки безпеки для Netlify (CSP тощо)

## Клавіші

`R` — згенерувати знову, `C` — скопіювати (працюють на будь-якій розкладці).
