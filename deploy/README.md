# Domenin yeni serverə keçirilməsi

`britishacademy.az` hazırda **köhnə statik saytdadır** (94.20.59.180).
Yeni sayt `169.58.130.173` serverində, iki PM2 prosesində işləyir:

| Port  | Proses | Nə edir |
|-------|--------|---------|
| 30001 | `30001:britishacademy-client` | Next.js — sayt + admin panel |
| 30002 | `30002:britishacademy-server` | Express — API, `/uploads`, socket.io |

Köhnə ünvanların 301 yönləndirmələri **Next middleware-indədir**
(`apps/web/src/lib/legacyRoutes.js`), nginx-də ayrıca qeyd lazım deyil.
Onlar yalnız domen bu serverə yönələndən sonra real trafikə təsir edəcək.

---

## Addımlar

### 1. Serverdə nginx və certbot

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
sudo mkdir -p /var/cache/nginx/ba_uploads
sudo systemctl enable --now nginx
```

Portlar açıq olmalıdır:

```bash
sudo ufw allow 'Nginx Full'      # 80 + 443
sudo ufw status
```

30001 və 30002 portlarını **bayıra açma** — nginx onlara `127.0.0.1`
üzərindən müraciət edir. Açıq qalsalar saytı domeni yan keçərək IP:port ilə
açmaq olar; bu, ikiqat məzmun deməkdir və axtarış reytinqinə zərər verir.

### 2. Konfiqurasiya faylı

Serverdə **bu qovluq yoxdur** — orada yalnız `client` və `server` repoları
klonlanıb, `deploy/` isə monorepodadır.

**Faylı `scp` ilə göndər — terminala yapışdırma.** 150 sətirlik konfiqi SSH
seansına yapışdıranda terminal sətirləri bir-birinin üstünə salır və fayl
səssizcə yarımçıq yazılır (praktikada baş verdi: `nginx -t` tanınmayan
direktiv göstərdi, çünki blokun ortası itmişdi).

**Köçürmə iki mərhələlidir.** Yekun konfiqdə `listen 443 ssl` var, nginx isə
`ssl_certificate` olmadan belə bloku qəbul etmir — sertifikat isə hələ
yoxdur, çünki onu almaq üçün nginx-in işləməsi lazımdır. Ona görə əvvəlcə
yalnız-HTTP konfiqi qoyulur.

Lokal maşından (PowerShell):

```powershell
scp "deploy\nginx\britishacademy.az.http.conf" `
    root@169.58.130.173:/etc/nginx/sites-available/britishacademy.az
```

Sonra serverdə:

```bash
sudo ln -sfn /etc/nginx/sites-available/britishacademy.az \
             /etc/nginx/sites-enabled/britishacademy.az

# Defolt sayt qalsa "Welcome to nginx" səhifəsi bizimkini üstələyə bilər.
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t && sudo systemctl reload nginx
```

`ln -sfn` işlədilir (`ln -s` yox): simvolik keçid artıq varsa `ln -s`
«File exists» ilə dayanır, `-f` isə onu əvəz edir.

Bu mərhələdə sayt HTTP üzərindən **tam işləkdir** — DNS keçidindən sonra
fasilə olmur, sadəcə hələ HTTPS yoxdur.

**Hələ `nginx -t` işlətmə** — fayl SSL sertifikatına istinad edir, o isə
sertifikat alınana qədər yoxdur. 4-cü addımdan sonra yoxlanacaq.

### 3. DNS (Cloudflare)

Domenin ad serverləri Cloudflare-dədir (`*.ns.cloudflare.com`), ona görə
qeydlər **Cloudflare → DNS → Records** bölməsində dəyişdirilir.

| Tip | Ad | Dəyər | Proxy |
|-----|-----|-------|-------|
| A | `@` | `169.58.130.173` | **DNS only** (boz) |
| AAAA | `@` | `2a02:c207:2348:8731::1` | **DNS only** (boz) |
| A | `www` | `169.58.130.173` | **DNS only** (boz) |
| AAAA | `www` | `2a02:c207:2348:8731::1` | **DNS only** (boz) |

