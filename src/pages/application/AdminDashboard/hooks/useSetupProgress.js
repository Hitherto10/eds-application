import { useState, useEffect } from 'react';
import { getAllStudents, getDashboardUsers } from '../../../auth/authAPIs.js';
import { getSchoolClasses } from '../services/classAPIs.js';
import { getSchoolSubjects } from '../services/subjectAPIs.js';
import { getFeeStructures } from '../services/feeAPIs.js';
import { useAcademic } from '../../../../contexts/AcademicContext.jsx';
import { ROUTES } from '../navigation/navConfig.js';

const CACHE_KEY = 'educonnect-setup-progress-v1';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * useSetupProgress — computes the school's onboarding completeness from real data.
 * A step is never "ticked" manually; it is done because the data exists.
 * Results are cached in sessionStorage so the topbar chip doesn't hammer the API.
 */
export default function useSetupProgress() {
    const { loading: academicLoading, academicYears, terms } = useAcademic();
    const [checks, setChecks] = useState(null); // { classes, subjects, staff, students, fees }
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let alive = true;

        const cached = (() => {
            try {
                const raw = JSON.parse(sessionStorage.getItem(CACHE_KEY));
                if (raw && Date.now() - raw.ts < CACHE_TTL) return raw.checks;
            } catch { /* ignore */ }
            return null;
        })();

        if (cached) {
            setChecks(cached);
            setLoading(false);
            return;
        }

        (async () => {
            const [classesRes, subjectsRes, staffRes, studentsRes, feesRes] = await Promise.allSettled([
                getSchoolClasses(),
                getSchoolSubjects(),
                getDashboardUsers('teacher'),
                getAllStudents(),
                getFeeStructures(),
            ]);

            const val = (r) => (r.status === 'fulfilled' ? r.value : null);
            const computed = {
                classes:  (val(classesRes)?.data?.classes ?? []).length > 0,
                subjects: (val(subjectsRes)?.data?.subjects ?? []).length > 0,
                staff:    (val(staffRes)?.data?.users ?? []).length > 0,
                students: (val(studentsRes)?.data?.students ?? []).length > 0,
                fees:     (val(feesRes)?.data?.structures ?? val(feesRes)?.structures ?? []).length > 0,
            };

            if (!alive) return;
            sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), checks: computed }));
            setChecks(computed);
            setLoading(false);
        })();

        return () => { alive = false; };
    }, []);

    const calendarDone = academicYears.length > 0 && terms.length > 0;

    const steps = [
        {
            id: 'calendar',
            label: 'Academic year & terms',
            hint: 'The calendar everything else hangs off',
            route: ROUTES.settingsAcademic,
            done: calendarDone,
        },
        {
            id: 'classes',
            label: 'Classes & arms',
            hint: 'Your school structure',
            route: ROUTES.classes,
            done: !!checks?.classes,
        },
        {
            id: 'subjects',
            label: 'Subjects',
            hint: 'The curriculum catalog',
            route: ROUTES.subjects,
            done: !!checks?.subjects,
        },
        {
            id: 'staff',
            label: 'Invite your staff',
            hint: 'Teachers and operators',
            route: ROUTES.staff,
            done: !!checks?.staff,
        },
        {
            id: 'students',
            label: 'Add students',
            hint: 'Enroll your learners',
            route: ROUTES.students,
            done: !!checks?.students,
        },
        {
            id: 'fees',
            label: 'Fee structures',
            hint: 'What each class is billed',
            route: ROUTES.feeStructures,
            done: !!checks?.fees,
        },
    ];

    const doneCount = steps.filter(s => s.done).length;
    const percent = Math.round((doneCount / steps.length) * 100);

    return {
        loading: loading || academicLoading,
        steps,
        percent,
        complete: doneCount === steps.length,
    };
}
