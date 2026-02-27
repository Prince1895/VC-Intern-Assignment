"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, List, Bookmark, Search, Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import styles from "./Sidebar.module.css";

export default function Sidebar() {
    const pathname = usePathname();
    const { theme, toggleTheme } = useTheme();

    const navItems = [
        { name: "Companies", href: "/companies", icon: <Building2 size={20} /> },
        { name: "My Lists", href: "/lists", icon: <List size={20} /> },
        { name: "Saved Searches", href: "/saved", icon: <Bookmark size={20} /> },
    ];

    return (
        <aside className={styles.sidebar}>
            <div className={styles.logo}>
                <div className={styles.logoIcon}>VC</div>
                <span className={styles.logoText}>Intelligence</span>
            </div>

            <div className={styles.search}>
                <Search size={16} className={styles.searchIcon} />
                <input type="text" placeholder="Global search..." className={styles.searchInput} />
                <div className={styles.shortcut}>/</div>
            </div>

            <nav className={styles.nav}>
                <div className={styles.navLabel}>Menu</div>
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navItem} ${isActive ? styles.active : ""}`}
                        >
                            {item.icon}
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className={styles.bottomSection}>
                <button onClick={toggleTheme} className={styles.themeToggle}>
                    {theme === 'dark' ? (
                        <><Sun size={18} /> <span>Switch to Light</span></>
                    ) : (
                        <><Moon size={18} /> <span>Switch to Dark</span></>
                    )}
                </button>

                <div className={styles.user}>
                    <div className={styles.avatar}>PK</div>
                    <div className={styles.userInfo}>
                        <div className={styles.userName}>Prince Kumar</div>
                        <div className={styles.userRole}>Investor</div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
