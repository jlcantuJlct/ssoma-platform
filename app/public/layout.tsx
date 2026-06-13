import { Metadata } from "next";

export const metadata: Metadata = {
    title: "TOP",
    description: "Reporte de Actos y Condiciones de Acceso Libre",
    applicationName: "TOP",
    manifest: "/manifest.json",
    appleWebApp: {
        title: "TOP",
        statusBarStyle: "black-translucent",
        capable: true,
    },
    icons: {
        icon: '/icon-192.png',
        shortcut: '/icon-192.png',
        apple: '/icon-192.png',
    }
};

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
