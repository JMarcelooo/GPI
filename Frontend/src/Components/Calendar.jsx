import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import './Calendar.css';

const Calendar = ({ selectedDate, setSelectedDate, payments }) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(selectedDate.getFullYear());

  useEffect(() => {
    // Atualiza o calendário quando a prop selectedDate muda (ex: do componente pai)
    setCurrentMonth(selectedDate.getMonth());
    setCurrentYear(selectedDate.getFullYear());
    setPickerYear(selectedDate.getFullYear());
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
    setSelectedDate(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentYear, currentMonth + 1, 1);
    setCurrentMonth(newDate.getMonth());
    setCurrentYear(newDate.getFullYear());
    setSelectedDate(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
  };

  const togglePicker = () => {
    setPickerYear(currentYear);
    setShowPicker(prev => !prev);
  };

  const handlePickerYearStep = (delta) => {
    setPickerYear(prev => prev + delta);
  };

  const handleSelectMonth = (month) => {
    const newDate = new Date(pickerYear, month, 1);
    setCurrentMonth(month);
    setCurrentYear(pickerYear);
    setSelectedDate(newDate);
    setShowPicker(false);
  };

  const handleDayClick = useCallback((day) => {
    if (day) { // Garante que o dia não seja nulo (para dias inativos)
      setSelectedDate(new Date(currentYear, currentMonth, day));
    }
  }, [currentYear, currentMonth, setSelectedDate]);

  // Conjunto de datas (yyyy-mm-dd) com vencimento -> lookup O(1) por célula
  const paymentDates = useMemo(() => {
    const set = new Set();
    payments.forEach(p => {
      if (!p.dueDate) return;
      const y = p.dueDate.getFullYear();
      const m = p.dueDate.getMonth();
      const d = p.dueDate.getDate();
      set.add(`${y}-${m}-${d}`);
    });
    return set;
  }, [payments]);

  const renderDays = useMemo(() => {
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
      const hasPayment = paymentDates.has(`${currentYear}-${currentMonth}-${i}`);

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
  }, [currentYear, currentMonth, selectedDate, paymentDates, handleDayClick]);

  return (
    <div className="calendar-container">
      <div className="calendar-nav">
        <button onClick={handlePrevMonth} title="Mês anterior"><ChevronLeft size={20} /></button>
        <button className="calendar-title" onClick={togglePicker} title="Alterar mês e ano">
          {monthNames[currentMonth]} de {currentYear} <ChevronDown size={14} />
        </button>
        <button onClick={handleNextMonth} title="Próximo mês"><ChevronRight size={20} /></button>
      </div>

      {showPicker && (
        <div className="calendar-picker">
          <div className="calendar-picker-year">
            <button onClick={() => handlePickerYearStep(-1)} title="Ano anterior"><ChevronLeft size={16} /></button>
            <span>{pickerYear}</span>
            <button onClick={() => handlePickerYearStep(1)} title="Próximo ano"><ChevronRight size={16} /></button>
          </div>
          <div className="calendar-picker-months">
            {monthNames.map((name, i) => (
              <button
                key={i}
                className={`calendar-picker-month ${i === currentMonth && pickerYear === currentYear ? 'selected' : ''}`}
                onClick={() => handleSelectMonth(i)}
              >
                {name.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="calendar-grid">
        {dayLabels.map((label, index) => (
          <div key={index} className="day-label">
            {label}
          </div>
        ))}
        {renderDays}
      </div>
    </div>
  );
};

export default Calendar;
