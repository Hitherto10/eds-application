import { useState, useEffect } from 'react';
import { getSchoolProfile } from '../../../auth/authAPIs.js';

const CACHE_KEY = 'educonnect-school-brand-v1';
const CACHE_TTL = 24 * 60 * 60 * 1000; // refresh daily

/**
 * useSchoolBrand — the school's name/ID for the sidebar branding block.
 * Cached in localStorage so the layout doesn't refetch on every page mount.
 */
export default function useSchoolBrand() {
    const [brand, setBrand] = useState(() => {
        try {
            const raw = JSON.parse(localStorage.getItem(CACHE_KEY));
            if (raw && Date.now() - raw.ts < CACHE_TTL) return raw.brand;
        } catch { /* ignore */ }
        return null;
    });

    useEffect(() => {
        if (brand) return;
        let alive = true;
        (async () => {
            try {
                const res = await getSchoolProfile();
                const school = res?.data?.school;
                if (!school || !alive) return;
                const next = {
                    name: school.schoolName ?? 'Your school',
                    schoolId: school.schoolId ?? '',
                    type: school.schoolType ?? '',
                };
                localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), brand: next }));
                setBrand(next);
            } catch { /* branding is decorative — fail silently */ }
        })();
        return () => { alive = false; };
    }, [brand]);

    return brand;
}
