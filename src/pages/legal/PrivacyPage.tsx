export function PrivacyPage() {
    return (
        <div className="max-w-3xl mx-auto px-4 py-10 space-y-8 animate-in fade-in duration-700">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Política de Privacidad
            </h1>
            <p className="text-sm text-slate-400">Última actualización: marzo 2026</p>

            <section className="space-y-4 text-slate-700 leading-relaxed">
                <h2 className="text-xl font-bold text-slate-800">1. Información que Recopilamos</h2>
                <p>Cuando utilizás JurSoc, recopilamos:</p>
                <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Datos de registro:</strong> nombre, correo electrónico y contraseña (almacenada de forma segura con hash).</li>
                    <li><strong>Datos académicos:</strong> materias inscriptas, comisiones de cursada.</li>
                    <li><strong>Datos de uso:</strong> solicitudes de permuta, mensajes de chat, reseñas y calificaciones.</li>
                    <li><strong>Datos técnicos:</strong> información del dispositivo y navegador para mejorar el servicio.</li>
                </ul>

                <h2 className="text-xl font-bold text-slate-800">2. Cómo Usamos tu Información</h2>
                <ul className="list-disc pl-6 space-y-1">
                    <li>Permitir el funcionamiento del sistema de matching de permutas.</li>
                    <li>Facilitar la comunicación entre usuarios matched.</li>
                    <li>Calcular reputación basada en reseñas.</li>
                    <li>Enviar notificaciones sobre tus solicitudes y matches.</li>
                    <li>Mejorar la experiencia de usuario y el rendimiento de la Plataforma.</li>
                </ul>

                <h2 className="text-xl font-bold text-slate-800">3. Almacenamiento y Seguridad</h2>
                <p>
                    Tus datos se almacenan en servidores seguros proporcionados por Convex.
                    Las contraseñas se almacenan con hash criptográfico y nunca en texto plano.
                    Implementamos validación server-side en todas las operaciones para prevenir accesos no autorizados.
                </p>

                <h2 className="text-xl font-bold text-slate-800">4. Compartición de Datos</h2>
                <p>
                    No vendemos ni compartimos tus datos personales con terceros. Tu información solo es visible
                    para otros usuarios en el contexto de una permuta (nombre y comisión cuando hay un match confirmado).
                </p>

                <h2 className="text-xl font-bold text-slate-800">5. Tus Derechos</h2>
                <p>Tenés derecho a:</p>
                <ul className="list-disc pl-6 space-y-1">
                    <li>Acceder a tus datos personales.</li>
                    <li>Rectificar información incorrecta.</li>
                    <li>Solicitar la eliminación de tu cuenta y datos asociados.</li>
                    <li>Solicitar la portabilidad de tus datos.</li>
                </ul>

                <h2 className="text-xl font-bold text-slate-800">6. Cookies y Almacenamiento Local</h2>
                <p>
                    Utilizamos almacenamiento local del navegador para mantener tu sesión activa y preferencias
                    de la interfaz (como el modo oscuro). No utilizamos cookies de seguimiento de terceros.
                </p>

                <h2 className="text-xl font-bold text-slate-800">7. Menores de Edad</h2>
                <p>
                    La Plataforma está destinada a estudiantes universitarios. No recopilamos intencionalmente
                    datos de menores de 18 años.
                </p>

                <h2 className="text-xl font-bold text-slate-800">8. Cambios en esta Política</h2>
                <p>
                    Podemos actualizar esta política periódicamente. Te notificaremos sobre cambios significativos
                    a través de la Plataforma.
                </p>

                <h2 className="text-xl font-bold text-slate-800">9. Contacto</h2>
                <p>
                    Para ejercer tus derechos o consultas sobre privacidad, contactanos a través de
                    la función "Reportar problema" en la Plataforma.
                </p>
            </section>
        </div>
    );
}
