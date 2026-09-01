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

```bash
sudo cp deploy/nginx/britishacademy.az.conf \
        /etc/nginx/sites-available/britishacademy.az
sudo ln -s /etc/nginx/sites-available/britishacademy.az \
           /etc/nginx/sites-enabled/britishacademy.az

# Defolt sayt qalsa "Welcome to nginx" səhifəsi bizimkini üstələyə bilər.
sudo rm -f /etc/nginx/sites-enabled/default
```

**Hələ `nginx -t` işlətmə** — fayl SSL sertifikatına istinad edir, o isə
sertifikat alınana qədər yoxdur. 4-cü addımdan sonra yoxlanacaq.

### 3. DNS

Domen panelində A qeydlərini dəyiş:

| Tip | Ad | Dəyər |
|-----|-----|-------|
| A | `@` | `169.58.130.173` |
| A | `www` | `169.58.130.173` |

**MX və TXT qeydlərinə toxunma** — poçt onlardan asılıdır, A qeydinin
dəyişməsi poçta təsir etmir.

Yayılmanı yoxla (bir neçə dəqiqədən bir neçə saata qədər çəkir):

```bash
dig +short britishacademy.az
# 169.58.130.173 çıxana qədər gözlə
```

### 4. SSL sertifikatı

DNS yeni serverə yönələndən **sonra**:

```bash
sudo certbot --nginx -d britishacademy.az -d www.britishacademy.az
sudo nginx -t && sudo systemctl reload nginx
```

Certbot `ssl_certificate` sətirlərini özü əlavə edir və 80-ci portu HTTPS-ə
yönləndirir. Avtomatik yenilənməni yoxla:

```bash
sudo certbot renew --dry-run
```

### 5. Environment dəyişənləri

**Client** — `/var/www/britishacademy/client/.env`:

```
NEXT_PUBLIC_SITE_URL=https://britishacademy.az
NEXT_PUBLIC_API_URL=https://britishacademy.az
```

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
