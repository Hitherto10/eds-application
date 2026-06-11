import React from 'react';
import { FileBadge } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout.jsx';
import PagePlaceholder from '../../components/ui/PagePlaceholder.jsx';
import { ROUTES } from '../../navigation/navConfig.js';

export default function ReportCardsPage() {
    return (
        <AdminLayout>
            <PagePlaceholder
                icon={FileBadge}
                accent="amber"
                title="Report Cards"
                description="School-branded terminal reports generated from approved results and attendance — reviewed by class teachers, signed off by the principal, published to parents."
                planned={[
                    'Template builder with live preview (your crest, your blocks)',
                    'Class-teacher comments & trait ratings worklist',
                    'Generation console with prerequisite checks per arm',
                    'Principal sign-off, parent publishing, and batch print',
                ]}
                availableToday={[
                    { label: 'Grading & Results', to: ROUTES.grading },
                    { label: 'School identity (crest & branding)', to: ROUTES.settingsIdentity },
                ]}
            />
        </AdminLayout>
    );
}
