import { SocketProvider } from "@/store/context/SocketContext";

/**
 * Admin paneli üçün klient provayderləri.
 *
 * Socket.IO bağlantısı YALNIZ burada qurulur. Əvvəl kök layout-dakı
 * Providers-də idi və socket.io-client ictimai saytın hər səhifəsinə
 * yüklənirdi, halbuki yalnız panelin WhatsApp bölməsi üçündür (audit #16).
 * Redux store isə kökdə qalır — ictimai müraciət formları da onu işlədir.
 */
export default function ProtectedLayout({ children }) {
  return <SocketProvider>{children}</SocketProvider>;
}
