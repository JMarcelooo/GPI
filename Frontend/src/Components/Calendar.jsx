import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Calendar.css';

const Calendar = ({ selectedDate, setSelectedDate, payments }) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());

  useEffect(() => {
    // Atualiza o calendário quando a prop selectedDate muda (ex: do componente pai)
    setCurrentMonth(selectedDate.getMonth());
    setCurrentYear(selectedDate.getFullYear());
  }, [selectedDate]);

  // Função para obter o número de dias em um determinado mês
  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  // Função para obter o dia da semana do primeiro dia do mês (0: Domingo, 1: Segunda, etc.)
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const handlePrevMonth = () => {
    const newDate = new Date(currentYear, currentMonth - 1, 1);
    setCurrentMonth(newDate.getMonth());
    setCurrentYear(newDate.getFullYear());
    // Opcionalmente, atualiza selectedDate para o primeiro dia do novo mês
    setSelectedDate(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentYear, currentMonth + 1, 1);
    setCurrentMonth(newDate.getMonth());
    setCurrentYear(newDate.getFullYear());
    // Opcionalmente, atualiza selectedDate para o primeiro dia do novo mês
    setSelectedDate(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
  };

  const handleDayClick = (day) => {
    if (day) { // Garante que o dia não seja nulo (para dias inativos)
      setSelectedDate(new Date(currentYear, currentMonth, day));
    }
  };

  const renderDays = () => {
    const totalDays = daysInMonth(currentYear, currentMonth);
    const startDay = firstDayOfMonth(currentYear, currentMonth); // Dia da semana para o dia 1
    const prevMonthDays = daysInMonth(currentYear, currentMonth - 1);

    const days = [];

    // Preenche os dias do mês anterior para completar a primeira semana
    for (let i = startDay; i > 0; i--) {
      days.push(
        <div key={`prev-${prevMonthDays - i + 1}`} className="day inactive">
          {prevMonthDays - i + 1}
        </div>
      );
    }

    // Preenche os dias do mês atual
    for (let i = 1; i <= totalDays; i++) {
      const isSelected =
        selectedDate.getDate() === i &&
        selectedDate.getMonth() === currentMonth &&
        selectedDate.getFullYear() === currentYear;

      // Verifica se há algum pagamento para este dia
      const hasPayment = payments.some(payment =>
        payment.dueDate.getDate() === i &&
        payment.dueDate.getMonth() === currentMonth &&
        payment.dueDate.getFullYear() === currentYear
      );

      days.push(
        <div
          key={`current-${i}`}
          className={`day ${isSelected ? 'selected' : ''} ${hasPayment ? 'has-payment' : ''}`}
          onClick={() => handleDayClick(i)}
        >
          {i}
        </div>
      );
    }

    // Preenche os dias do próximo mês para completar as linhas da grade (até 6 linhas * 7 dias = 42 células)
    const remainingCells = 42 - days.length; // Máximo de células em uma grade de calendário
    for (let i = 1; i <= remainingCells; i++) {
      days.push(
        <div key={`next-${i}`} className="day inactive">
          {i}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="calendar-container">
      <div className="calendar-nav">
        <button onClick={handlePrevMonth}><ChevronLeft size={20} /></button>
        <h3>{monthNames[currentMonth]} {currentYear}</h3>
        <button onClick={handleNextMonth}><ChevronRight size={20} /></button>
      </div>
      <div className="calendar-grid">
        {dayLabels.map((label, index) => (
          <div key={index} className="day-label">
            {label}
          </div>
        ))}
        {renderDays()}
      </div>
    </div>
  );
};

export default Calendar;