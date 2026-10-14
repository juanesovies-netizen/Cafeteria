import { Bot, Coffee, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/** Vista del cliente. El menú, pedidos y chatbot se implementan en próximos sprints. */
export default function ClientMenu() {
  const { user } = useAuth();
  const upcoming = [
    { icon: Coffee, title: 'Menú digital', text: 'Explora bebidas, postres y snacks con precios y disponibilidad.' },
    { icon: ShoppingBag, title: 'Pedidos en línea', text: 'Haz tu pedido y sigue su estado en tiempo real.' },
    { icon: Bot, title: 'Asistente virtual', text: 'Un chatbot que te guía y recomienda productos según tus gustos.' },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>¡Bienvenido, {user.name.split(' ')[0]}! ☕</h1>
          <p className="muted">Estamos preparando tu experiencia</p>
        </div>
      </div>
      <div className="category-grid">
        {upcoming.map(({ icon: Icon, title, text }) => (
          <div key={title} className="card feature-card">
            <div className="stat-icon tone-brown">
              <Icon size={22} />
            </div>
            <h3>{title}</h3>
            <p className="muted">{text}</p>
            <span className="tag">Próximamente</span>
          </div>
        ))}
      </div>
    </>
  );
}
