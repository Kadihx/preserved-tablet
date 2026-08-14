# Proje Hafizasi (The Preserved Tablet)

> Bu dosya `.memory/context.md` olarak preserved-tablet tarafindan otomatik guncellenir.
> Son guncelleme: 2026-08-14T15:13:33.738Z
>
> AI asistanlarin bu projeyi anlamasi icin BIRINCIL baglam kaynagidir.
> Okuma/kullanim kurallari icin bkz. `.memory/ai-rules.md`.

## Proje Ozeti

- Toplam dosya: **34**
- Toplam fonksiyon: **65**, sinif: **0**
- Proje-ici import iliskisi: **35**
- Son senkronizasyon: 2026-08-14T15:13:33.732Z (durum: parsed)

## Tech Stack

- Paket adi: `preserved-tablet` (v0.1.0)
- Aciklama: Universal Codebase Memory & Diagramming Framework — a plug-and-play, local, graph-native project memory for AI coding agents like Claude Code.
- Bagimliliklar: `chokidar`, `@babel/parser`, `@babel/traverse`
- npm script'leri: `postinstall`, `sync`, `watch`, `dashboard`

## Dizin Dagilimi

- `watcher/` — 6 dosya
- `(kok)/` — 5 dosya
- `lib/` — 5 dosya
- `lib/graph/` — 5 dosya
- `templates/` — 4 dosya
- `diagram-engine/` — 3 dosya
- `canvas-engine/` — 2 dosya
- `dashboard/` — 2 dosya
- `bin/` — 1 dosya
- `scripts/` — 1 dosya

## Olasi Giris Noktalari

(Baska hicbir izlenen dosya tarafindan import edilmeyen ama kendisi en az bir dosya import eden dosyalar)

- `bin/cli.js`
- `scripts/postinstall.js`

## En Cok Ic-Import Yapan Dosyalar

- `bin/cli.js` — 7 ic import
- `watcher/graph-updater.js` — 6 ic import
- `lib/graph/regenerate-artifacts.js` — 3 ic import
- `lib/scaffold.js` — 3 ic import
- `watcher/index.js` — 3 ic import
- `watcher/sync.js` — 3 ic import
- `dashboard/server.js` — 2 ic import
- `lib/graph/build-graph.js` — 2 ic import

## Dosya Aciklamalari

(Kaynak koddaki yorumlardan cikarildi -- dosyayi acmadan once buraya bak)

- `diagram-engine/palette.js` — dataviz skill'in referans paletinden alinip `scripts/validate_palette.js` ile dogrulanmis kategorik renkler (3 slot: CVD-safe, sira SABIT). Yeni bir dizin grub…
- `lib/env.js` — Yaygin CI saglayicilarinin set ettigi env degiskenlerine bakarak CI ortaminda calisilip calisilmadigini tahmin eder. postinstall CI'da scaffold'u atlar; cunku …
- `lib/render-template.js` — Cok basit bir {{DEGISKEN}} sablon motoru. Buyuk bir templating kutuphanesine gerek yok; sadece birkac sabit alani (GENERATED_AT gibi) enjekte ediyoruz.

## Ana Modul/Dosya Haritasi

Tam graph verisi icin bkz. `.memory/graph-map.json`. Gorsel mimari haritasi:
`.memory/diagram.svg` (veya tarayicida acilabilir `.memory/diagram.html`).

<!-- HUMAN-NOTES-START -->
## Insan Notlari

(Bu bolumu serbestce duzenleyebilirsiniz — otomatik uretim bu bolume
dokunmaz. Onemli mimari kararlari, kisitlari veya baglami buraya elle
ekleyebilirsiniz.)
<!-- HUMAN-NOTES-END -->
