import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import itaLogo from "../assets/ita-logo.png";

export default function Navbar() {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    const links = [
        { label: "Início", href: "/dashboard" },
        { label: "Comandos", href: "/commands" },
        { label: "Satélites", href: "/satellite" },
        { label: "Constelações", href: "/constellation" },
    ];

    function handleLogout() {
        localStorage.removeItem("token");
        navigate("/login");
    }

    return (
        <header className="w-full bg-gray-900 text-white">
            <nav className="mx-auto flex max-w-6xl items-center justify-between p-4 lg:px-8">

                {/* LOGO */}
                <Link to="/dashboard" className="flex items-center gap-2">
                    <img src={itaLogo} alt="Logo" className="h-8 w-auto" />
                </Link>

                {/* DESKTOP MENU */}
                <div className="hidden lg:flex gap-8">
                    {links.map((item) => (
                        <Link key={item.label} to={item.href}
                            className="flex items-center gap-2 text-sm font-medium text-gray-200 hover:text-white transition">
                            {item.label}
                        </Link>
                    ))}
                </div>

                {/* SAIR */}
                <div className="hidden lg:block">
                    <button onClick={handleLogout}
                        className="text-sm font-medium text-red-400 hover:text-red-300 transition">
                        Encerrar sessão
                    </button>
                </div>

                {/* HAMBURGUER */}
                <button className="lg:hidden text-2xl" onClick={() => setOpen(!open)}>
                    {open ? "✕" : "☰"}
                </button>
            </nav>

            {/* MOBILE MENU */}
            {open && (
                <div className="lg:hidden border-t border-gray-800 px-4 pb-4">
                    <div className="flex flex-col gap-4 pt-4">
                        {links.map((item) => (
                            <Link key={item.label} to={item.href}
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-2 text-gray-200 hover:text-white transition">
                                {item.label}
                            </Link>
                        ))}
                        <button onClick={() => { setOpen(false); handleLogout(); }}
                            className="text-left font-medium text-red-400 hover:text-red-300 transition">
                            Encerrar sessão
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
}
