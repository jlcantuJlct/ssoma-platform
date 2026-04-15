/**
 * Cliente de Automatización de WhatsApp vía UltraMsg
 * Requiere Instance ID y Token de UltraMsg
 */

export async function sendAutomatedWhatsApp(to: string, body: string): Promise<boolean> {
    const instanceId = process.env.WHATSAPP_INSTANCE_ID;
    const token = process.env.WHATSAPP_TOKEN;

    // Si no hay configuración, saltamos silenciosamente (o log en consola)
    if (!instanceId || !token || token === 'your_token_here') {
        console.warn('⚠️ WhatsApp Automation saltado: Instance ID o Token no configurados en .env.local');
        return false;
    }

    // Limpiar el número de teléfono (quitar +, espacios, etc.)
    const cleanTo = to.replace(/\+/g, '').replace(/\s+/g, '');

    try {
        const res = await fetch(`https://api.ultramsg.com/${instanceId}/messages/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                token: token,
                to: cleanTo,
                body: body
            })
        });

        const data = await res.json();
        
        if (data.sent === 'true' || data.success) {
            console.log(`✅ WhatsApp enviado con éxito a ${cleanTo}`);
            return true;
        } else {
            console.error('❌ Error de UltraMsg:', data);
            return false;
        }
    } catch (error) {
        console.error('❌ Error enviando WhatsApp:', error);
        return false;
    }
}
