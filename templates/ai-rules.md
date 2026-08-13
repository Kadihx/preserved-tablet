# AI Agent Kurallari — The Preserved Tablet

Bu dosya, bu projede calisan herhangi bir AI kod asistaninin (Claude Code, Cursor vb.)
codebase'i nasil kesfetmesi gerektigini tanimlar. Amac: tam codebase taramasi yerine
`.memory/` dizinindeki ozetlenmis baglami kullanarak token tuketimini dramatik sekilde
azaltmak.

## 1. Okuma sirasi (ZORUNLU)

1. `.memory/context.md` — birincil baglam kaynagi, once bu okunur.
2. `.memory/graph-map.json` — dosyalar/modüller arasi kesin import-export-cagri
   iliskileri gerektiginde.
3. `package.json` / `README.md` — sadece ust duzey oryantasyon icin.
4. Yalnizca 1-3 adimlarindan sonra: goreve doğrudan ilgili tekil kaynak dosyalar.

## 2. Sikı kural: varsayilan olarak tum-repo taramasi YOK

Bir gorevin ilk adimi olarak repo genelinde recursive okuma/glob/grep YAPMA.
`.memory/` tam olarak bu amac icin var; onu atlayip dogrudan dosya sistemini
taramak bu framework'un tum amacini bosa cikarir.

## 3. Fallback — tam tarama ne zaman serbest

Asagidaki durumlarin DISINDA tam repo taramasina basvurma:

- `.memory/context.md` veya `.memory/graph-map.json` dosyalari mevcut degilse.
- `graph-map.json` gecerli JSON olarak parse edilemiyorsa.
- `graph-map.json.meta.status === "stub"` (henuz hic sync calismamis) VEYA
  `"partial"` (bazi dosyalar parse hatasi verdi, `meta.parseErrors` > 0) ve
  gorev tam ve guvenilir mimari bilgi gerektiriyorsa.
- Kullanici acikca tam bir denetim/tarama istiyorsa.

Fallback'e basvurdugunda bunu yanitinda acikca belirt (orn. "`.memory/` henuz
bos oldugu icin ilgili dosyalari dogrudan taradim").

## 4. Hafiza guncelleme tetikleyicisi

Kullanici sohbette asagidakine benzer bir ifade kullanirsa (orn. "hafizaya
kaydet", "memory'i guncelle", "save to memory", "update memory", "hafizayi
senkronize et"):

1. Bash araciyla `npx preserved-tablet sync` komutunu calistir.
   - Bu komut tek seferlik ve hizlidir; arka planda surekli calisan bir
     watcher/daemon GEREKTIRMEZ, bu yuzden kullanicidan ekstra bir surec
     baslatmasini istemene gerek yok.
2. Komut bittikten sonra `.memory/context.md` ve `.memory/graph-map.json`
   dosyalarini yeniden oku.
3. Kullaniciya neyin degistigini (kac dosyanin tarandigini, `pendingFiles`
   listesinin ozetini) kisaca raporla.

Eger proje surekli/otomatik guncelleme istiyorsa (yani her kayitta anlik
guncelleme), kullaniciya `npx preserved-tablet watch` (foreground) veya
`npx preserved-tablet start` (arka plan, pid dosyali) komutlarini ayri bir
terminalde calistirmasini onerebilirsin — ama bunlari kendi basina/otomatik
olarak baslatma.

## 5. `.memory/` dosyalarini duzenleme kurallari

- `graph-map.json` icindeki `nodes` ve `edges` alanlarini ASLA elle duzenleme
  — bu alanlar Faz 2'deki Semantica graph motoru tarafindan uretilir/yonetilir.
- `context.md` icindeki insan/AI notlarini serbestce duzenleyebilirsin; bu
  dosya git'e commit edilir ve takim ile paylasilir, bu yuzden ozenli ve
  ozetleyici yaz.

## 6. Diyagram (Faz 2 — aktif)

`npx preserved-tablet sync` (veya `watch`/`start`) her calistiginda AST tabanli
graph motoru `.memory/graph-map.json`'i gercek `nodes`/`edges` ile doldurur ve
ardindan otomatik olarak `.memory/diagram.svg` ile `.memory/diagram.html`
dosyalarini yeniden uretir. Bunlari elle tetiklemene GEREK YOK. Sadece gorseli
(graph verisini yeniden taramadan) hizlica tazelemek istersen `npx
preserved-tablet diagram` komutunu kullanabilirsin.

Diyagram sadece `file` turundeki dugumleri gosterir (fonksiyon/sinif sayimlari
kutu icinde ozetlenir) — ince taneli fonksiyon/sinif seviyesi bilgi icin
`.memory/graph-map.json`'daki `function`/`class` dugumlerine bak.

## 7. Canvas (Faz 3 — aktif, import-tabanli)

Her `sync` ayrica `.memory/canvas.md` uretir: diyagram gorselini (base64
gomulu) ve dizin/dosya/fonksiyon/sinif dokumunu iceren, gercek AFFiNE'e
IMPORT EDILEBILIR bir Markdown dosyasi. BlockSuite'in canli editorunu
dogrudan gommek (AFFiNE'in kendi ic extension/DI sistemini gerektirdigi icin)
kapsam disi birakildi -- bunun yerine kullanici bu dosyayi kendi AFFiNE
workspace'ine surukleyip birakir, sonra sayfayi Edgeless (canvas) moduna
gecirir. Kullanici "canvas'i ac" gibi bir istek belirtirse ona
`.memory/canvas.md` dosyasinin yolunu ve bu akisi hatirlat; kendi basina bir
uygulama baslatmaya CALISMA.