TTL-i `Auto` et — köçürmə zamanı dəyişikliyin tez yayılması üçün.

**MX və TXT qeydlərinə toxunma** — poçt onlardan asılıdır, A/AAAA qeydinin
dəyişməsi poçta təsir etmir.

#### Narıncı buludu (proxy) köçürmə zamanı yandırma

İki səbəb var:

1. **Sonsuz yönləndirmə dövrü.** Cloudflare-in SSL rejimi *Flexible*-dırsa,
   o, origin-ə HTTP ilə qoşulur, bu konfiq isə HTTP-ni HTTPS-ə yönləndirir →
   Cloudflare yenidən HTTP ilə gəlir → `ERR_TOO_MANY_REDIRECTS`.
   Proxy yandırılacaqsa **SSL/TLS → Full (strict)** seçilməlidir.
2. **certbot.** Boz buludda HTTP-01 doğrulaması birbaşa serverə gəlir və
   heç bir əlavə tənzimləmə tələb etmir.

Hər şey işləyəndən sonra proxy yandırıla bilər; o zaman keşi də təmizlə
(*Caching → Purge Everything*).

Yayılmanı yoxla (bir neçə dəqiqədən bir neçə saata qədər çəkir):

```bash
dig +short britishacademy.az
# 169.58.130.173 çıxana qədər gözlə
```

### 4. SSL sertifikatı + yekun konfiq

DNS yeni serverə yönələndən **sonra**. `--nginx` deyil, `certonly --webroot`
işlədilir: `--nginx` konfiqi özü redaktə edir və bizim tənzimlədiyimiz proxy
bloklarını dublikat edir. `certonly` yalnız sertifikat alır, konfiq bizdə qalır.

```bash
sudo certbot certonly --webroot -w /var/www/html \
     -d britishacademy.az -d www.britishacademy.az \
     --agree-tos -m <sənin@epoçtun> --no-eff-email
```

Sertifikatın yarandığını yoxla — yekun konfiq ona istinad edir:

```bash
sudo ls /etc/letsencrypt/live/britishacademy.az/
# fullchain.pem və privkey.pem görünməlidir
```

> `options-ssl-nginx.conf` və `ssl-dhparams.pem` fayllarına **ehtiyac yoxdur**.
> Onlar `python3-certbot-nginx` plaqini ilə gəlir, biz isə `certonly`
> işlədirik. TLS parametrləri konfiqin öz içindədir. Əgər əvvəllər həmin
> faylları yaratmağa cəhd edilibsə və içləri boş/səhvdirsə, nginx
> `unexpected end of file` ilə çökür — sil:
> ```bash
> sudo rm -f /etc/letsencrypt/options-ssl-nginx.conf /etc/letsencrypt/ssl-dhparams.pem
> ```

İndi yekun (HTTPS) konfiqi qoy — lokal maşından:

```powershell
scp "deploy\nginx\britishacademy.az.conf" `
    root@169.58.130.173:/etc/nginx/sites-available/britishacademy.az
```

```bash
# Faylın tam getdiyini yoxla — 187 sətir olmalıdır.
wc -l /etc/nginx/sites-available/britishacademy.az   # 187
sudo nginx -t && sudo systemctl reload nginx
```

Avtomatik yenilənməni yoxla:

```bash
sudo certbot renew --dry-run
```

Yenilənmədən sonra nginx-in yeni sertifikatı götürməsi üçün qarmaq əlavə et
(`certonly` işlədildiyi üçün certbot bunu özü etmir):

```bash
echo -e '#!/bin/sh\nsystemctl reload nginx' \
  | sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
