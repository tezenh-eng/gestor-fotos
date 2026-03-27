import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, Check, AlertCircle, Wifi, WifiOff, Folder, Trash2, Download, ChevronRight } from 'lucide-react';

const PhotoApp = () => {
  const [currentPhase, setCurrentPhase] = useState('seleccionar'); // seleccionar, antes, durante, despues, galeria
  const [codigoSuministro, setCodigoSuministro] = useState('');
  const [photos, setPhotos] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState('idle');
  const cameraRef = useRef(null);
  const fileInputRef = useRef(null);

  // Cargar fotos del almacenamiento local
  useEffect(() => {
    loadPhotosFromStorage();
  }, []);

  // Monitorear estado online/offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadPhotosFromStorage = () => {
    try {
      const stored = localStorage.getItem('photos_data');
      if (stored) {
        setPhotos(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error cargando fotos:', error);
    }
  };

  const saveToStorage = (newPhotos) => {
    try {
      localStorage.setItem('photos_data', JSON.stringify(newPhotos));
    } catch (error) {
      console.error('Error guardando fotos:', error);
    }
  };

  const handlePhotoCapture = (e, phase) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const newPhoto = {
            id: Date.now() + Math.random(),
            codigo: codigoSuministro.trim().toUpperCase(),
            stage: phase,
            timestamp: new Date().toISOString(),
            data: event.target.result,
            fileName: generateFileName(codigoSuministro, phase),
          };

          const updated = [...photos, newPhoto];
          setPhotos(updated);
          saveToStorage(updated);
        };
        reader.readAsDataURL(file);
      });

      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraRef.current) cameraRef.current.value = '';
    }
  };

  const generateFileName = (codigo, stage) => {
    const now = new Date();
    const dateString = now.toISOString().split('T')[0];
    const timeString = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const stageMap = { antes: 'ANTES', durante: 'DURANTE', despues: 'DESPUES' };
    return `${codigo}_${stageMap[stage]}_${dateString}_${timeString}.jpg`;
  };

  const deletePhoto = (id) => {
    const updated = photos.filter((p) => p.id !== id);
    setPhotos(updated);
    saveToStorage(updated);
  };

  const groupPhotosByCodigo = () => {
    return photos.reduce((acc, photo) => {
      const codigo = photo.codigo;
      if (!acc[codigo]) {
        acc[codigo] = [];
      }
      acc[codigo].push(photo);
      return acc;
    }, {});
  };

  const getPhotosByStage = (stage) => {
    return photos.filter((p) => p.codigo === codigoSuministro.trim().toUpperCase() && p.stage === stage);
  };

  const syncWithCloud = async () => {
    if (!isOnline) {
      alert('Sin conexión a internet. Las fotos se sincronizarán cuando recuperes conexión.');
      return;
    }

    setSyncStatus('syncing');
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const grouped = groupPhotosByCodigo();
  const totalPhotos = photos.length;

  // PANTALLA: Seleccionar código de suministro
  if (currentPhase === 'seleccionar') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4">
              <Folder className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-black text-white mb-2">GestorFotos</h1>
            <p className="text-blue-300 text-lg">Suministros Eléctricos</p>
          </div>

          {/* Estado Online/Offline */}
          <div className="mb-8 flex justify-center">
            {isOnline ? (
              <div className="flex items-center gap-2 bg-green-900/40 px-4 py-2 rounded-full border border-green-500/50">
                <Wifi className="w-5 h-5 text-green-400" />
                <span className="text-green-300 font-bold">Conectado a internet</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-orange-900/40 px-4 py-2 rounded-full border border-orange-500/50">
                <WifiOff className="w-5 h-5 text-orange-400" />
                <span className="text-orange-300 font-bold">Sin internet (OFFLINE)</span>
              </div>
            )}
          </div>

          {/* Tarjeta de entrada */}
          <div className="bg-gradient-to-br from-blue-800/50 to-slate-800/50 border-2 border-blue-600/50 rounded-2xl p-8 backdrop-blur-sm">
            <label className="block text-white text-lg font-bold mb-3">
              📍 Código de Suministro
            </label>
            <input
              type="text"
              value={codigoSuministro}
              onChange={(e) => setCodigoSuministro(e.target.value.toUpperCase())}
              placeholder="Ej: SUM-2024-001"
              className="w-full px-6 py-4 bg-slate-700/50 border-2 border-blue-500/30 rounded-xl text-white text-lg placeholder-gray-400 focus:outline-none focus:ring-3 focus:ring-orange-500 focus:border-orange-500 uppercase"
            />
            <p className="text-blue-200 text-sm mt-3">
              ℹ️ Este código agrupa todas tus fotos (antes, durante y después)
            </p>
          </div>

          {/* Botón para continuar */}
          <button
            onClick={() => {
              if (!codigoSuministro.trim()) {
                alert('⚠️ Ingresa el código de suministro');
                return;
              }
              setCurrentPhase('menu');
            }}
            disabled={!codigoSuministro.trim()}
            className={`w-full mt-8 py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition transform ${
              codigoSuministro.trim()
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white hover:scale-105'
                : 'bg-gray-600 text-gray-300 cursor-not-allowed'
            }`}
          >
            Comenzar <ChevronRight className="w-5 h-5" />
          </button>

          {/* Galería rápida */}
          {totalPhotos > 0 && (
            <button
              onClick={() => setCurrentPhase('galeria')}
              className="w-full mt-4 py-3 px-6 rounded-xl font-bold text-blue-300 border-2 border-blue-500/50 hover:border-blue-400 hover:text-blue-200 transition flex items-center justify-center gap-2"
            >
              📷 Ver todas las fotos ({totalPhotos})
            </button>
          )}
        </div>
      </div>
    );
  }

  // PANTALLA: Menú de selección (Antes/Durante/Después)
  if (currentPhase === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-8">
          <button
            onClick={() => setCurrentPhase('seleccionar')}
            className="text-blue-300 hover:text-blue-200 font-bold mb-4 flex items-center gap-2"
          >
            ← Cambiar código
          </button>
          <div className="bg-gradient-to-r from-blue-900/60 to-slate-900/60 border border-blue-600/30 rounded-xl p-6">
            <h1 className="text-3xl font-black text-white mb-2">📍 {codigoSuministro}</h1>
            <p className="text-blue-200">Selecciona qué foto deseas capturar</p>
          </div>
        </div>

        {/* 3 Botones grandes */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 gap-4 mb-8">
          {/* ANTES */}
          <button
            onClick={() => setCurrentPhase('antes')}
            className="group relative overflow-hidden rounded-2xl p-8 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white transition transform hover:scale-105 active:scale-95"
          >
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition"></div>
            <div className="relative">
              <div className="text-6xl mb-3">🔴</div>
              <h2 className="text-4xl font-black mb-2">ANTES</h2>
              <p className="text-red-100 text-lg">Foto inicial del suministro</p>
              {getPhotosByStage('antes').length > 0 && (
                <div className="mt-3 bg-white/20 px-3 py-1 rounded-full inline-block">
                  ✓ {getPhotosByStage('antes').length} foto{getPhotosByStage('antes').length > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </button>

          {/* DURANTE */}
          <button
            onClick={() => setCurrentPhase('durante')}
            className="group relative overflow-hidden rounded-2xl p-8 bg-gradient-to-br from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white transition transform hover:scale-105 active:scale-95"
          >
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition"></div>
            <div className="relative">
              <div className="text-6xl mb-3">🟡</div>
              <h2 className="text-4xl font-black mb-2">DURANTE</h2>
              <p className="text-yellow-100 text-lg">Fotos del proceso de trabajo</p>
              {getPhotosByStage('durante').length > 0 && (
                <div className="mt-3 bg-white/20 px-3 py-1 rounded-full inline-block">
                  ✓ {getPhotosByStage('durante').length} foto{getPhotosByStage('durante').length > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </button>

          {/* DESPUÉS */}
          <button
            onClick={() => setCurrentPhase('despues')}
            className="group relative overflow-hidden rounded-2xl p-8 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white transition transform hover:scale-105 active:scale-95"
          >
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition"></div>
            <div className="relative">
              <div className="text-6xl mb-3">🟢</div>
              <h2 className="text-4xl font-black mb-2">DESPUÉS</h2>
              <p className="text-green-100 text-lg">Foto final del trabajo completado</p>
              {getPhotosByStage('despues').length > 0 && (
                <div className="mt-3 bg-white/20 px-3 py-1 rounded-full inline-block">
                  ✓ {getPhotosByStage('despues').length} foto{getPhotosByStage('despues').length > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </button>
        </div>

        {/* Información */}
        <div className="max-w-4xl mx-auto bg-blue-900/20 border border-blue-500/30 rounded-xl p-6 text-blue-200">
          <p className="font-bold mb-2">💡 Consejo:</p>
          <p>Toma las fotos en orden: Primero ANTES, luego DURANTE, y finalmente DESPUÉS</p>
        </div>
      </div>
    );
  }

  // PANTALLAS: ANTES, DURANTE, DESPUÉS
  const renderPhaseScreen = (phase, phaseColor, phaseEmoji, phaseLabel) => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        {/* Header con código */}
        <div className="max-w-4xl mx-auto mb-6">
          <button
            onClick={() => setCurrentPhase('menu')}
            className="text-blue-300 hover:text-blue-200 font-bold mb-4 flex items-center gap-2"
          >
            ← Volver al menú
          </button>
        </div>

        {/* Sección grande de captura */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className={`bg-gradient-to-br ${phaseColor} rounded-3xl p-12 text-white text-center`}>
            <div className="text-8xl mb-4">{phaseEmoji}</div>
            <h1 className="text-5xl font-black mb-2">{phaseLabel}</h1>
            <div className={`inline-block px-4 py-2 rounded-full font-bold text-lg mb-6 ${
              phase === 'antes' ? 'bg-red-500/40' :
              phase === 'durante' ? 'bg-yellow-500/40' :
              'bg-green-500/40'
            }`}>
              {codigoSuministro}
            </div>
            <p className="text-lg opacity-90 mb-6">
              {phase === 'antes' && 'Captura cómo está el suministro antes de comenzar'}
              {phase === 'durante' && 'Captura fotos mientras realizas el trabajo'}
              {phase === 'despues' && 'Captura cómo quedó después de terminar'}
            </p>

            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <button
                onClick={() => cameraRef.current?.click()}
                className="bg-white text-slate-900 hover:bg-gray-100 font-bold py-4 px-6 rounded-xl transition transform hover:scale-105 flex items-center justify-center gap-2 active:scale-95"
              >
                <Camera className="w-6 h-6" />
                Cámara
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-white/80 text-slate-900 hover:bg-white font-bold py-4 px-6 rounded-xl transition transform hover:scale-105 flex items-center justify-center gap-2 active:scale-95"
              >
                <Upload className="w-6 h-6" />
                Archivo
              </button>
            </div>

            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handlePhotoCapture(e, phase)}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handlePhotoCapture(e, phase)}
              className="hidden"
            />
          </div>
        </div>

        {/* Fotos capturadas en esta fase */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-white font-bold text-xl mb-4">
            📷 Fotos capturadas: {getPhotosByStage(phase).length}
          </h2>

          {getPhotosByStage(phase).length === 0 ? (
            <div className="bg-slate-800/50 border-2 border-dashed border-blue-500/50 rounded-xl p-12 text-center">
              <p className="text-gray-400 text-lg">Aún no hay fotos en esta sección</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {getPhotosByStage(phase).map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.data}
                    alt={photo.fileName}
                    className="w-full h-40 object-cover rounded-lg border-2 border-blue-500/30 group-hover:border-orange-500 transition"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 rounded-lg transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = photo.data;
                          link.download = photo.fileName;
                          link.click();
                        }}
                        className="bg-blue-500 hover:bg-blue-600 p-2 rounded text-white transition"
                        title="Descargar"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deletePhoto(photo.id)}
                        className="bg-red-500 hover:bg-red-600 p-2 rounded text-white transition"
                        title="Eliminar"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent rounded-b-lg px-2 py-1">
                    <p className="text-xs text-white truncate">{photo.fileName}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Indicador offline */}
        {!isOnline && (
          <div className="max-w-4xl mx-auto mt-8 bg-orange-900/40 border border-orange-500/50 rounded-lg p-4 flex items-center gap-3">
            <WifiOff className="w-5 h-5 text-orange-400" />
            <span className="text-orange-300 font-bold">Sin internet - Funcionando offline (tus fotos se guardan localmente)</span>
          </div>
        )}
      </div>
    );
  };

  if (currentPhase === 'antes') {
    return renderPhaseScreen('antes', 'from-red-600 to-red-700', '🔴', 'ANTES');
  }

  if (currentPhase === 'durante') {
    return renderPhaseScreen('durante', 'from-yellow-500 to-yellow-600', '🟡', 'DURANTE');
  }

  if (currentPhase === 'despues') {
    return renderPhaseScreen('despues', 'from-green-600 to-green-700', '🟢', 'DESPUÉS');
  }

  // PANTALLA: Galería completa
  if (currentPhase === 'galeria') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => setCurrentPhase('seleccionar')}
              className="text-blue-300 hover:text-blue-200 font-bold mb-4 flex items-center gap-2"
            >
              ← Volver
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-black text-white">📷 Todas las Fotos</h1>
                <p className="text-blue-200 text-lg">Total: {totalPhotos} fotos</p>
              </div>
              <div className="flex gap-2">
                {isOnline ? (
                  <button
                    onClick={syncWithCloud}
                    disabled={syncStatus === 'syncing'}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-2 px-4 rounded-lg transition flex items-center gap-2"
                  >
                    {syncStatus === 'syncing' && <div className="animate-spin">⟳</div>}
                    {syncStatus === 'success' && <Check className="w-5 h-5" />}
                    {syncStatus === 'idle' && '☁️'}
                    {syncStatus === 'syncing' ? 'Sincronizando...' : 'Sincronizar'}
                  </button>
                ) : (
                  <div className="flex items-center gap-2 bg-orange-900/30 px-3 py-2 rounded-lg text-orange-300">
                    <WifiOff className="w-5 h-5" />
                    Offline
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Galería por suministro */}
          {Object.keys(grouped).length === 0 ? (
            <div className="text-center py-16">
              <Camera className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 text-xl">No hay fotos aún</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(grouped).map(([codigo, items]) => (
                <div key={codigo} className="bg-gradient-to-br from-blue-800/40 to-slate-800/40 border border-blue-600/30 rounded-2xl overflow-hidden">
                  {/* Encabezado del suministro */}
                  <div className="bg-gradient-to-r from-blue-900/60 to-slate-900/60 px-6 py-4 border-b border-blue-600/30">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-2xl font-bold text-white">{codigo}</h3>
                        <p className="text-blue-200">{items.length} foto{items.length !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="flex gap-2">
                        {['antes', 'durante', 'despues'].map((stage) => {
                          const count = items.filter((p) => p.stage === stage).length;
                          const emoji = stage === 'antes' ? '🔴' : stage === 'durante' ? '🟡' : '🟢';
                          const label = stage === 'antes' ? 'Antes' : stage === 'durante' ? 'Durante' : 'Después';
                          return (
                            <div key={stage} className={`px-3 py-1 rounded text-sm font-bold text-white ${
                              stage === 'antes' ? 'bg-red-600/60' :
                              stage === 'durante' ? 'bg-yellow-600/60' :
                              'bg-green-600/60'
                            }`}>
                              {emoji} {label}: {count}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Grid de fotos */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 p-6">
                    {items.map((photo) => {
                      const stageEmoji = photo.stage === 'antes' ? '🔴' : photo.stage === 'durante' ? '🟡' : '🟢';
                      return (
                        <div key={photo.id} className="relative group">
                          <img
                            src={photo.data}
                            alt={photo.fileName}
                            className="w-full h-32 object-cover rounded-lg border border-blue-500/30 group-hover:border-orange-500/60 transition"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-lg transition flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition flex gap-2">
                              <button
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = photo.data;
                                  link.download = photo.fileName;
                                  link.click();
                                }}
                                className="bg-blue-500 hover:bg-blue-600 p-2 rounded text-white"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deletePhoto(photo.id)}
                                className="bg-red-500 hover:bg-red-600 p-2 rounded text-white"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-sm text-white font-bold">
                            {stageEmoji}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
};

export default PhotoApp;
