import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Cadastro from './Paginas/Cadastro';
import Login from './Paginas/Login';
import Dashboard from './Paginas/Dashboard';
import PropriedadesIntelectuais from './Paginas/PropriedadesIntelectuais';
import PatenteDetalhes from "./Paginas/PatenteDetalhes"; // <- componente de detalhes
import CadastroPI from './Paginas/CadastroPI.jsx';
import Payments from './Paginas/Payments';
import Autor from './Paginas/Autor';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
       <Route path="/propriedade-intelectual" element={<PropriedadesIntelectuais />} />
        <Route path="/detalhes/:id" element={<PatenteDetalhes />} />
        <Route path="/cadastro-pi" element={<CadastroPI />} /> 
         <Route path="/pagamentos" element={<Payments />} />
        <Route path="/autores" element={<Autor />} /> {/* Esta é a nova rota para o Autor.jsx */}

      </Routes>
    </Router>
  );
}

export default App;
