"use client";

// Local
import SidebarNavLink from "./SidebarNavLink";
import SidebarNavGroup from "./SidebarNavGroup";

/** Qruplu naviqasiya: yuxarı bəndlər, açılan qruplar, aşağı bəndlər. */
export default function SidebarNav({ topNav, groups, bottomNav, open, openGroups, onToggleGroup, isActive, badgeOf }) {
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden p-3">
      {topNav.map((item) => (
        <SidebarNavLink
          key={item.href}
          item={item}
          active={isActive(item)}
          open={open}
          badge={badgeOf(item)}
        />
      ))}

      {groups.map((g) => {
        const hasActive = g.items.some((i) => isActive(i));
        // Sidebar yığılanda başlıqlar yer tutmasın — elementlər düz sıralanır.
        if (!open) {
          return g.items.map((item) => (
            <SidebarNavLink key={item.href} item={item} active={isActive(item)} open={false} badge={badgeOf(item)} />
          ));
        }
        return (
          <SidebarNavGroup
            key={g.key}
            group={g}
            expanded={openGroups[g.key] || hasActive}
            onToggle={() => onToggleGroup(g.key)}
            isActive={isActive}
            badgeOf={badgeOf}
          />
        );
      })}

      {bottomNav.length > 0 && (
        <div className="mt-2 border-t border-gray-100 pt-2">
          {bottomNav.map((item) => (
            <SidebarNavLink key={item.href} item={item} active={isActive(item)} open={open} badge={badgeOf(item)} />
          ))}
        </div>
      )}
    </nav>
  );
}
