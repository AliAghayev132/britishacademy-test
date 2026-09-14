// Lib
import { SocketServer, jwt } from "#lib";

// Config
import { config, corsConfig } from "#config";

// Constants
import { adminRoles } from "#constants";

// Models
import { User } from "#models";

// Utils
import { readCookie, canAccessSection } from "#utils";

/**
 * SocketService (singleton)
 *
 * Panelə canlı hadisələr: WhatsApp jurnalı və toplu göndərişin gedişatı.
 * Axın YALNIZ serverdən klientə gedir.
 *
 * TƏHLÜKƏSİZLİK (audit #21). Əvvəl:
 *  - handshake yalnız tokenin imzasını yoxlayırdı — çıxış etmiş, bloklanmış
 *    və ya rütbəsi endirilmiş admin socket açıq qaldıqca alıcıların telefon
 *    nömrələrini almağa davam edirdi;
 *  - hadisə tokendəki (köhnə) rola görə göndərilirdi, bölmə icazəsinə yox;
 *  - istənilən giriş etmiş istifadəçi istənilən «otağa» qoşulub orada mesaj
 *    yaya bilirdi (şablondan qalan, heç yerdə işlədilməyən relay).
 *
 * İndi:
 *  - handshake-də istifadəçi bazadan oxunur (status, tokenVersion, rol);
 *  - bağlantı access tokenin bitdiyi anda kəsilir — klient sessiyanı yeniləyib
 *    yenidən qoşulur, yəni icazələr ən geci 15 dəqiqədə bir yoxlanılır;
 *  - istifadəçi dəyişdiriləndə, silinəndə və ya çıxış edəndə socket-ləri
 *    dərhal kəsilir (disconnectUser);
 *  - hadisə bölmə icazəsi olanlara göndərilir (emitToSection);
 *  - klientdən gələn hadisə dinlənilmir.
 */
class SocketService {
  constructor() {
    this.io = null;
  }

  init(httpServer) {
    this.io = new SocketServer(httpServer, {
      cors: {
        origin: corsConfig.origin,
        methods: ["GET", "POST"],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.io.use((socket, next) => this.authMiddleware(socket, next));
    this.io.on("connection", (socket) => this.onConnection(socket));

    return this.io;
  }

  /**
   * Handshake: token + bazadakı istifadəçi.
   */
  async authMiddleware(socket, next) {
    try {
      // Panel HttpOnly cookie ilə qoşulur (JS tokeni görmür); auth.token
      // skriptlər üçün qalır.
      const token =
        socket.handshake.auth?.token ||
        readCookie(socket.handshake.headers?.cookie, config.accessCookieName);

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, config.accessSecretKey);
      const user = await User.findById(decoded.id)
        .select("role status isDeleted tokenVersion permissions")
        .lean();

      if (
        !user ||
        user.isDeleted ||
        user.status !== "active" ||
        user.tokenVersion !== decoded.tokenVersion ||
        !adminRoles.includes(user.role)
      ) {
        return next(new Error("Invalid token"));
      }

      socket.data.user = {
        id: String(user._id),
        role: user.role,
        permissions: user.permissions || [],
      };
      socket.data.exp = decoded.exp;
      next();
    } catch (_error) {
      return next(new Error("Invalid token"));
    }
  }

  onConnection(socket) {
    // Token bitəndə bağlantı da bitir. Klient `io server disconnect` alıb
    // sessiyanı yeniləyir və yenidən qoşulur — handshake yenə bazaya baxır.
    const ms = (socket.data.exp || 0) * 1000 - Date.now();
    const timer = setTimeout(() => socket.disconnect(true), Math.max(ms, 0));
    timer.unref?.();
    socket.on("disconnect", () => clearTimeout(timer));
  }

  /**
   * Hadisəni həmin bölməni görə bilən qoşulmuş istifadəçilərə göndər.
   */
  emitToSection(section, event, data) {
    if (!this.io) return;
    for (const socket of this.io.sockets.sockets.values()) {
      if (socket.data.user && canAccessSection(socket.data.user, section)) {
        socket.emit(event, data);
      }
    }
  }

  /**
   * İstifadəçinin bütün socket-lərini kəs (rol/icazə dəyişikliyi, silinmə,
   * çıxış). Hələ də səlahiyyəti varsa klient özü yenidən qoşulur.
   */
  disconnectUser(userId) {
    if (!this.io || !userId) return;
    const id = String(userId);
    for (const socket of this.io.sockets.sockets.values()) {
      if (socket.data.user?.id === id) socket.disconnect(true);
    }
  }

  /** Bütün bağlantıları bağla (prosesin dayanması). */
  close() {
    return new Promise((resolve) => {
      if (!this.io) return resolve();
      this.io.close(() => resolve());
    });
  }

  getIO() {
    return this.io;
  }
}

const socketService = new SocketService();
export default socketService;
