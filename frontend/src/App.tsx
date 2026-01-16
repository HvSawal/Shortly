import './App.css'
import {Toaster} from "sonner";
import {AppShell} from "@/components/shell/AppShell.tsx";
import {BrowserRouter} from "react-router-dom";
import AppRoutes from "@/AppRoutes.tsx";

export default function App() {
    return (
        <BrowserRouter>
            <AppShell>
                <AppRoutes/>
                <Toaster richColors/>
            </AppShell>
        </BrowserRouter>
    )
}
