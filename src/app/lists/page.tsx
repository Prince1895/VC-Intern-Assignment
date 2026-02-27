"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import mockCompanies from "@/data/mockCompanies.json";
import { Company } from "@/lib/types";
import { List, Download, Trash2, ExternalLink } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { Modal } from "@/components/Modal";
import styles from "./ListsPage.module.css";

export default function ListsPage() {
    const [lists, setLists] = useState<Record<string, { name: string, companies: string[] }>>({});
    const [activeListId, setActiveListId] = useState<string | null>(null);
    const [customCompanies, setCustomCompanies] = useState<Company[]>([]);
    const { showToast } = useToast();

    // Modal state for deletion
    const [listToDelete, setListToDelete] = useState<string | null>(null);

    useEffect(() => {
        const savedLists = JSON.parse(localStorage.getItem("vc_lists") || "{}");
        setLists(savedLists);

        if (Object.keys(savedLists).length > 0 && !activeListId) {
            setActiveListId(Object.keys(savedLists)[0]);
        }

        const savedCustom = JSON.parse(localStorage.getItem("vc_custom_companies") || "[]");
        setCustomCompanies(savedCustom);
    }, [activeListId]);

    const confirmDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setListToDelete(id);
    };

    const handleDeleteList = () => {
        if (!listToDelete) return;

        const newLists = { ...lists };
        const listName = newLists[listToDelete].name;
        delete newLists[listToDelete];

        localStorage.setItem("vc_lists", JSON.stringify(newLists));
        setLists(newLists);

        if (activeListId === listToDelete) {
            setActiveListId(Object.keys(newLists)[0] || null);
        }

        setListToDelete(null);
        showToast(`Deleted list "${listName}"`, "success");
    };

    const removeCompany = (companyId: string) => {
        if (!activeListId) return;

        const newLists = { ...lists };
        newLists[activeListId].companies = newLists[activeListId].companies.filter(id => id !== companyId);

        localStorage.setItem("vc_lists", JSON.stringify(newLists));
        setLists(newLists);
        showToast("Company removed from list", "info");
    };

    const allCompanies = [...(mockCompanies as Company[]), ...customCompanies];

    const activeList = activeListId ? lists[activeListId] : null;
    const activeCompanies = activeList
        ? activeList.companies.map(id => allCompanies.find(c => c.id === id)).filter(Boolean) as Company[]
        : [];

    const exportCsv = () => {
        if (!activeList) return;
        const headers = ["Name", "Industry", "Stage", "Location", "URL"];
        const rows = activeCompanies.map(c => [
            `"${c.name}"`, `"${c.industry}"`, `"${c.stage}"`, `"${c.location}"`, `"${c.url}"`
        ]);
        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${activeList.name.replace(/\s+/g, '_')}_export.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportJson = () => {
        if (!activeList) return;
        const dataStr = JSON.stringify(activeCompanies, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${activeList.name.replace(/\s+/g, '_')}_export.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>My Lists</h1>
                <p className={styles.subtitle}>Manage your saved startup collections.</p>
            </header>

            <div className={styles.layout}>
                <div className={styles.sidebar}>
                    <div className={styles.sidebarHeader}>Collections</div>
                    {Object.keys(lists).length === 0 ? (
                        <div className={styles.emptySidebar}>No lists created yet.</div>
                    ) : (
                        <ul className={styles.listNav}>
                            {Object.entries(lists).map(([id, list]) => (
                                <li key={id}>
                                    <button
                                        className={`${styles.listNavItem} ${id === activeListId ? styles.listNavActive : ''}`}
                                        onClick={() => setActiveListId(id)}
                                    >
                                        <List size={16} className={styles.listIcon} />
                                        <span className={styles.listName}>{list.name}</span>
                                        <span className={styles.listCount}>{list.companies.length}</span>
                                        <button className={styles.deleteListBtn} onClick={(e) => confirmDelete(id, e)}>
                                            <Trash2 size={14} />
                                        </button>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className={styles.main}>
                    {!activeList ? (
                        <div className={styles.emptyMain}>
                            <List size={48} className={styles.emptyIcon} />
                            <h3>No list selected</h3>
                            <p>Create a list from a company profile page.</p>
                            <Link href="/companies" className={`${styles.btn} ${styles.btnPrimary}`}>
                                Browse Companies
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className={styles.listHeader}>
                                <div>
                                    <h2 className={styles.listTitle}>{activeList.name}</h2>
                                    <div className={styles.listMeta}>{activeCompanies.length} companies</div>
                                </div>

                                <div className={styles.exportActions}>
                                    <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={exportCsv}>
                                        <Download size={14} /> CSV
                                    </button>
                                    <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={exportJson}>
                                        <Download size={14} /> JSON
                                    </button>
                                </div>
                            </div>

                            <div className={styles.tableContainer}>
                                {activeCompanies.length === 0 ? (
                                    <div className={styles.emptyList}>
                                        This list is empty. Add companies from their profile pages.
                                    </div>
                                ) : (
                                    <table className={styles.table}>
                                        <thead>
                                            <tr>
                                                <th>Company</th>
                                                <th>Industry</th>
                                                <th>Stage</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {activeCompanies.map(company => (
                                                <tr key={company.id}>
                                                    <td>
                                                        <Link href={`/companies/${company.id}`} className={styles.companyName}>
                                                            {company.name}
                                                        </Link>
                                                        <a href={company.url} target="_blank" rel="noopener noreferrer" className={styles.companyUrl}>
                                                            {new URL(company.url).hostname} <ExternalLink size={12} />
                                                        </a>
                                                    </td>
                                                    <td><span className={styles.badge}>{company.industry}</span></td>
                                                    <td>{company.stage}</td>
                                                    <td>
                                                        <button className={styles.removeBtn} onClick={() => removeCompany(company.id)}>
                                                            Remove
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <Modal
                isOpen={!!listToDelete}
                onClose={() => setListToDelete(null)}
                title="Delete List"
            >
                <div>
                    <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
                        Are you sure you want to delete this list? This action cannot be undone.
                    </p>
                    <div className="modal-actions">
                        <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setListToDelete(null)}>
                            Cancel
                        </button>
                        <button className={`${styles.btn} ${styles.btnPrimary}`} style={{ backgroundColor: "var(--error)" }} onClick={handleDeleteList}>
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
