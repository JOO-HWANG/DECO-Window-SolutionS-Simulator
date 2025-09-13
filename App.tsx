
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { ProductType, SimulationMode, SimulationResult, ManualSelection, FabricCompany, Product, Color, CurtainStyle } from './types';
import { MOCK_DATA } from './constants';
import { generateRecommendation, simulateWindowCovering } from './services/geminiService';
import { UploadIcon, SunIcon, MoonIcon, MagicWandIcon, ArrowLeftIcon, CameraIcon, CogIcon } from './components/icons';
import Loader from './components/Loader';

type AppStep = 'upload' | 'select_product' | 'configure' | 'simulate' | 'result' | 'admin';

interface UploadedFile {
    base64: string;
    name: string;
    type: string;
}

const Header: React.FC<{ onAdminClick: () => void, onLogoClick: () => void }> = ({ onAdminClick, onLogoClick }) => (
    <header className="w-full p-4 bg-white shadow-md flex justify-between items-center">
        <h1 onClick={onLogoClick} className="text-2xl font-bold text-center text-gray-800 cursor-pointer">Window Solution Simulator</h1>
        <button onClick={onAdminClick} className="p-2 rounded-full hover:bg-gray-200 transition-colors" aria-label="Admin Settings">
            <CogIcon className="w-6 h-6 text-gray-600" />
        </button>
    </header>
);

const CameraView: React.FC<{ onPhotoTaken: (file: UploadedFile) => void; onCancel: () => void }> = ({ onPhotoTaken, onCancel }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const startCamera = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                setError("Could not access camera. Please check permissions and try again.");
            }
        };

        if (!capturedImage) {
            startCamera();
        }

        return () => {
            stream?.getTracks().forEach(track => track.stop());
        };
    }, [capturedImage, stream]);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const dataUrl = canvas.toDataURL('image/jpeg');
            setCapturedImage(dataUrl);
            stream?.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
    };

    const handleUsePhoto = () => {
        if (capturedImage) {
            const base64 = capturedImage.split(',')[1];
            onPhotoTaken({
                base64,
                name: `capture-${new Date().toISOString()}.jpg`,
                type: 'image/jpeg',
            });
        }
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-red-500 font-semibold">{error}</p>
                <button onClick={onCancel} className="mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors">Back to Upload</button>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center bg-black rounded-lg overflow-hidden">
            <canvas ref={canvasRef} className="hidden" />
            {capturedImage ? (
                <img src={capturedImage} alt="Captured" className="max-w-full max-h-full object-contain" />
            ) : (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            )}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent flex justify-center items-center gap-4">
                {capturedImage ? (
                    <>
                        <button onClick={handleRetake} className="px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-full shadow-md hover:bg-gray-300 transition-colors">Retake</button>
                        <button onClick={handleUsePhoto} className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-full shadow-md hover:bg-blue-700 transition-colors">Use Photo</button>
                    </>
                ) : (
                   <>
                        <button onClick={onCancel} className="absolute left-4 px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-800 rounded-full hover:bg-white transition-colors">Cancel</button>
                        <button onClick={handleCapture} aria-label="Take Photo" className="w-16 h-16 bg-white rounded-full border-4 border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/50 focus:ring-white"></button>
                    </>
                )}
            </div>
        </div>
    );
};


