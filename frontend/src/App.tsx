import './App.css'
import {HomePage} from "@/pages/HomePage.tsx";
import {Toaster} from "sonner";
import {AppShell} from "@/components/shell/AppShell.tsx";

export default function App() {
    return (
        <AppShell>
            <HomePage />
            <Toaster richColors />
        </AppShell>
    )
}
