"use client";

import { useState, useEffect, useMemo } from "react";
import mockCompanies from "@/data/mockCompanies.json";
import { Company } from "@/lib/types";
import { Search, Filter, ChevronLeft, ChevronRight, BookmarkPlus, Plus } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { Modal } from "@/components/Modal";
import styles from "./CompaniesPage.module.css";
import Link from "next/link";

const ITEMS_PER_PAGE = 10;

export default function CompaniesPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [industryFilter, setIndustryFilter] = useState("All");
    const [stageFilter, setStageFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: keyof Company; direction: 'asc' | 'desc' } | null>(null);
    const [customCompanies, setCustomCompanies] = useState<Company[]>([]);

    const { showToast } = useToast();

    // Add Startup Modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newCompany, setNewCompany] = useState<Partial<Company>>({ name: "", url: "", industry: "", stage: "", location: "" });

    useEffect(() => {
        // Check if we need to load a pending search
        const pendingSearch = sessionStorage.getItem("vc_pending_search");
        if (pendingSearch) {
            try {
                const { query, industry, stage } = JSON.parse(pendingSearch);
                if (query) setSearchQuery(query);
                if (industry) setIndustryFilter(industry);
                if (stage) setStageFilter(stage);
                sessionStorage.removeItem("vc_pending_search");
            } catch (e) {
                console.error("Failed to load pending search", e);
            }
        }

        // Load custom created companies
        const savedCustom = JSON.parse(localStorage.getItem("vc_custom_companies") || "[]");
        setCustomCompanies(savedCustom);
    }, []);

    const companies = [...(mockCompanies as Company[]), ...customCompanies];

    const industries = ["All", ...Array.from(new Set(companies.map(c => c.industry)))];
    const stages = ["All", ...Array.from(new Set(companies.map(c => c.stage)))];

    const filteredCompanies = useMemo(() => {
        return companies.filter(company => {
            const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                company.industry.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesIndustry = industryFilter === "All" || company.industry === industryFilter;
            const matchesStage = stageFilter === "All" || company.stage === stageFilter;

            return matchesSearch && matchesIndustry && matchesStage;
        });
    }, [companies, searchQuery, industryFilter, stageFilter]);

    const sortedCompanies = useMemo(() => {
        let sortableItems = [...filteredCompanies];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [filteredCompanies, sortConfig]);

    const totalPages = Math.ceil(sortedCompanies.length / ITEMS_PER_PAGE);
    const paginatedCompanies = sortedCompanies.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const requestSort = (key: keyof Company) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const saveSearch = () => {
        if (!searchQuery && industryFilter === "All" && stageFilter === "All") {
            alert("Please enter a search term or apply a filter to save.");
            return;
        }

        const searches = JSON.parse(localStorage.getItem("vc_searches") || "[]");
        const newSearch = {
            id: "search_" + Date.now(),
            query: searchQuery,
            industry: industryFilter,
            stage: stageFilter,
            timestamp: new Date().toISOString()
        };

        localStorage.setItem("vc_searches", JSON.stringify([newSearch, ...searches]));
        showToast("Search saved! View it in Saved Searches.", "success");
    };

    const handleAddCompanySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCompany.name || !newCompany.url) {
            showToast("Name and URL are required", "error");
            return;
        }

        const companyWithId: Company = {
            id: `custom_${Date.now()}`,
            name: newCompany.name as string,
            url: newCompany.url as string,
            industry: newCompany.industry || "Other",
            stage: newCompany.stage || "Unknown",
            location: newCompany.location || "Unknown",
        };

        const updatedCustom = [companyWithId, ...customCompanies];
        localStorage.setItem("vc_custom_companies", JSON.stringify(updatedCustom));
        setCustomCompanies(updatedCustom);

        setIsAddModalOpen(false);
        setNewCompany({ name: "", url: "", industry: "", stage: "", location: "" });
        showToast(`Added ${companyWithId.name} to directory`, "success");
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Companies</h1>
                    <p className={styles.subtitle}>Discover and track high-potential startups.</p>
                </div>
                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setIsAddModalOpen(true)}>
                    <Plus size={16} /> Add Startup
                </button>
            </header>

            <div className={styles.toolbar}>
                <div className={styles.searchBox}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search companies..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                        className={styles.searchInput}
                    />
                </div>

                <div className={styles.filters}>
                    <div className={styles.filterGroup}>
                        <Filter size={16} className={styles.filterIcon} />
                        <select
                            value={industryFilter}
                            onChange={(e) => {
                                setIndustryFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className={styles.select}
                        >
                            {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <Filter size={16} className={styles.filterIcon} />
                        <select
                            value={stageFilter}
                            onChange={(e) => {
                                setStageFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className={styles.select}
                        >
                            {stages.map(stage => <option key={stage} value={stage}>{stage}</option>)}
                        </select>
                    </div>

                    <button onClick={saveSearch} className={styles.saveSearchBtn} title="Save this search">
                        <BookmarkPlus size={16} /> Save
                    </button>
                </div>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th onClick={() => requestSort('name')}>Company {sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                            <th onClick={() => requestSort('industry')}>Industry {sortConfig?.key === 'industry' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                            <th onClick={() => requestSort('stage')}>Stage {sortConfig?.key === 'stage' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                            <th onClick={() => requestSort('location')}>Location {sortConfig?.key === 'location' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedCompanies.length > 0 ? (
                            paginatedCompanies.map(company => (
                                <tr key={company.id}>
                                    <td>
                                        <Link href={`/companies/${company.id}`} className={styles.companyName}>
                                            {company.name}
                                        </Link>
                                        <div className={styles.companyUrl}>{new URL(company.url).hostname}</div>
                                    </td>
                                    <td><span className={styles.badge}>{company.industry}</span></td>
                                    <td>{company.stage}</td>
                                    <td>{company.location}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className={styles.emptyState}>No companies found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className={styles.pagination}>
                <div className={styles.pageInfo}>
                    Showing {paginatedCompanies.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} to {Math.min(currentPage * ITEMS_PER_PAGE, sortedCompanies.length)} of {sortedCompanies.length} result(s)
                </div>
                <div className={styles.pageControls}>
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                        className={styles.pageBtn}
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className={styles.pageCurrent}>{currentPage} / {Math.max(1, totalPages)}</span>
                    <button
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                        className={styles.pageBtn}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Add New Startup"
            >
                <form onSubmit={handleAddCompanySubmit} className="modal-form">
                    <div className="form-group">
                        <label>Company Name *</label>
                        <input
                            required
                            type="text"
                            className="form-input"
                            placeholder="e.g. Acme Corp"
                            value={newCompany.name}
                            onChange={e => setNewCompany({ ...newCompany, name: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Website URL *</label>
                        <input
                            required
                            type="url"
                            className="form-input"
                            placeholder="https://acme.com"
                            value={newCompany.url}
                            onChange={e => setNewCompany({ ...newCompany, url: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Industry</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. AI, SaaS, FinTech"
                            value={newCompany.industry}
                            onChange={e => setNewCompany({ ...newCompany, industry: e.target.value })}
                        />
                    </div>
                    <div style={{ display: "flex", gap: "16px" }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Funding Stage</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g. Seed, Series A"
                                value={newCompany.stage}
                                onChange={e => setNewCompany({ ...newCompany, stage: e.target.value })}
                            />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Location</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g. San Francisco, CA"
                                value={newCompany.location}
                                onChange={e => setNewCompany({ ...newCompany, location: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setIsAddModalOpen(false)}>
                            Cancel
                        </button>
                        <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
                            Save Startup
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
