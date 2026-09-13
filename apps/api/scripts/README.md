# scripts/

## Məqsəd

Bu qovluq tətbiqin normal iş axını (HTTP server, router-lar) xaricində, birdəfəlik və ya vaxtaşırı əl ilə işə salınan köməkçi (utility/maintenance) skriptlərini saxlayır. Məsələn: bazanın sıfırlanması, seed məlumatının doldurulması, miqrasiya. Bu skriptlər developer/DevOps tərəfindən terminal-dan icra olunur, request-response dövrəsinin bir hissəsi deyil.

## Adlandırma / yazılış konvensiyası

Fayllar icra etdikləri əməliyyatı təsvir edən `camelCase` fel/isim adı ilə adlanır (məs. `resetDatabase.js`). **Bu qovluqda `index.js` barrel YOXDUR** — skriptlər başqa modul tərəfindən import edilmək üçün nəzərdə tutulmayıb, birbaşa `node` ilə işə salınır. Hər skript öz `main` funksiyasını təyin edir və faylın sonunda dərhal çağırır, iş bitdikdə `process.exit()` ilə prosesi bağlayır. Lazım olan servis və modelları `#services`, `#models` alias-ları ilə import edir.

## Nümunə

`resetDatabase.js` bütün kolleksiyaları təmizləyir:

```js
import { mongoDBService } from "#services";
import { User, OTP, Post } from "#models";

const resetDatabase = async () => {
  await mongoDBService.connect();
  const models = [User, OTP, Post];
  for (const model of models) await model.deleteMany({});
  await mongoDBService.disconnect();
  process.exit(0);
};

resetDatabase();
```

Barrel olmadığı üçün birbaşa işə salınır:

```bash
node scripts/resetDatabase.js
```

## Yeni fayl necə əlavə olunur

1. `<əməliyyat>.js` faylı yarat (məs. `seedUsers.js`).
2. Lazımi servisləri/modelları `#services`, `#models` ilə import et.
3. Bir `async` funksiya yaz, DB bağlantısını aç/bağla, sonda `process.exit()` çağır.
4. Faylın sonunda funksiyanı çağır (`seedUsers();`).
5. `node scripts/seedUsers.js` ilə işə sal. `index.js`-ə heç nə əlavə etmə.

---

## Ehtiyat nüsxə — `backup.sh`

Bu qovluqdakı yeganə shell skripti. Serverdə cron ilə hər gecə işləyir və iki
fayl yaradır:

| Fayl | İçində |
|---|---|
| `db-<vaxt>.archive.gz` | `mongodump` — bütün kolleksiyalar |
| `uploads-<vaxt>.tar.gz` | yüklənmiş şəkil, video və sənədlər |

**İkisi birlikdə lazımdır.** Bazada yalnız `/uploads/...` yolları saxlanılır,
faylların özü diskdədir.

### Quraşdırma (serverdə, bir dəfə)

```bash
# 1) mongodump — MongoDB Database Tools
#    https://www.mongodb.com/try/download/database-tools → Ubuntu .deb
sudo apt install ./mongodb-database-tools-*.deb
mongodump --version

# 2) İcra icazəsi və sınaq
cd /var/www/britishacademy/server
chmod +x scripts/backup.sh
sudo scripts/backup.sh
ls -lh /var/backups/britishacademy

# 3) Cron — hər gecə 03:30
sudo crontab -e
30 3 * * * /var/www/britishacademy/server/scripts/backup.sh >> /var/log/ba-backup.log 2>&1
```

`MONGODB_URI` avtomatik `server/.env`-dən oxunur. Lokal nüsxələr 14 gün
qalır (`KEEP_DAYS`).

### Serverdən kənara köçürmə (tövsiyə olunur)

Nüsxə yalnız eyni serverdədirsə, disk xarab olanda və ya server silinəndə o da
itir. `rclone` Google Drive, S3, Backblaze, başqa SFTP server və s. dəstəkləyir:

```bash
sudo apt install rclone
sudo rclone config            # məs. "gdrive" adlı remote yarat

# crontab sətri:
30 3 * * * BACKUP_RCLONE_REMOTE=gdrive:britishacademy /var/www/britishacademy/server/scripts/backup.sh >> /var/log/ba-backup.log 2>&1
```

Uzaq nüsxələr 60 gün saxlanılır (`REMOTE_KEEP_DAYS`).

**Cron səssizcə dayanmasın deyə** `BACKUP_PING_URL` verin (məs. pulsuz
healthchecks.io): uğurda həmin URL, xətada `<url>/fail` çağırılır. Bir gün
nüsxə gəlməsə servis e-poçt göndərir.

### Bərpa

```bash
# Baza — --drop mövcud kolleksiyaları nüsxədəki ilə ƏVƏZ EDİR
mongorestore --uri="$MONGODB_URI" --gzip --archive=/var/backups/britishacademy/db-20260101-033000.archive.gz --drop

# Fayllar
cd /var/www/britishacademy/server
tar -xzf /var/backups/britishacademy/uploads-20260101-033000.tar.gz

pm2 restart 30002:britishacademy-server
```

**Ayda bir dəfə bərpanı sınayın** — heç vaxt açılmamış nüsxə yoxlanılmamış
nüsxədir. Canlı bazaya toxunmadan ayrı ada bərpa etmək olar (`britishacademy` —
`MONGODB_URI`-dəki baza adı):

```bash
mongorestore --uri="mongodb://localhost:27017" --gzip \
  --archive=/var/backups/britishacademy/db-<vaxt>.archive.gz \
  --nsFrom='britishacademy.*' --nsTo='ba_restore_test.*'
mongosh ba_restore_test --eval 'db.leads.countDocuments()'
mongosh ba_restore_test --eval 'db.dropDatabase()'
```
