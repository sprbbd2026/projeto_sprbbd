import { useState } from 'react';
import { useMapStore, type LocationCategory } from '../../store/mapStore';
import { X, MapPin, Utensils, Bed, Landmark, Star, Bus, Camera, HelpCircle } from 'lucide-react';

export function AddLocationModal() {
  const { isAddModalOpen, setAddModalOpen, addLocation, selectedCoord, setSelectedCoord } = useMapStore();
  
  const [name, setName] = useState('');
  const [category, setCategory] = useState<LocationCategory>('restaurantes');
  const [rating, setRating] = useState(5);

  if (!isAddModalOpen || !selectedCoord) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addLocation({
      name,
      category,
      rating,
      lat: selectedCoord.lat,
      lng: selectedCoord.lng
    });

    setName('');
    setCategory('restaurantes');
    setRating(5);
  };

  const closeModal = () => {
    setAddModalOpen(false);
    setSelectedCoord(null);
  };

  const categories: { id: LocationCategory; label: string; icon: React.ElementType }[] = [
    { id: 'restaurantes', label: 'Restaurante', icon: Utensils },
    { id: 'hoteis', label: 'Hotel', icon: Bed },
    { id: 'museus', label: 'Museu', icon: Landmark },
    { id: 'transporte', label: 'Transporte', icon: Bus },
    { id: 'coisas_fazer', label: 'Lazer', icon: Camera },
    { id: 'outros', label: 'Outros', icon: HelpCircle },
  ];

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <MapPin size={20} className="text-blue-600" />
            Novo Local
          </h2>
          <button 
            onClick={closeModal}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome do Local</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Restaurante da Praia"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <cat.icon size={16} className={isSelected ? 'text-blue-600' : 'text-gray-400'} />
                    <span className="text-sm font-medium">{cat.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Avaliação</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <Star 
                    size={28} 
                    className={star <= rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"} 
                  />
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors shadow-lg shadow-blue-600/20 cursor-pointer"
          >
            Salvar Local
          </button>
        </form>
      </div>
    </div>
  );
}
