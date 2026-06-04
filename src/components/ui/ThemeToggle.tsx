import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
    const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

    useEffect(() => {
        document.body.classList.toggle('dark', dark);
        localStorage.setItem('theme', dark ? 'dark' : 'light');
    }, [dark]);

    // Apply saved theme on mount
    useEffect(() => {
        const saved = localStorage.getItem('theme');
        if (saved === 'dark') {
            document.body.classList.add('dark');
        }
    }, []);

    return (
        <button
            onClick={() => setDark((d) => !d)}
            className="p-2 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 transition-all"
            title={dark ? 'Modo claro' : 'Modo oscuro'}
        >
            {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
    );
}
