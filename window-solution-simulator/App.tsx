
import React, { useState, useMemo, useCallback } from 'react';
import { ProductType, SimulationMode, SimulationResult, ManualSelection, FabricCompany, Product, Color } from './types';
import { MOCK_DATA } from './constants';
import { generateRecommendation, simulateWindowCovering } from './services/geminiService';
import { UploadIcon, SunIcon, MoonIcon, MagicWandIcon, ArrowLeftIcon } from './components/icons';
import Loader from './components/Loader';

type AppStep = 'upload' | 'select_product' | 'configure' | 'simulate' | 'result';

interface UploadedFile {
    base64: string;
    name: string;
    type: string;
}

const Header: React.FC = () => (
    <header className="w-full p-4 bg-white shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-800">Window Solution Simulator</h1>
    </header>
);

const ImageUploader: React.FC<{ onImageUpload: (file: UploadedFile) => void }> = ({ onImageUpload }) => {
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

    return (
        <div className="w-full max-w-2xl p-8 mx-auto text-center bg-white border-2 border-dashed rounded-lg border-gray-300 hover:border-blue-500 transition-colors">
            <UploadIcon className="w-12 h-12 mx-auto text-gray-400" />
            <h2 className="mt-4 text-xl font-semibold text-gray-700">Upload Your Window Photo</h2>
            <p className="mt-2 text-sm text-gray-500">Drag & drop or click to select a file</p>
            <input type="file" accept="image/*" onChange={handleFileChange} className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" />
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
        else if (step === 'select_product') setStep('upload');
    };

    const handleImageUpload = (file: UploadedFile) => {
        setUploadedFile(file);
        setStep('select_product');
    };

    const handleProductSelect = (type: ProductType) => {
        setProductType(type);
        setStep('configure');
        const initialCompany = MOCK_DATA[type][0];
        const initialProduct = initialCompany.products[0];
        const initialColor = initialProduct.colors[0];
        setManualSelection({
            fabricCompanyId: initialCompany.id,
            productId: initialProduct.id,
            colorId: initialColor.id,
        });
    };
    
    const handleModeSelect = (mode: SimulationMode) => {
        setSimulationMode(mode);
        setStep('simulate');
        setError(null);
        if (mode === SimulationMode.Auto) {
            runAutoSimulation();
        }
    };
    
    const runManualSimulation = useCallback(async () => {
        if (!uploadedFile || !productType || !manualSelection) return;

        setIsLoading(true);
        setSimulationResult(null);
        
        const { colorId, productId, fabricCompanyId } = manualSelection;
        const company = MOCK_DATA[productType].find(fc => fc.id === fabricCompanyId);
        const product = company?.products.find(p => p.id === productId);
        const color = product?.colors.find(c => c.id === colorId);

        if(!color || !product) {
            setError("Could not find product details.");
            setIsLoading(false);
            return;
        }

        try {
            setLoadingText('Simulating daytime view...');
            const dayImage = await simulateWindowCovering(uploadedFile.base64, uploadedFile.type, productType, color.name, product.name, true);
            
            setLoadingText('Simulating nighttime view...');
            const nightImage = await simulateWindowCovering(uploadedFile.base64, uploadedFile.type, productType, color.name, product.name, false);
            
            setSimulationResult({ dayImage, nightImage, recommendationText: null });
            setStep('result');
            setActiveResultView('day');
        } catch (e: any) {
            setError(e.message);
            setStep('configure');
        } finally {
            setIsLoading(false);
        }
    }, [uploadedFile, productType, manualSelection]);

    const runAutoSimulation = useCallback(async () => {
        if (!uploadedFile || !productType) return;

        setIsLoading(true);
        setSimulationResult(null);
        
        try {
            setLoadingText('Generating AI recommendation...');
            const recommendation = await generateRecommendation(uploadedFile.base64, uploadedFile.type, productType);
            
            setLoadingText('Simulating daytime view...');
            const dayImage = await simulateWindowCovering(uploadedFile.base64, uploadedFile.type, productType, 'AI suggested color', 'AI suggested style', true);

            setLoadingText('Simulating nighttime view...');
            const nightImage = await simulateWindowCovering(uploadedFile.base64, uploadedFile.type, productType, 'AI suggested color', 'AI suggested style', false);

            setSimulationResult({ dayImage, nightImage, recommendationText: recommendation });
            setStep('result');
            setActiveResultView('day');
        } catch (e: any) {
            setError(e.message);
            setStep('configure');
        } finally {
            setIsLoading(false);
        }
    }, [uploadedFile, productType]);


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
                return <ConfigurationPanel onModeSelect={handleModeSelect} onManualSimulate={runManualSimulation} productType={productType!} manualSelection={manualSelection!} setManualSelection={setManualSelection} />;
             case 'result':
                return <ResultView result={simulationResult!} originalImage={`data:${uploadedFile?.type};base64,${uploadedFile?.base64}`} activeView={activeResultView} setActiveView={setActiveResultView} />;
            default:
                return <div>Something went wrong.</div>;
        }
    };

    const shouldShowBackButton = step !== 'upload' && !isLoading;
    const shouldShowResetButton = step !== 'upload' && !isLoading;

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <Header />
            <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col">
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
                
                <div className="bg-white rounded-lg shadow-xl flex-grow p-6 relative">
                    {shouldShowBackButton && (
                        <button onClick={handleBack} className="absolute top-4 left-4 z-10 p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors">
                            <ArrowLeftIcon className="w-6 h-6 text-gray-700"/>
                        </button>
                    )}
                    {renderContent()}
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
}> = ({ onModeSelect, onManualSimulate, productType, manualSelection, setManualSelection }) => {
    
    const [activeTab, setActiveTab] = useState<SimulationMode>(SimulationMode.Manual);

    const companies = MOCK_DATA[productType];
    const selectedCompany = useMemo(() => companies.find(c => c.id === manualSelection.fabricCompanyId)!, [companies, manualSelection.fabricCompanyId]);
    const selectedProduct = useMemo(() => selectedCompany.products.find(p => p.id === manualSelection.productId)!, [selectedCompany, manualSelection.productId]);

    const handleSelectionChange = <K extends keyof ManualSelection,>(key: K, value: ManualSelection[K]) => {
      const newSelection = { ...manualSelection, [key]: value };

      if(key === 'fabricCompanyId') {
        const newCompany = companies.find(c => c.id === value)!;
        newSelection.productId = newCompany.products[0].id;
        newSelection.colorId = newCompany.products[0].colors[0].id;
      }

      if(key === 'productId') {
        const newProduct = selectedCompany.products.find(p => p.id === value)!;
        newSelection.colorId = newProduct.colors[0].id;
      }
      
      setManualSelection(newSelection);
    };

    return (
        <div className="flex flex-col h-full">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Configure Your {productType}</h2>
            
            <div className="w-full max-w-md mx-auto mb-6">
                <div className="flex border-2 border-gray-200 rounded-full p-1">
                    <button onClick={() => setActiveTab(SimulationMode.Manual)} className={`w-1/2 p-2 rounded-full text-center font-semibold transition-colors ${activeTab === SimulationMode.Manual ? 'bg-blue-600 text-white' : 'text-gray-600'}`}>
                        Manual Selection
                    </button>
                    <button onClick={() => onModeSelect(SimulationMode.Auto)} className={`w-1/2 p-2 rounded-full text-center font-semibold transition-colors flex items-center justify-center gap-2 ${activeTab === SimulationMode.Auto ? 'bg-blue-600 text-white' : 'text-gray-600'}`}>
                        <MagicWandIcon className="w-5 h-5"/> AI Recommendation
                    </button>
                </div>
            </div>

            <div className="flex-grow space-y-6 max-w-2xl mx-auto w-full">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Fabric Company</label>
                    <select value={manualSelection.fabricCompanyId} onChange={(e) => handleSelectionChange('fabricCompanyId', e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Product Model</label>
                    <select value={manualSelection.productId} onChange={(e) => handleSelectionChange('productId', e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                        {selectedCompany.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                    <div className="flex flex-wrap gap-3">
                        {selectedProduct.colors.map(color => (
                            <button key={color.id} onClick={() => handleSelectionChange('colorId', color.id)} className={`w-24 p-2 rounded-md border-2 transition-all ${manualSelection.colorId === color.id ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-300'}`}>
                                <div className="w-full h-10 rounded" style={{ backgroundColor: color.hex }}></div>
                                <span className="text-xs text-gray-600 mt-1 block truncate">{color.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
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

export default App;
