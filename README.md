# The Preserved Tablet

Universal Codebase Memory & Diagramming Framework — herhangi bir projeye
plug-and-play eklenebilen, local ve graph-native bir AI hafiza sistemi.
Amac: Claude Code'un (veya baska bir AI kod asistaninin) tum codebase'i her
seferinde baştan taramak yerine, `.memory/` dizinindeki ozetlenmis baglami
okuyarak token tuketimini dramatik sekilde azaltmasi.

> **Durum: Faz 3 (MVP)** — dizin iskeleti, initialization, AI rulebook,
> chokidar tabanli watcher, AST/graph motoru, otomatik SVG/HTML diyagram
> uretimi ve gercek AFFiNE'e import edilebilir canvas.md uretimi tamamlandi.

## Kurulum

```bash
npm install preserved-tablet
```

Kurulum sirasinda `postinstall` hook'u projenizin kokune su dosyalari
olusturur (mevcut dosyalarin uzerine ASLA yazmaz):

```
.memory/context.md          # AI'nin okuyacagi birincil baglam (git'e commit edilir)
.memory/ai-rules.md         # AI davranis kurallari (git'e commit edilir)
.memory/graph-map.json      # otomatik uretilen graph verisi (gitignore)
.claude/rules/preserved-tablet.md   # Claude Code tarafindan otomatik kesfedilir
```

`postinstall` **sadece** bu dosyalari olusturur; arka planda hicbir process
baslatmaz (npm v12'nin lifecycle script'lerini varsayilan olarak engellemesi
ve CI/guvenlik-tarayici riskleri nedeniyle bilinçli bir tercih).

Ilk `sync`/`watch` calistiginda ayrica su dosyalar uretilir:

```
.memory/diagram.svg         # tema-duyarli (acik/koyu) mimari haritasi (gitignore)
.memory/diagram.html        # diagram.svg'nin tarayicida acilabilir sarmalayicisi (gitignore)
.memory/canvas.md           # gercek AFFiNE'e import edilebilir, diyagrami gomen not (gitignore)
```

## Kullanim

### Vibe coding sirasinda (onerilen akis)

Claude Code sohbetinde `"hafizaya kaydet"` (veya `"memory guncelle"`, `"save
to memory"`) deyin. `.memory/ai-rules.md` talimati geregi Claude bunu gorunce
kendisi `npx preserved-tablet sync` komutunu calistirir; bu tek komut
`graph-map.json`'i (gercek AST analiziyle), `context.md` ozetini,
`diagram.svg`/`diagram.html`'i VE `canvas.md`'yi gunceller. Elle bir arka
plan sureci baslatmaniza gerek yoktur.

### Gercek AFFiNE'de canvas gorunumu

`.memory/canvas.md` dosyasini kendi kurulu AFFiNE uygulamaniza (masaustu
veya self-hosted web) surukleyip birakin (Import > Markdown). Icinde
diyagram gorseli gomulu gelir. Import sonrasi sayfayi sag ustten **Edgeless**
moduna gecirerek mekansal/canvas gorunumde kesfedebilirsiniz. BlockSuite'in
(AFFiNE'in canvas motoru) canli editorunu dogrudan gommek yerine bu yolu
sectik — nedeni icin `canvas-engine/README.md`'ye bakin.

### CLI komutlari

```bash
npx preserved-tablet init     # .memory/ ve kural dosyalarini olusturur (idempotent)
npx preserved-tablet sync     # tam-proje AST taramasi; graph-map.json + context.md + diagram + canvas.md'yi gunceller
npx preserved-tablet diagram  # yeniden taramadan, mevcut graph-map.json'dan context.md + diagram + canvas.md'yi tazeler
npx preserved-tablet watch    # surekli izleme (foreground, Ctrl+C ile durur)
npx preserved-tablet start    # surekli izlemeyi arka planda baslatir (pid dosyali)
npx preserved-tablet stop     # arka plandaki watcher'i durdurur
```

## Dizin yapisi

```
preserved-tablet/
├── bin/cli.js              # init | sync | diagram | watch | start | stop
├── scripts/postinstall.js  # sadece scaffold, watcher baslatmaz
├── lib/                    # paylasilan yardimcilar (paths, scaffold, template render, CI algilama)
│   └── graph/               # AST parse, import cozumleme, graph insasi, context.md uretimi
├── templates/              # tuketici projeye kopyalanan sablonlar (ai-rules.md tek kaynak)
├── watcher/                 # chokidar tabanli izleme + proje tarama + tek-seferlik sync + opsiyonel daemon
├── diagram-engine/          # doğrulanmis paletle SVG/HTML mimari haritasi uretimi
└── canvas-engine/           # AFFiNE'e import edilebilir Markdown uretimi (bkz. canvas-engine/README.md)
```

## Graph semasi (`.memory/graph-map.json`)

- **Dugum turleri:** `file`, `function`, `class`.
- **Kenar turleri:** `imports` (dosya→dosya, sadece goreceli/yerel importlar
  cozulur — npm paketleri harici bagimlilik kabul edilir ve dugum olarak
  temsil edilmez), `contains` (dosya→fonksiyon/sinif).
- Diyagram sadece `file` dugumlerini gosterir (okunabilirlik icin); ince
  taneli fonksiyon/sinif bilgisi graph JSON'unda kalir.
- Cagri-grafigi (hangi fonksiyon hangisini cagiriyor) kapsam disidir.

## Yol haritasi

- **Faz 1 (tamamlandi):** iskelet, initialization, AI rulebook, watcher.
- **Faz 2 (tamamlandi):** AST/graph motoru (`lib/graph/`) — `graph-map.json`'in
  `nodes`/`edges` alanlarinin gercek statik analizle doldurulmasi;
  `context.md`'nin otomatik ozetlenmesi; `diagram-engine/`'in editoryal
  kalitede, tema-duyarli SVG/HTML diyagramlar uretmesi.
- **Faz 3 (MVP tamamlandi):** `canvas-engine/` — graph semasindan gercek
  AFFiNE'e import edilebilir bir Markdown notu (`canvas.md`) uretimi.
  BlockSuite'in canli editorunun dogrudan gomulmesi (daha derin ama kirilgan
  bir entegrasyon) bilincli olarak kapsam disi birakildi — gerekce ve
  gelecek secenekler icin `canvas-engine/README.md`'ye bakin.
