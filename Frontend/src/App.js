import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Cadastro from './Paginas/Cadastro';
import Login from './Paginas/Login';
import Dashboard from './Paginas/Dashboard';
import PropriedadesIntelectuais from './Paginas/PropriedadesIntelectuais';
import PatenteDetalhes from "./Paginas/PatenteDetalhes"; // <- componente de detalhes
import CadastroPI from './Paginas/CadastroPI.jsx';
import EditarPI from './Paginas/EditarPI';
import Payments from './Paginas/Payments';
import Autor from './Paginas/Autor';
import Notificacoes from './Paginas/Notificacoes';
import Configuracoes from './Paginas/Configuracoes';
import NotificationBell from './Components/NotificationBell';
import { ThemeProvider } from './contexts/ThemeContext';
function App() {
  return (
    <Router>
      <ThemeProvider>
      <NotificationBell />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
       <Route path="/propriedade-intelectual" element={<PropriedadesIntelectuais />} />
        <Route path="/detalhes/:id" element={<PatenteDetalhes />} />
        <Route path="/cadastro-pi" element={<CadastroPI />} />
        <Route path="/editar-pi/:id" element={<EditarPI />} />
         <Route path="/pagamentos" element={<Payments />} />
        <Route path="/autores" element={<Autor />} /> {/* Esta é a nova rota para o Autor.jsx */}
        <Route path="/notificacoes" element={<Notificacoes />} />
        <Route path="/configuracoes" element={<Configuracoes />} />

      </Routes>
      </ThemeProvider>
    </Router>
  );
}

export default App;
