import { ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2">
          <ShieldAlert size={32} />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Acesso Restrito</h1>
        <p className="text-gray-600">
          Você precisa estar autenticado para acessar esta página. Por favor, faça login para continuar.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors cursor-pointer"
        >
          Fazer Login
        </button>
      </div>
    </div>
  );
}
