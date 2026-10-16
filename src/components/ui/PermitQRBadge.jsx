import React, { useState, useRef, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, QrCode, ScanLine, Download } from 'lucide-react';

function QRViewerModal({ permit, onClose, t }) {
  const qrValue = `HSE-PTW:${permit.id}|${permit.type}|${permit.location || ''}|${permit.status}|${permit.createdAt || ''}`;

  const handleDownload = () => {
    const svg = document.getElementById('permit-qr-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 240; canvas.height = 240;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 240, 240);
      ctx.drawImage(img, 0, 0);
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `permit-${permit.id}-qr.png`;
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-xl z-[200] flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-white/95 dark:bg-gray-900/95 rounded-3xl p-7 max-w-[280px] w-full shadow-2xl border border-black/10 dark:border-white/20 animate-in zoom-in-90 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-sm">{t('qrCodeTitle')}</h3>
            <p className="text-[10px] opacity-50 mt-0.5 font-mono text-slate-700 dark:text-white/70">{permit.id}</p>
          </div>
          <button
            onClick={onClose}
            className="bg-black/10 dark:bg-white/10 p-2 rounded-full text-slate-700 dark:text-white hover:bg-black/20 transition-all"
          >
            <X size={16}/>
          </button>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-inner mx-auto w-fit border border-black/5">
          <QRCodeSVG
            id="permit-qr-svg"
            value={qrValue}
            size={200}
            level="H"
            includeMargin={false}
            bgColor="#ffffff"
            fgColor="#1e1b4b"
          />
        </div>

        <div className="mt-4 text-center space-y-1">
          <p className="text-[10px] font-bold text-slate-700 dark:text-white/80 truncate">{permit.type}</p>
          <p className="text-[9px] opacity-40 text-slate-700 dark:text-white truncate">{permit.location}</p>
        </div>

        <button
          onClick={handleDownload}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition-all"
        >
          <Download size={13}/> {t('qrDownload')}
        </button>
      </div>
    </div>
  );
}

function QRScannerModal({ onScan, onClose, t }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [found, setFound] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let stream = null;
    const startScan = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setScanning(true);
        }
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
            setScanning(true);
          }
        } catch {
          setError(t('qrCameraError'));
        }
      }
    };
    startScan();
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const tick = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      import('jsqr').then(({ default: jsQR }) => {
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
        if (code?.data) {
          setFound(code.data);
          if (code.data.startsWith('HSE-PTW:')) {
            onScan(code.data);
            return;
          }
        }
      }).catch(() => {});
    }
    animFrameRef.current = requestAnimationFrame(tick);
  }, [onScan]);

  useEffect(() => {
    if (!scanning) return;
    animFrameRef.current = requestAnimationFrame(tick);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [scanning, tick]);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex flex-col items-center justify-center">
      {error ? (
        <div className="text-white text-center p-8 max-w-xs">
          <QrCode size={48} className="mx-auto mb-4 opacity-40" />
          <p className="text-sm font-bold mb-6 opacity-80">{error}</p>
          <button onClick={onClose} className="bg-white/20 hover:bg-white/30 px-8 py-2.5 rounded-xl font-bold text-white text-sm transition-all">
            {t('closeBtn')}
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center w-full max-w-sm px-6">
          <div className="relative w-full aspect-square mb-6">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-3xl" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-52 h-52 relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl"></div>
                <div className="absolute inset-x-0 top-1/2 h-0.5 bg-red-500/70 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
              </div>
            </div>
          </div>

          {found && !found.startsWith('HSE-PTW:') && (
            <p className="text-amber-300 text-xs font-bold mb-3 text-center px-4">
              QR detected but not an HSE permit. Try again.
            </p>
          )}

          <p className="text-white text-sm font-bold animate-pulse mb-4">{t('qrScanning')}</p>

          <button
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 px-8 py-2.5 rounded-xl font-bold text-white text-sm transition-all"
          >
            {t('closeBtn')}
          </button>
        </div>
      )}
    </div>
  );
}

export function PermitQRBadge({ permit, t }) {
  const [showQR, setShowQR] = useState(false);
  return (
    <>
      <button
        onClick={e => { e.stopPropagation(); setShowQR(true); }}
        className="p-1.5 rounded-lg bg-white/10 dark:bg-black/20 border border-black/10 dark:border-white/10 hover:bg-indigo-500/20 hover:border-indigo-500/30 transition-all text-slate-700 dark:text-white"
        title={t('qrCodeTitle')}
      >
        <QrCode size={14}/>
      </button>
      {showQR && <QRViewerModal permit={permit} onClose={() => setShowQR(false)} t={t} />}
    </>
  );
}

export function QRScanButton({ onScanResult, t }) {
  const [showScanner, setShowScanner] = useState(false);
  const handleScan = useCallback((data) => {
    setShowScanner(false);
    if (onScanResult) onScanResult(data);
  }, [onScanResult]);
  return (
    <>
      <button
        onClick={() => setShowScanner(true)}
        className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 px-3 py-2 rounded-xl text-[10px] font-bold transition-all"
      >
        <ScanLine size={13}/> {t('qrScanBtn')}
      </button>
      {showScanner && <QRScannerModal onScan={handleScan} onClose={() => setShowScanner(false)} t={t} />}
    </>
  );
}
