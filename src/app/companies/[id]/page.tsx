"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import mockCompanies from "@/data/mockCompanies.json";
import { Company, EnrichmentData } from "@/lib/types";
import { ArrowLeft, ExternalLink, Sparkles, Save, Check, Plus, BookmarkPlus } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { Modal } from "@/components/Modal";
import styles from "./CompanyProfile.module.css";

export default function CompanyProfile() {
    const params = useParams();
    const router = useRouter();
    const { showToast } = useToast();
    const companyId = params.id as string;

    const [company, setCompany] = useState<Company | null>(null);
    const [isEnriching, setIsEnriching] = useState(false);
    const [enrichmentData, setEnrichmentData] = useState<EnrichmentData | null>(null);
    const [note, setNote] = useState("");
    const [savedNote, setSavedNote] = useState("");
    const [isSaved, setIsSaved] = useState(false);
    const [showLists, setShowLists] = useState(false);
    const [userLists, setUserLists] = useState<{ id: string, name: string }[]>([]);

    // Modal states
    const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false);
    const [newListName, setNewListName] = useState("");

    useEffect(() => {
        let found = mockCompanies.find(c => c.id === companyId) as Company | undefined;

        if (!found) {
            const savedCustom = JSON.parse(localStorage.getItem("vc_custom_companies") || "[]");
            found = savedCustom.find((c: Company) => c.id === companyId);
        }

        if (!found) {
            router.push("/companies");
            return;
        }
        setCompany(found);

        // Load note
        const storedNotes = JSON.parse(localStorage.getItem("vc_notes") || "{}");
        if (storedNotes[companyId]) {
            setNote(storedNotes[companyId]);
            setSavedNote(storedNotes[companyId]);
        }

        // Load enrichment cache
        const storedEnrichment = JSON.parse(localStorage.getItem("vc_enrichment") || "{}");
        if (storedEnrichment[found.url]) {
            setEnrichmentData(storedEnrichment[found.url]);
        }

        // Load lists to check if saved
        const lists = JSON.parse(localStorage.getItem("vc_lists") || "{}");
        const listsArray = Object.keys(lists).map(id => ({ id, name: lists[id].name, companies: lists[id].companies }));
        setUserLists(listsArray);

        const isCompanyInAnyList = listsArray.some(list => list.companies.includes(companyId));
        setIsSaved(isCompanyInAnyList);

    }, [companyId, router]);

    const saveNote = () => {
        const storedNotes = JSON.parse(localStorage.getItem("vc_notes") || "{}");
        storedNotes[companyId] = note;
        localStorage.setItem("vc_notes", JSON.stringify(storedNotes));
        setSavedNote(note);
        showToast("Note saved successfully", "success");
    };

    const handleEnrich = async () => {
        if (!company) return;
        setIsEnriching(true);

        try {
            const res = await fetch("/api/enrich", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: company.url })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || "Enrichment failed");
            }

            const data = await res.json();
            setEnrichmentData(data);

            // Cache the result
            const storedEnrichment = JSON.parse(localStorage.getItem("vc_enrichment") || "{}");
            storedEnrichment[company.url] = data;
            localStorage.setItem("vc_enrichment", JSON.stringify(storedEnrichment));
            showToast("Company signals enriched successfully", "success");

        } catch (error: any) {
            console.error("Enrichment error:", error);
            showToast(`Enrichment failed: ${error.message}`, "error");
        } finally {
            setIsEnriching(false);
        }
    };

    const addToList = (listId: string) => {
        const lists = JSON.parse(localStorage.getItem("vc_lists") || "{}");
        if (!lists[listId].companies.includes(companyId)) {
            lists[listId].companies.push(companyId);
            localStorage.setItem("vc_lists", JSON.stringify(lists));
            setIsSaved(true);
            showToast(`Added to ${lists[listId].name}`, "success");
        }
        setShowLists(false);
    };

    const handleCreateListSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newListName.trim()) return;

        const lists = JSON.parse(localStorage.getItem("vc_lists") || "{}");
        const listId = "list_" + Date.now();
        lists[listId] = { name: newListName.trim(), companies: [companyId] };
        localStorage.setItem("vc_lists", JSON.stringify(lists));

        setUserLists([...userLists, { id: listId, name: newListName.trim() }]);
        setIsSaved(true);
        setShowLists(false);
        setIsCreateListModalOpen(false);
        setNewListName("");
        showToast(`Created new list "${newListName}"`, "success");
    };

    if (!company) return <div className={styles.loading}>Loading...</div>;

    return (
        <div className={styles.container}>
            <Link href="/companies" className={styles.backLink}>
                <ArrowLeft size={16} />
                Back to Companies
            </Link>

            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.title}>{company.name}</h1>
                    <a href={company.url} target="_blank" rel="noopener noreferrer" className={styles.urlLink}>
                        {new URL(company.url).hostname} <ExternalLink size={14} />
                    </a>
                    <div className={styles.badges}>
                        <span className={styles.badge}>{company.industry}</span>
                        <span className={styles.badge}>{company.stage}</span>
                        <span className={styles.badge}>{company.location}</span>
                    </div>
                </div>

                <div className={styles.headerActions}>
                    <div className={styles.dropdownContainer}>
                        <button
                            className={`${styles.btn} ${styles.btnSecondary}`}
                            onClick={() => setShowLists(!showLists)}
                        >
                            {isSaved ? <Check size={16} /> : <BookmarkPlus size={16} />}
                            {isSaved ? "Saved" : "Save to List"}
                        </button>

                        {showLists && (
                            <div className={styles.dropdown}>
                                {userLists.length > 0 && userLists.map(list => (
                                    <button key={list.id} className={styles.dropdownItem} onClick={() => addToList(list.id)}>
                                        {list.name}
                                    </button>
                                ))}
                                浅{userLists.length > 0 && <div className={styles.dropdownDivider}></div>}
                                <button className={styles.dropdownItem} onClick={() => {
                                    setIsCreateListModalOpen(true);
                                    setShowLists(false);
                                }}>
                                    <Plus size={14} /> Create new list...
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        onClick={handleEnrich}
                        disabled={isEnriching}
                    >
                        <Sparkles size={16} />
                        {isEnriching ? "Enriching..." : enrichmentData ? "Re-enrich" : "Enrich"}
                    </button>
                </div>
            </header>

            <div className={styles.grid}>
                <div className={styles.mainColumn}>
                    {/* Enrichment Results */}
                    <section className={styles.card}>
                        <h2 className={styles.cardTitle}>
                            <Sparkles size={18} className={styles.titleIcon} />
                            AI Enrichment Profile
                        </h2>

                        {!enrichmentData ? (
                            <div className={styles.emptyEnrichment}>
                                <p>Click "Enrich" to fetch live data from {company.name}&apos;s website.</p>
                                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleEnrich} disabled={isEnriching}>
                                    {isEnriching ? "Enriching..." : "Start Enrichment"}
                                </button>
                            </div>
                        ) : (
                            <div className={styles.enrichmentContent}>
                                <div className={styles.section}>
                                    <h3 className={styles.sectionLabel}>Summary</h3>
                                    <p className={styles.summaryText}>{enrichmentData.summary}</p>
                                </div>

                                <div className={styles.section}>
                                    <h3 className={styles.sectionLabel}>What they do</h3>
                                    <ul className={styles.list}>
                                        {enrichmentData.whatTheyDo.map((item, i) => (
                                            <li key={i}>{item}</li>
                                        ))}
                                    </ul>
                                </div>

                                <div className={styles.sectionRow}>
                                    <div className={styles.sectionHalf}>
                                        <h3 className={styles.sectionLabel}>Keywords</h3>
                                        <div className={styles.keywordTags}>
                                            {enrichmentData.keywords.map((kw, i) => (
                                                <span key={i} className={styles.keywordTag}>{kw}</span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className={styles.sectionHalf}>
                                        <h3 className={styles.sectionLabel}>Derived Signals</h3>
                                        <ul className={styles.signalList}>
                                            {enrichmentData.derivedSignals.map((signal, i) => (
                                                <li key={i} className={styles.signalItem}>
                                                    <Sparkles size={12} className={styles.signalIcon} />
                                                    {signal}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div className={styles.sources}>
                                    <span className={styles.sourcesLabel}>Sources:</span>
                                    {enrichmentData.sources.map((s, i) => (
                                        <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className={styles.sourceLink}>
                                            {new URL(s.url).pathname !== '/' ? new URL(s.url).pathname : new URL(s.url).hostname}
                                        </a>
                                    ))}
                                    <span className={styles.timestamp}>
                                        (Updated {new Date(enrichmentData.sources[0]?.timestamp).toLocaleDateString()})
                                    </span>
                                </div>
                            </div>
                        )}
                    </section>
                </div>

                <div className={styles.sideColumn}>
                    {/* Notes */}
                    <section className={styles.card}>
                        <h2 className={styles.cardTitle}>Notes</h2>
                        <textarea
                            className={styles.notesArea}
                            placeholder="Add investment thesis, team thoughts, etc..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                        <div className={styles.notesFooter}>
                            {note !== savedNote && <span className={styles.unsaved}>Unsaved changes</span>}
                            {note === savedNote && note !== "" && <span className={styles.saved}><Check size={12} /> Saved</span>}
                            <button
                                className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
                                onClick={saveNote}
                                disabled={note === savedNote}
                            >
                                <Save size={14} /> Save Note
                            </button>
                        </div>
                    </section>

                    {/* timeline */}
                    <section className={styles.card}>
                        <h2 className={styles.cardTitle}>Timeline Activity</h2>
                        <div className={styles.timeline}>
                            <div className={styles.timelineItem}>
                                <div className={styles.timelineDot}></div>
                                <div className={styles.timelineContent}>
                                    <div className={styles.timelineDate}>Today</div>
                                    <div className={styles.timelineText}>Profile viewed</div>
                                </div>
                            </div>
                            <div className={styles.timelineItem}>
                                <div className={styles.timelineDot}></div>
                                <div className={styles.timelineContent}>
                                    <div className={styles.timelineDate}>1 month ago</div>
                                    <div className={styles.timelineText}>Series funding announced (Estimated)</div>
                                </div>
                            </div>
                            <div className={styles.timelineItem}>
                                <div className={styles.timelineDot}></div>
                                <div className={styles.timelineContent}>
                                    <div className={styles.timelineDate}>3 months ago</div>
                                    <div className={styles.timelineText}>Added to YC W23 List</div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            <Modal
                isOpen={isCreateListModalOpen}
                onClose={() => setIsCreateListModalOpen(false)}
                title="Create New List"
            >
                <form onSubmit={handleCreateListSubmit} className="modal-form">
                    <div className="form-group">
                        <label htmlFor="listName">List Name</label>
                        <input
                            id="listName"
                            type="text"
                            className="form-input"
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                            placeholder="e.g. Q3 SaaS Targets"
                            autoFocus
                        />
                    </div>
                    <div className="modal-actions">
                        <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setIsCreateListModalOpen(false)}>
                            Cancel
                        </button>
                        <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={!newListName.trim()}>
                            Create & Add
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
