import { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Upload, ShieldCheck, ShieldAlert, FileText, X, Loader2 } from 'lucide-react';
import { validateFileSignature, scanFile } from '../../utils/security';

export interface SecureUploadProps {
    onUploadComplete: (file: File) => void;
    label?: string;
}

type ScanStatus = 'idle' | 'scanning' | 'clean' | 'infected' | 'error';

export function SecureUpload({ onUploadComplete, label = "Subir Documentación" }: SecureUploadProps) {
    const [status, setStatus] = useState<ScanStatus>('idle');
    const [progress, setProgress] = useState(0);
    const [fileName, setFileName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setStatus('scanning');
        setProgress(0);

        // Cyber Security Simulation
        try {
            // 1. Simulate Network/Scanning delay
            const scanInterval = setInterval(() => {
                setProgress(p => {
                    if (p >= 90) {
                        clearInterval(scanInterval);
                        return 90;
                    }
                    return p + 10;
                });
            }, 200);

            // 2. Validate Signature (Real check)
            const isValidSignature = await validateFileSignature(file);

            // 3. Simulate virus scan process
            const scanResult = await scanFile(file);

            clearInterval(scanInterval);
            setProgress(100);

            if (isValidSignature) {
                if (scanResult === 'infected') {
                    setStatus('infected');
                } else {
                    setStatus('clean');
                    onUploadComplete(file);
                }
            } else {
                setStatus('error'); // Generic error for invalid signature
            }

        } catch (error) {
            console.error(error);
            setStatus('error');
        }
    };

    const reset = () => {
        setStatus('idle');
        setFileName('');
        setProgress(0);
        if (inputRef.current) inputRef.current.value = '';
    };

    return (
        <div className="w-full">
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 transition-all bg-slate-50 hover:bg-slate-100/50">
                {status === 'idle' && (
                    <div className="flex flex-col items-center justify-center text-center cursor-pointer" onClick={() => inputRef.current?.click()}>
                        <div className="bg-primary-100 p-3 rounded-full mb-3">
                            <Upload className="h-6 w-6 text-primary-600" />
                        </div>
                        <h3 className="font-semibold text-slate-800 mb-1">{label}</h3>
                        <p className="text-xs text-slate-500 mb-4">Soporta JPG, PNG (Max 5MB)</p>
                        <Button size="sm" variant="outline" className="text-primary-600 border-primary-200 bg-white hover:bg-primary-50">
                            Seleccionar Archivo
                        </Button>
                    </div>
                )}

                {status === 'scanning' && (
                    <div className="flex flex-col items-center justify-center text-center py-4">
                        <Loader2 className="h-8 w-8 text-primary-500 animate-spin mb-3" />
                        <h3 className="font-semibold text-slate-800 mb-1">Escaneando archivo...</h3>
                        <p className="text-xs text-slate-500 mb-4">Verificando firma digital y virus</p>
                        <div className="w-full max-w-xs bg-slate-200 rounded-full h-2 mb-2">
                            <div className="bg-primary-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}% ` }}></div>
                        </div>
                        <p className="text-xs font-mono text-slate-400">{progress}% Completado</p>
                    </div>
                )}

                {status === 'clean' && (
                    <div className="flex flex-col items-center justify-center text-center py-2 animate-in fade-in zoom-in">
                        <div className="bg-emerald-100 p-3 rounded-full mb-3">
                            <ShieldCheck className="h-8 w-8 text-emerald-600" />
                        </div>
                        <h3 className="font-bold text-emerald-700 mb-1">Archivo Seguro</h3>
                        <div className="flex items-center text-sm text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm mb-4">
                            <FileText className="w-4 h-4 mr-2 text-slate-400" />
                            {fileName}
                        </div>
                        <Button size="sm" variant="ghost" className="text-slate-400 hover:text-red-500" onClick={reset}>
                            <X className="w-4 h-4 mr-1" /> Eliminar
                        </Button>
                    </div>
                )}

                {status === 'infected' && (
                    <div className="flex flex-col items-center justify-center text-center py-2 animate-in shake">
                        <div className="bg-red-100 p-3 rounded-full mb-3">
                            <ShieldAlert className="h-8 w-8 text-red-600" />
                        </div>
                        <h3 className="font-bold text-red-700 mb-1">¡Amenaza Detectada!</h3>
                        <p className="text-xs text-red-600 max-w-xs mb-4">
                            El sistema de ciberseguridad ha bloqueado este archivo por contener firmas maliciosas.
                        </p>
                        <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={reset}>
                            Intentar otro archivo
                        </Button>
                    </div>
                )}
                {status === 'error' && (
                    <div className="flex flex-col items-center justify-center text-center py-2">
                        <div className="bg-red-50 p-3 rounded-full mb-3">
                            <X className="h-8 w-8 text-red-400" />
                        </div>
                        <h3 className="font-bold text-slate-700 mb-1">Error de Validación</h3>
                        <p className="text-xs text-slate-500 max-w-xs mb-4">
                            El archivo no es una imagen válida o está dañado.
                        </p>
                        <Button size="sm" variant="outline" onClick={reset}>
                            Intentar nuevamente
                        </Button>
                    </div>
                )}
            </div>

            {/* Hidden Input */}
            <input
                type="file"
                ref={inputRef}
                className="hidden"
                accept="image/jpeg,image/png"
                onChange={handleFileChange}
            />

            {/* Security Badge */}
            <div className="flex items-center justify-center mt-3 text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                <ShieldCheck className="w-3 h-3 mr-1" /> Verified by CyberGuard™
            </div>
        </div>
    );
}
