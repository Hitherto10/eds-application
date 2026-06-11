import React from 'react';
import { ClipboardList } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout.jsx';
import PagePlaceholder from '../../components/ui/PagePlaceholder.jsx';
import { ROUTES } from '../../navigation/navConfig.js';

export default function GradingPage() {
    return (
        <AdminLayout>
            <PagePlaceholder
                icon={ClipboardList}
                accent="purple"
                title="Grading & Results"
                description="School-defined grading schemes, class-at-once score entry, and a results pipeline with moderation — so every teacher's numbers mean the same thing."
                planned={[
                    'Grading scheme builder (CA/exam components, weights, grade boundaries)',
                    'Submission matrix — which sheets are in, pending, or returned',
                    'Class broadsheet (all students × all subjects, positions)',
                    'Moderation flow: submit → review → approve → publish',
                ]}
                availableToday={[
                    { label: 'Subjects setup', to: ROUTES.subjects },
                    { label: 'Classes & arms', to: ROUTES.classes },
                ]}
            />
        </AdminLayout>
    );
}