const ImageUploader: React.FC<{ onImageUpload: (file: UploadedFile) => void }> = ({ onImageUpload }) => {
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onImageUpload({
                    base64: (reader.result as string).split(',')[1],
                    name: file.name,
                    type: file.type,
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileSelect = () => fileInputRef.current?.click();

    if (isCameraOpen) {
        return <CameraView onPhotoTaken={onImageUpload} onCancel={() => setIsCameraOpen(false)} />;
    }

    return (
        <div className="w-full max-w-3xl p-8 mx-auto text-center bg-white">
            <h2 className="text-2xl font-semibold text-gray-700 mb-8">Add Your Window Photo</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div 
                    onClick={triggerFileSelect} 
                    className="relative p-6 bg-gray-50 border-2 border-dashed rounded-lg border-gray-300 hover:border-blue-500 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center h-48 group"
                    role="button"
                    tabIndex={0}
                    onKeyPress={(e) => e.key === 'Enter' && triggerFileSelect()}
                >
                    <UploadIcon className="w-12 h-12 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    <h3 className="mt-4 font-semibold text-gray-700">Upload from Device</h3>
                    <p className="mt-1 text-sm text-gray-500">Drag & drop or click</p>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
                <button 
                    onClick={() => setIsCameraOpen(true)}
                    className="p-6 bg-gray-50 border-2 border-gray-300 rounded-lg hover:border-blue-500 transition-all duration-300 flex flex-col items-center justify-center h-48 group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    aria-label="Take a photo with your camera"
                >
                    <CameraIcon className="w-12 h-12 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    <h3 className="mt-4 font-semibold text-gray-700">Take a Photo</h3>
                    <p className="mt-1 text-sm text-gray-500">Use your device's camera</p>
                </button>
            </div>
        </div>
    );
};

const App: React.FC = () => {
    const [step, setStep] = useState<AppStep>('upload');
    const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
    const [productType, setProductType] = useState<ProductType | null>(null);
    const [simulationMode, setSimulationMode] = useState<SimulationMode | null>(null);
    const [manualSelection, setManualSelection] = useState<ManualSelection | null>(null);
    const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [activeResultView, setActiveResultView] = useState<'day' | 'night' | 'original'>('day');
    const [fabricData, setFabricData] = useState<Record<ProductType, FabricCompany[]>>(MOCK_DATA);
    const [curtainStyle, setCurtainStyle] = useState<CurtainStyle>(CurtainStyle.SWave);

    const handleReset = () => {
        setStep('upload');
        setUploadedFile(null);
        setProductType(null);
        setSimulationMode(null);
        setManualSelection(null);
        setSimulationResult(null);
        setIsLoading(false);
        setError(null);
    };

    const handleBack = () => {
        if (step === 'result') setStep('configure');
        else if (step === 'configure') setStep('select_product');
        else if (step === 'select_product' || step === 'admin') setStep('upload');
    };

    const handleImageUpload = (file: UploadedFile) => {
        setUploadedFile(file);
        setStep('select_product');
    };

    const handleProductSelect = (type: ProductType) => {
        setProductType(type);
        setStep('configure');

        const companies = fabricData[type];
        if (companies && companies.length > 0) {
            const initialCompany = companies[0];
            const initialProduct = initialCompany.products[0];
            const initialColor = initialProduct.colors[0];
            setManualSelection({
                fabricCompanyId: initialCompany.id,
                productId: initialProduct.id,
                colorId: initialColor.id,
            });
        } else {
            // Handle case where there is no data for the selected product type
            setManualSelection(null);
        }
    };
    
    const handleModeSelect = (mode: SimulationMode) => {
        setSimulationMode(mode);
        if (mode === SimulationMode.Auto) {
            runAutoSimulation();
        }
    };
    
    const runManualSimulation = useCallback(async () => {
        if (!uploadedFile || !productType || !manualSelection) return;

        setIsLoading(true);
        setStep('simulate');
        setSimulationResult(null);
        
        const { colorId, productId, fabricCompanyId } = manualSelection;
        const company = fabricData[productType].find(fc => fc.id === fabricCompanyId);
        const product = company?.products.find(p => p.id === productId);
        const color = product?.colors.find(c => c.id === colorId);

        if(!color || !product) {
            setError("Could not find product details.");
            setIsLoading(false);
            setStep('configure');
            return;
        }

        try {
            setLoadingText('Simulating daytime view...');
            const dayImage = await simulateWindowCovering(uploadedFile.base64, uploadedFile.type, productType, color.name, product.name, true, curtainStyle);
            
            setLoadingText('Simulating nighttime view...');
            const nightImage = await simulateWindowCovering(uploadedFile.base64, uploadedFile.type, productType, color.name, product.name, false, curtainStyle);
            
            setSimulationResult({ dayImage, nightImage, recommendationText: null });
            setStep('result');
            setActiveResultView('day');
        } catch (e: any) {
            setError(e.message);
            setStep('configure');
        } finally {
            setIsLoading(false);
        }
    }, [uploadedFile, productType, manualSelection, fabricData, curtainStyle]);

    const runAutoSimulation = useCallback(async () => {
        if (!uploadedFile || !productType) return;

        setIsLoading(true);
        setStep('simulate');
        setSimulationResult(null);
        
        try {
            setLoadingText('Generating AI recommendation...');
            const recommendation = await generateRecommendation(uploadedFile.base64, uploadedFile.type, productType);
            
            setLoadingText('Simulating daytime view...');
            const dayImage = await simulateWindowCovering(uploadedFile.base64, uploadedFile.type, productType, 'AI suggested color', 'AI suggested style', true, productType === ProductType.Curtains ? curtainStyle : null);

            setLoadingText('Simulating nighttime view...');
            const nightImage = await simulateWindowCovering(uploadedFile.base64, uploadedFile.type, productType, 'AI suggested color', 'AI suggested style', false, productType === ProductType.Curtains ? curtainStyle : null);

            setSimulationResult({ dayImage, nightImage, recommendationText: recommendation });
            setStep('result');
            setActiveResultView('day');
        } catch (e: any) {
            setError(e.message);
            setStep('configure');
        } finally {
            setIsLoading(false);
        }
    }, [uploadedFile, productType, curtainStyle]);


    const renderContent = () => {
        if (isLoading) {
            return <div className="flex items-center justify-center h-full"><Loader text={loadingText} /></div>;
        }

        switch (step) {
            case 'upload':
                return <ImageUploader onImageUpload={handleImageUpload} />;
            case 'select_product':
                return <ProductSelector onSelect={handleProductSelect} />;
            case 'configure':
                 if (!productType || !manualSelection) {
                    return <div>Please select a product type first.</div>;
                }
                return <ConfigurationPanel onModeSelect={handleModeSelect} onManualSimulate={runManualSimulation} productType={productType} manualSelection={manualSelection} setManualSelection={setManualSelection} fabricData={fabricData} curtainStyle={curtainStyle} setCurtainStyle={setCurtainStyle} />;
             case 'result':
                return <ResultView result={simulationResult!} originalImage={`data:${uploadedFile?.type};base64,${uploadedFile?.base64}`} activeView={activeResultView} setActiveView={setActiveResultView} />;
            case 'admin':
                return <AdminPanel fabricData={fabricData} setFabricData={setFabricData} />;
            default:
                return <div>Something went wrong. Please start over.</div>;
        }
    };

    const shouldShowBackButton = step !== 'upload' && !isLoading;
    const shouldShowResetButton = step !== 'upload' && !isLoading && step !== 'admin';

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <Header onAdminClick={() => setStep('admin')} onLogoClick={handleReset} />
            <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col">
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error} <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">x</button></div>}
                
                <div className="bg-white rounded-lg shadow-xl flex-grow p-6 relative flex flex-col">
                    {shouldShowBackButton && (
                        <button onClick={handleBack} className="absolute top-4 left-4 z-10 p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors" aria-label="Go back">
                            <ArrowLeftIcon className="w-6 h-6 text-gray-700"/>
                        </button>
                    )}
                    <div className="flex-grow flex flex-col">
                        {renderContent()}
                    </div>
                </div>
                {shouldShowResetButton && (
                    <div className="mt-4 text-center">
                        <button onClick={handleReset} className="text-gray-500 hover:text-gray-800 text-sm font-medium">Start Over</button>
                    </div>
                )}
            </main>
        </div>
    );
};

