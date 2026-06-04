export function TermsPage() {
    return (
        <div className="max-w-3xl mx-auto px-4 py-10 space-y-8 animate-in fade-in duration-700">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Términos y Condiciones de Uso
            </h1>
            <p className="text-sm text-slate-400">Última actualización: marzo 2026</p>

            <section className="space-y-4 text-slate-700 leading-relaxed">
                <h2 className="text-xl font-bold text-slate-800">1. Aceptación de los Términos</h2>
                <p>
                    Al acceder y utilizar la Plataforma JurSoc ("la Plataforma"), aceptás estos Términos y Condiciones.
                    Si no estás de acuerdo, no debés utilizar la Plataforma.
                </p>

                <h2 className="text-xl font-bold text-slate-800">2. Descripción del Servicio</h2>
                <p>
                    JurSoc es una plataforma digital que facilita el intercambio de comisiones de cursada entre estudiantes
                    de la Facultad de Ciencias Jurídicas y Sociales de la UNLP. El servicio conecta estudiantes interesados
                    en permutar y proporciona herramientas de comunicación y coordinación.
                </p>

                <h2 className="text-xl font-bold text-slate-800">3. Registro y Cuenta</h2>
                <p>
                    Para usar la Plataforma debés crear una cuenta con información veraz y mantenerla actualizada.
                    Sos responsable de mantener la confidencialidad de tus credenciales de acceso.
                </p>

                <h2 className="text-xl font-bold text-slate-800">4. Uso Aceptable</h2>
                <ul className="list-disc pl-6 space-y-1">
                    <li>Proveer información veraz sobre tus inscripciones.</li>
                    <li>No crear solicitudes de permuta fraudulentas.</li>
                    <li>No utilizar la Plataforma para fines distintos al intercambio de comisiones.</li>
                    <li>Respetar a otros usuarios en las comunicaciones del chat.</li>
                    <li>No intentar acceder a datos de otros usuarios sin autorización.</li>
                </ul>

                <h2 className="text-xl font-bold text-slate-800">5. Responsabilidad</h2>
                <p>
                    La Plataforma actúa como intermediaria facilitando la comunicación entre estudiantes.
                    No garantizamos la concreción de ninguna permuta ni somos responsables de acuerdos entre usuarios.
                    Los intercambios deben formalizarse según los procedimientos oficiales de la Facultad.
                </p>

                <h2 className="text-xl font-bold text-slate-800">6. Propiedad Intelectual</h2>
                <p>
                    Todo el contenido de la Plataforma (diseño, código, textos) es propiedad del equipo de JurSoc
                    y está protegido por las leyes de propiedad intelectual vigentes.
                </p>

                <h2 className="text-xl font-bold text-slate-800">7. Modificaciones</h2>
                <p>
                    Nos reservamos el derecho de modificar estos términos en cualquier momento.
                    Las modificaciones serán notificadas a través de la Plataforma.
                </p>

                <h2 className="text-xl font-bold text-slate-800">8. Contacto</h2>
                <p>
                    Para consultas sobre estos términos, podés contactarnos a través de la función
                    "Reportar problema" disponible en el pie de página de la Plataforma.
                </p>
            </section>
        </div>
    );
}
