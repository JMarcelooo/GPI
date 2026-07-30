import { Clock, CheckCircle, Calendar } from 'lucide-react';
import Sidebar from '../Components/Sidebar';
import '../Tela2.css';
import './Notificacoes.css';

const notifications = [
  {
    id: 1,
    type: 'prazo',
    icon: <Clock size={16} />,
    title: 'Prazo se aproximando',
    message: 'A PI "Composição farmacêutica" tem prazo de pagamento em 5 dias.',
    time: 'Há 2 horas',
    color: 'var(--color-error)',
  },
  {
    id: 2,
    type: 'nova',
    icon: <CheckCircle size={16} />,
    title: 'Nova PI cadastrada',
    message: 'O pesquisador João Silva cadastrou uma nova Propriedade Intelectual.',
    time: 'Há 1 dia',
    color: 'var(--color-success)',
  },
  {
    id: 3,
    type: 'status',
    icon: <Calendar size={16} />,
    title: 'Status atualizado',
    message: 'O processo "Marca INOVA" foi atualizado para "Deferido".',
    time: 'Há 3 dias',
    color: 'var(--color-primary)',
  },
];

function Notificacoes() {
  return (
    <div className="container">
      <Sidebar />
      <div className="main">
        <header className="topbar">
          <h2>Notificações</h2>
        </header>

        <div className="notificacoes-list">
          {notifications.map((n) => (
            <div key={n.id} className="notificacao-item" style={{ borderLeftColor: n.color }}>
              <div className="notificacao-icon" style={{ color: n.color }}>
                {n.icon}
              </div>
              <div className="notificacao-content">
                <div className="notificacao-title">{n.title}</div>
                <p className="notificacao-message">{n.message}</p>
                <span className="notificacao-time">{n.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Notificacoes;