const ProductSelector: React.FC<{ onSelect: (type: ProductType) => void }> = ({ onSelect }) => (
    <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Choose a Product Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
            {Object.values(ProductType).map(type => (
                <button key={type} onClick={() => onSelect(type)} className="p-6 bg-gray-50 rounded-lg shadow hover:shadow-lg hover:-translate-y-1 transition-all transform text-center">
                    <img src={`https://picsum.photos/seed/${type}/300/200`} alt={type} className="rounded-md mb-4 w-full h-32 object-cover" />
                    <h3 className="text-xl font-bold text-gray-700">{type}</h3>
                </button>
            ))}
        </div>
    </div>
);


const ConfigurationPanel: React.FC<{
    onModeSelect: (mode: SimulationMode) => void;
    onManualSimulate: () => void;
    productType: ProductType;
    manualSelection: ManualSelection;
    setManualSelection: (selection: ManualSelection) => void;
    fabricData: Record<ProductType, FabricCompany[]>;
    curtainStyle: CurtainStyle;
    setCurtainStyle: (style: CurtainStyle) => void;
}> = ({ onModeSelect, onManualSimulate, productType, manualSelection, setManualSelection, fabricData, curtainStyle, setCurtainStyle }) => {
    
    const companies = fabricData[productType] || [];
    const selectedCompany = useMemo(() => companies.find(c => c.id === manualSelection.fabricCompanyId), [companies, manualSelection.fabricCompanyId]);
    const selectedProduct = useMemo(() => selectedCompany?.products.find(p => p.id === manualSelection.productId), [selectedCompany, manualSelection.productId]);

    const handleSelectionChange = <K extends keyof ManualSelection,>(key: K, value: ManualSelection[K]) => {
      const newSelection = { ...manualSelection, [key]: value };

      if(key === 'fabricCompanyId') {
        const newCompany = companies.find(c => c.id === value)!;
        newSelection.productId = newCompany.products[0].id;
        newSelection.colorId = newCompany.products[0].colors[0].id;
      }

      if(key === 'productId') {
        const newProduct = selectedCompany!.products.find(p => p.id === value)!;
        newSelection.colorId = newProduct.colors[0].id;
      }
      
      setManualSelection(newSelection);
    };

    if (companies.length === 0) {
      return (
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Configure Your {productType}</h2>
          <p className="text-gray-600">No fabric data available for this product type. Please add data in the admin panel.</p>
        </div>
      );
    }

    return (
        <div className="flex flex-col h-full">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Configure Your {productType}</h2>
            
            {productType === ProductType.Curtains && (
                <div className="w-full max-w-xs mx-auto mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Curtain Style</label>
                    <div className="flex border-2 border-gray-200 rounded-full p-1">
                        <button onClick={() => setCurtainStyle(CurtainStyle.SWave)} className={`w-1/2 p-2 rounded-full text-center font-semibold transition-colors ${curtainStyle === CurtainStyle.SWave ? 'bg-blue-600 text-white shadow' : 'text-gray-600'}`}>
                            {CurtainStyle.SWave}
                        </button>
                        <button onClick={() => setCurtainStyle(CurtainStyle.PinchPleat)} className={`w-1/2 p-2 rounded-full text-center font-semibold transition-colors ${curtainStyle === CurtainStyle.PinchPleat ? 'bg-blue-600 text-white shadow' : 'text-gray-600'}`}>
                            {CurtainStyle.PinchPleat}
                        </button>
                    </div>
                </div>
            )}
            
            <div className="w-full max-w-md mx-auto mb-6">
                <div className="flex border-2 border-gray-200 rounded-full p-1">
                    <button onClick={() => onModeSelect(SimulationMode.Manual)} className={`w-1/2 p-2 rounded-full text-center font-semibold transition-colors ${true ? 'bg-blue-600 text-white' : 'text-gray-600'}`}>
                        Manual Selection
                    </button>
                    <button onClick={() => onModeSelect(SimulationMode.Auto)} className={`w-1/2 p-2 rounded-full text-center font-semibold transition-colors flex items-center justify-center gap-2 ${false ? 'bg-blue-600 text-white' : 'text-gray-600'}`}>
                        <MagicWandIcon className="w-5 h-5"/> AI Recommendation
                    </button>
                </div>
            </div>

            <div className="flex-grow space-y-6 max-w-2xl mx-auto w-full">
                <div>
                    <label htmlFor="fabric-company-select" className="block text-sm font-medium text-gray-700">Fabric Company</label>
                    <select id="fabric-company-select" value={manualSelection.fabricCompanyId} onChange={(e) => handleSelectionChange('fabricCompanyId', e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                {selectedCompany && (
                <div>
                    <label htmlFor="product-model-select" className="block text-sm font-medium text-gray-700">Product Model</label>
                    <select id="product-model-select" value={manualSelection.productId} onChange={(e) => handleSelectionChange('productId', e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                        {selectedCompany.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                )}
                {selectedProduct && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                    <div className="flex flex-wrap gap-3">
                        {selectedProduct.colors.map(color => (
                            <button key={color.id} onClick={() => handleSelectionChange('colorId', color.id)} className={`w-24 p-2 rounded-md border-2 transition-all ${manualSelection.colorId === color.id ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-300'}`} aria-label={`Select color ${color.name}`}>
                                <div className="w-full h-10 rounded" style={{ backgroundColor: color.hex }}></div>
                                <span className="text-xs text-gray-600 mt-1 block truncate">{color.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
                )}
            </div>
             <div className="mt-auto pt-6 text-center">
                <button onClick={onManualSimulate} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-full hover:bg-blue-700 transition-colors text-lg shadow-lg">
                    Simulate Now
                </button>
            </div>
        </div>
    );
};

const ResultView: React.FC<{
    result: SimulationResult;
    originalImage: string;
    activeView: 'day' | 'night' | 'original';
    setActiveView: (view: 'day' | 'night' | 'original') => void;
}> = ({ result, originalImage, activeView, setActiveView }) => {
    
    const displayedImage = useMemo(() => {
        if (activeView === 'day') return result.dayImage ? `data:image/png;base64,${result.dayImage}` : originalImage;
        if (activeView === 'night') return result.nightImage ? `data:image/png;base64,${result.nightImage}` : originalImage;
        return originalImage;
    }, [activeView, result, originalImage]);

    return (
        <div className="flex flex-col lg:flex-row h-full gap-6">
            <div className="lg:w-2/3 flex flex-col items-center">
                 <div className="w-full aspect-video bg-gray-200 rounded-lg overflow-hidden shadow-lg flex items-center justify-center">
                     <img src={displayedImage} alt={`Simulation - ${activeView}`} className="w-full h-full object-contain"/>
                 </div>
                 <div className="flex items-center justify-center gap-4 mt-4 p-2 bg-gray-200 rounded-full">
                     <button onClick={() => setActiveView('original')} className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors ${activeView === 'original' ? 'bg-white shadow' : 'bg-transparent text-gray-600'}`}>Original</button>
                     {result.dayImage && <button onClick={() => setActiveView('day')} className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-colors ${activeView === 'day' ? 'bg-white shadow' : 'bg-transparent text-gray-600'}`}><SunIcon className="w-5 h-5 text-yellow-500" /> Day</button>}
                     {result.nightImage && <button onClick={() => setActiveView('night')} className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-colors ${activeView === 'night' ? 'bg-white shadow' : 'bg-transparent text-gray-600'}`}><MoonIcon className="w-5 h-5 text-blue-500"/> Night</button>}
                 </div>
            </div>
            <div className="lg:w-1/3 bg-gray-50 p-6 rounded-lg overflow-y-auto">
                 <h3 className="text-xl font-bold text-gray-800 mb-3">Simulation Details</h3>
                 {result.recommendationText ? (
                     <div>
                        <h4 className="text-lg font-semibold text-blue-600 flex items-center gap-2 mb-2"><MagicWandIcon className="w-5 h-5"/> AI Recommendation</h4>
                        <p className="text-gray-600 whitespace-pre-wrap">{result.recommendationText}</p>
                     </div>
                 ) : (
                     <p className="text-gray-600">Here is the virtual simulation based on your manual selection. Use the toggles to switch between day and night views.</p>
                 )}
            </div>
        </div>
    );
};

const AdminPanel: React.FC<{
    fabricData: Record<ProductType, FabricCompany[]>;
    setFabricData: (data: Record<ProductType, FabricCompany[]>) => void;
}> = ({ fabricData, setFabricData }) => {
    const [activeTab, setActiveTab] = useState<ProductType>(ProductType.VerticalBlinds);
    const [newItemName, setNewItemName] = useState('');

    const handleAddCompany = () => {
        if (!newItemName.trim()) return;
        const newCompany: FabricCompany = {
            id: `fc-${Date.now()}`,
            name: newItemName,
            products: [],
        };
        const newData = JSON.parse(JSON.stringify(fabricData));
        newData[activeTab].push(newCompany);
        setFabricData(newData);
        setNewItemName('');
    };
    
    // Simplified add handlers for brevity. A real app would have more robust forms.
    const handleAddProduct = (companyId: string) => {
        const productName = prompt("Enter new product name:");
        if (!productName) return;
        const newProduct: Product = { id: `p-${Date.now()}`, name: productName, colors: [] };

        const newData = JSON.parse(JSON.stringify(fabricData));
        const company = newData[activeTab].find((c: FabricCompany) => c.id === companyId);
        company.products.push(newProduct);
        setFabricData(newData);
    };

    const handleAddColor = (companyId: string, productId: string) => {
        const colorName = prompt("Enter new color name:");
        if (!colorName) return;
        const colorHex = prompt("Enter new color hex code (e.g., #FFFFFF):");
        if (!colorHex) return;
        const newColor: Color = { id: `c-${Date.now()}`, name: colorName, hex: colorHex };

        const newData = JSON.parse(JSON.stringify(fabricData));
        const company = newData[activeTab].find((c: FabricCompany) => c.id === companyId);
        const product = company.products.find((p: Product) => p.id === productId);
        product.colors.push(newColor);
        setFabricData(newData);
    };

    return (
        <div className="p-4 h-full flex flex-col">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Manage Fabrics</h2>
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {Object.values(ProductType).map(type => (
                        <button key={type} onClick={() => setActiveTab(type)} className={`${activeTab === type ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                            {type}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="py-4 flex-grow overflow-y-auto">
                <div className="space-y-2 mb-4">
                    <input type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder={`New ${activeTab} Company Name`} className="p-2 border rounded-md w-full md:w-1/2" />
                    <button onClick={handleAddCompany} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Add Company</button>
                </div>
                <div className="space-y-4">
                    {fabricData[activeTab].map(company => (
                        <div key={company.id} className="p-4 border rounded-lg bg-gray-50">
                            <h3 className="text-lg font-semibold">{company.name}</h3>
                            <div className="pl-4 mt-2 space-y-2">
                                {company.products.map(product => (
                                    <div key={product.id} className="p-2 border-l-2">
                                        <p className="font-medium">{product.name}</p>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {product.colors.map(color => (
                                                <div key={color.id} className="p-1 border rounded text-xs flex items-center gap-1">
                                                    <div className="w-4 h-4 rounded-full border" style={{backgroundColor: color.hex}}></div>
                                                    {color.name}
                                                </div>
                                            ))}
                                        </div>
                                         <button onClick={() => handleAddColor(company.id, product.id)} className="text-xs text-blue-500 hover:underline mt-1">+ Add Color</button>
                                    </div>
                                ))}
                                <button onClick={() => handleAddProduct(company.id)} className="text-sm text-blue-600 hover:underline mt-2">+ Add Product</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default App;
