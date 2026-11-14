# Разработка BIKESETUP

Технологии: React 19, Vite 6, TypeScript, Tailwind CSS v4, Zustand (persist),
React Router (HashRouter), lz-string для кодов обмена. Десктоп-сборка — Electron.

## Запуск из исходников

```powershell
npm.cmd install
npm.cmd run dev      # http://localhost:5173
npm.cmd run build    # проверка типов + production-сборка в dist/
npm.cmd run preview  # локальный просмотр собранной версии
npm.cmd run desktop  # запуск десктоп-приложения из исходников
npm.cmd run dist:exe # сборка портативного .exe в release/
```

> На Windows с ограниченной политикой выполнения PowerShell используйте `npm.cmd`
> вместо `npm`.

- Портативный `.exe` собирается в `release\BIKESETUP-0.1.0-portable.exe` (~105 МБ).
  Внутри Electron + Chromium.
