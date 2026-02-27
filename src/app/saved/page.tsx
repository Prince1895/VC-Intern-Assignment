"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Clock, Trash2, ArrowRight } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { Modal } from "@/components/Modal";
import styles from "./SavedSearches.module.css";

interface SavedSearch {
    id: string;
    query: string;
    industry: string;
    stage: string;
    timestamp: string;
}

export default function SavedSearchesPage() {
    const [searches, setSearches] = useState<SavedSearch[]>([]);
    const [searchToDelete, setSearchToDelete] = useState<string | null>(null);
    const { showToast } = useToast();
    const router = useRouter();

    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem("vc_searches") || "[]");
        setSearches(saved);
    }, []);

    const confirmDelete = (id: string) => {
        setSearchToDelete(id);
    };

    const handleDeleteSearch = () => {
        if (!searchToDelete) return;

        const newSearches = searches.filter(s => s.id !== searchToDelete);
        localStorage.setItem("vc_searches", JSON.stringify(newSearches));
        setSearches(newSearches);
        setSearchToDelete(null);
        showToast("Search history removed", "success");
    };

    const reRunSearch = (search: SavedSearch) => {
        sessionStorage.setItem("vc_pending_search", JSON.stringify({
            query: search.query,
            industry: search.industry,
            stage: search.stage
        }));
        router.push("/companies");
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Saved Searches</h1>
                <p className={styles.subtitle}>Quickly access your frequent queries and filters.</p>
            </header>

            {searches.length === 0 ? (
                <div className={styles.emptyState}>
                    <Search size={48} className={styles.emptyIcon} />
                    <h3>No saved searches</h3>
                    <p>Save searches from the Companies directory to quickly return to them later.</p>
                    <Link href="/companies" className={`${styles.btn} ${styles.btnPrimary}`}>
                        Go to Companies
                    </Link>
                </div>
            ) : (
                <div className={styles.grid}>
                    {searches.map(search => (
                        <div key={search.id} className={styles.card}>
                            <div className={styles.cardHeader}>
                                <div className={styles.searchSummary}>
                                    {search.query ? `"${search.query}"` : "All Companies"}
                                </div>
                                <button className={styles.deleteBtn} onClick={() => confirmDelete(search.id)}>
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className={styles.filters}>
                                {search.industry !== "All" && (
                                    <span className={styles.tag}>Industry: {search.industry}</span>
                                )}
                                {search.stage !== "All" && (
                                    <span className={styles.tag}>Stage: {search.stage}</span>
                                )}
                                {search.industry === "All" && search.stage === "All" && (
                                    <span className={styles.tag}>No filters applied</span>
                                )}
                            </div>

                            <div className={styles.cardFooter}>
                                <div className={styles.timestamp}>
                                    <Clock size={12} />
                                    {new Date(search.timestamp).toLocaleDateString()}
                                </div>

                                <button className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`} onClick={() => reRunSearch(search)}>
                                    Run Search <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal
                isOpen={!!searchToDelete}
                onClose={() => setSearchToDelete(null)}
                title="Delete Saved Search"
            >
                <div>
                    <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
                        Are you sure you want to delete this saved filter?
                    </p>
                    <div className="modal-actions">
                        <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setSearchToDelete(null)}>
                            Cancel
                        </button>
                        <button className={`${styles.btn} ${styles.btnPrimary}`} style={{ backgroundColor: "var(--error)" }} onClick={handleDeleteSearch}>
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
