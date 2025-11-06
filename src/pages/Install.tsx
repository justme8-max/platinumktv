import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Smartphone, Download, Check } from "lucide-react";
import { Link } from "react-router-dom";

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for beforeinstallprompt event (Android/Desktop)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 rounded-3xl bg-gradient-primary flex items-center justify-center shadow-lg">
              <Music className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl">Install Aplikasi</CardTitle>
          <CardDescription className="text-base">
            Install Platinum High KTV Enterprise di perangkat Anda untuk pengalaman terbaik
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isInstalled ? (
            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-lg font-semibold">Aplikasi Sudah Terinstall!</p>
              <p className="text-muted-foreground">
                Anda dapat mengakses aplikasi dari home screen perangkat Anda.
              </p>
              <Link to="/dashboard">
                <Button className="w-full">Buka Dashboard</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Smartphone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Akses Offline</h3>
                    <p className="text-sm text-muted-foreground">
                      Gunakan aplikasi bahkan tanpa koneksi internet
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Download className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Lebih Cepat</h3>
                    <p className="text-sm text-muted-foreground">
                      Loading lebih cepat dan performa lebih baik
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Music className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Seperti Aplikasi Native</h3>
                    <p className="text-sm text-muted-foreground">
                      Pengalaman seperti aplikasi asli dari home screen
                    </p>
                  </div>
                </div>
              </div>

              {isIOS ? (
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                  <p className="font-semibold text-sm">Cara Install di iOS:</p>
                  <ol className="text-sm space-y-2 text-muted-foreground">
                    <li>1. Tap tombol <strong>Share</strong> (ikon kotak dengan panah ke atas) di Safari</li>
                    <li>2. Scroll ke bawah dan pilih <strong>"Add to Home Screen"</strong></li>
                    <li>3. Tap <strong>"Add"</strong> di pojok kanan atas</li>
                  </ol>
                </div>
              ) : deferredPrompt ? (
                <Button onClick={handleInstall} className="w-full" size="lg">
                  <Download className="mr-2 h-5 w-5" />
                  Install Sekarang
                </Button>
              ) : (
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                  <p className="font-semibold text-sm">Cara Install di Android:</p>
                  <ol className="text-sm space-y-2 text-muted-foreground">
                    <li>1. Buka menu browser (⋮ di pojok kanan atas)</li>
                    <li>2. Pilih <strong>"Install app"</strong> atau <strong>"Add to Home screen"</strong></li>
                    <li>3. Tap <strong>"Install"</strong></li>
                  </ol>
                </div>
              )}

              <Link to="/login" className="block">
                <Button variant="outline" className="w-full">
                  Lanjutkan di Browser
                </Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}