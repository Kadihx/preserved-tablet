# canvas-engine (Faz 3 — import-tabanli MVP)

## Tasarim karari

Vizyon dokumaninda "AFFiNE'in canvas motorunu kullanan" bir entegrasyon
istendi. AFFiNE'in canvas motoru gercekten npm'de acik kaynak olarak
mevcut: **BlockSuite** (`@blocksuite/presets`, `@blocksuite/blocks`,
`@blocksuite/store` — hepsi AFFiNE'in kendi GitHub organizasyonu
`toeverything` tarafindan yayinlaniyor).

Ancak BlockSuite'in CANLI editorunu (`AffineEditorContainer` /
`EdgelessEditor`) dogru sekilde DOM'a gommek, AFFiNE'in kendi resmi starter
ornegine (`packages/playground/apps/starter`) gore su ic API'leri yeniden
kurmayi gerektiriyor: `SpecProvider`, extension/DI sistemi,
`DocModeProvider`/`NotificationExtension`/`ParseDocUrlExtension` gibi mock
servisler, font/tema extension'lari. Bu, AFFiNE'in kendi uygulama
plumbing'inin onemli bir kismini yeniden uretmek anlamina geliyor — kirilgan
(surum degisikliklerine karsi hassas) ve orantisiz derecede agir.

**Bunun yerine:** `generate-markdown.js`, graph-map.json'dan gercek AFFiNE'e
**import edilebilir bir Markdown dosyasi** (`.memory/canvas.md`) uretir —
diyagram gorseli gomulu (base64 data URI), dizin/dosya/fonksiyon/sinif
dokumu ile. Kullanici bu dosyayi KENDI kurulu AFFiNE uygulamasina (masaustu
veya self-hosted web) surukleyip birakir; AFFiNE'in yerlesik **Page ->
Edgeless** gecisi sayfa'yi mekansal/canvas gorunume cevirir.

Bu yaklasim: fork gerektirmiyor, kirilgan ic API'ye baglanmiyor, ve
kullanicinin GERCEK AFFiNE deneyimini (kendi workspace'i, kendi
senkronizasyonu, kendi UI'i) kullanmasini sagliyor.

## Gelecek (opsiyonel, kapsam disi)

Eger ileride canli/gomulu bir editor gercekten istenirse, bunun icin ayri
bir Vite tabanli mini-uygulama (bu paketten bagimsiz, `npm create vite`
ile baslatilan) kurulmasi ve AFFiNE'in starter ornegindeki extension
zincirinin dikkatlice port edilmesi gerekir. Bu, mevcut MVP'nin kasitli
olarak ertelendigi, ayri ve daha buyuk bir is parcasidir.
