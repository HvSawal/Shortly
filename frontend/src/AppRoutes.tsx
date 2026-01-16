import {Navigate, Routes, Route} from "react-router-dom";
import {HomePage} from "@/pages/HomePage.tsx";
import PerformanceDashboard from "@/pages/PerformanceDashboard.tsx";

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/docs/performance" element={<PerformanceDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
