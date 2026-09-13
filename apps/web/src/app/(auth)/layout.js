/**
 * Giriş və qeydiyyat — axtarış nəticələrində görünməməlidir (audit #53).
 * Əvvəl metadata yox idi: kökdən `index, follow` və ana səhifənin başlığı
 * miras qalırdı, «British Academy» axtarışında /login çıxa bilərdi.
 */
export const metadata = {
  title: { absolute: "Panelə giriş — British Academy" },
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }) {
  return children;
}