```

### 5. Environment dəyişənləri

**Client** — `/var/www/britishacademy/client/.env`:

```
NEXT_PUBLIC_SITE_URL=https://britishacademy.az
NEXT_PUBLIC_API_URL=https://britishacademy.az
NEXT_PUBLIC_IMAGE_URL=https://britishacademy.az
```

`NEXT_PUBLIC_IMAGE_URL` təyin olunmasa `NEXT_PUBLIC_API_URL`-dən törəyir, ona
görə məcburi deyil — amma açıq yazmaq sonradan API-ni ayrı subdomenə keçirsən
şəkillərin sınmasının qarşısını alır.

`NEXT_PUBLIC_LEGACY_IMAGE_HOSTS` **lazım deyil, boş qalsın**. Bazada bütün
şəkillər nisbi yol kimi saxlanılır (`/uploads/...`), mütləq IP ünvanı yoxdur —
yoxlanılıb. (Qeyd: o dəyişəni oxuyan `normalizeContentHtml` funksiyası hazırda
heç yerdən çağırılmır, yəni onsuz da təsirsizdir.)

`NEXT_PUBLIC_*` dəyişənləri **build zamanı koda yazılır** — restart kifayət
etmir, yenidən build lazımdır:

```bash
cd /var/www/britishacademy/client
pnpm run build
pm2 restart 30001:britishacademy-client --update-env
```

Bu addım atlanarsa sayt öz ünvanını hələ də IP kimi elan edəcək
(`<link rel="canonical" href="http://169.58.130.173:30001/...">`) və Google
səhifələrin əsl ünvanının IP olduğunu düşünəcək — yönləndirmələrin
qazandırdığı reytinq itər.

**Server** — `/var/www/britishacademy/server/.env`:

```
DOMAIN=britishacademy.az
CLIENT_URL=https://britishacademy.az
APP_URL=https://britishacademy.az
```

```bash
pm2 restart 30002:britishacademy-server --update-env
```

### 6. Admin paneldə iki düymə

Developer bölməsində, bu sıra ilə:

1. **Kurs sluglarını köhnə ünvanlara uyğunlaşdır**
2. **Səviyyə testlərini yüklə**

Bunlarsız üç yönləndirmə mövcud olmayan səhifəyə düşür:
`/ingilis-dili-kurslari`, `/ielts-kurslari`, `/english-test`.

---

## Yoxlama

```bash
# Yönləndirmələr işləyirmi (hamısı 200 ilə bitməlidir)
for p in /english-test /ingilis-dili-kurslari /ielts-kurslari /sat-kurslari \
         /expert-instructors /reservation /az /dil-kurslari/ \
         /ielts-sat-toefl-gmat/ /ingilis-dili-kurslari-qiymetleri \
         /ielts-kurslari-qiymetleri /en-yaxsi-ingilis-dili-kurslari \
         /online-ingilis-dili-kurslari /rus-dili-test; do
  printf '%-38s %s\n' "$p" \
    "$(curl -s -o /dev/null -L -w '%{http_code}  ← %{url_effective}' \
       https://britishacademy.az$p)"
done

# API və fayllar
curl -s -o /dev/null -w 'api: %{http_code}\n'  https://britishacademy.az/api/site
curl -s -I https://britishacademy.az/uploads/ | head -1

# Kanonik ünvan artıq IP olmamalıdır
curl -s https://britishacademy.az/kurslar | grep -o 'rel="canonical"[^>]*'

# www yönləndirməsi
curl -s -o /dev/null -w '%{http_code} → %{redirect_url}\n' \
     https://www.britishacademy.az/
```

---

## Köhnə serverə nə olur

Köhnə statik sayt (94.20.59.180) DNS keçidindən sonra domen üzərindən
açılmayacaq, amma **serveri dərhal söndürmə**. Bir-iki həftə saxla: geri
qayıtmaq lazım gələrsə DNS-i geri çevirmək kifayət edir.

Köhnə saytın fayllarının ehtiyat nüsxəsini götür — orada bizdə olmayan
məzmun (şəkil, mətn) qala bilər.
