import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// const API_URL = 'http://localhost:5000/api';
const API_URL = `${process.env.REACT_APP_API_URL}/api`;


function App() {
  const [habits, setHabits] = useState([]);
  const [logs, setLogs] = useState([]);
  const [view, setView] = useState('daily'); // 'daily' or 'weekly'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [newHabit, setNewHabit] = useState({
    name: '',
    timeOfDay: 'morning',
    frequency: 'daily',
    weekDays: [],
    reminderEnabled: false,
    reminderTime: ''
  });

  useEffect(() => {
    fetchHabits();
    fetchLogs();
  }, [currentDate, view]);

  const fetchHabits = async () => {
    try {
      const response = await axios.get(`${API_URL}/habits`);
      setHabits(response.data);
    } catch (err) {
      console.error('Error fetching habits:', err);
    }
  };

  const fetchLogs = async () => {
    try {
      const dateStr = currentDate.toISOString().split('T')[0];
      const response = await axios.get(`${API_URL}/logs`, {
        params: view === 'daily' 
          ? { startDate: dateStr, endDate: dateStr }
          : { startDate: getWeekStart(currentDate), endDate: getWeekEnd(currentDate) }
      });
      setLogs(response.data);
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  };

  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  };

  const getWeekEnd = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() + (6 - day);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  };

  const handleAddHabit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/habits`, newHabit);
      setShowModal(false);
      setNewHabit({
        name: '',
        timeOfDay: 'morning',
        frequency: 'daily',
        weekDays: [],
        reminderEnabled: false,
        reminderTime: ''
      });
      fetchHabits();
      fetchLogs();
    } catch (err) {
      console.error('Error adding habit:', err);
    }
  };

  const handleDeleteHabit = async (id) => {
    if (window.confirm('Are you sure you want to delete this habit?')) {
      try {
        await axios.delete(`${API_URL}/habits/${id}`);
        fetchHabits();
        fetchLogs();
      } catch (err) {
        console.error('Error deleting habit:', err);
      }
    }
  };

  const toggleHabitCompletion = async (habitId, date, currentStatus) => {
    try {
      await axios.post(`${API_URL}/logs`, {
        habitId,
        date,
        completed: !currentStatus
      });
      fetchLogs();
      fetchHabits();
    } catch (err) {
      console.error('Error toggling habit:', err);
    }
  };

  const getLogStatus = (habitId, date) => {
    const log = logs.find(l => l.habitId?._id === habitId && l.date === date);
    return log?.completed || false;
  };

  const renderDailyView = () => {
    const dateStr = currentDate.toISOString().split('T')[0];
    
    return (
      <div className="daily-view">
        <div className="date-selector">
          <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 1)))}>
            ← Previous
          </button>
          <h2>{currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
          <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 1)))}>
            Next →
          </button>
        </div>
        
        <div className="habits-list">
          {habits.map(habit => {
            const isCompleted = getLogStatus(habit._id, dateStr);
            return (
              <div key={habit._id} className={`habit-card ${isCompleted ? 'completed' : ''}`}>
                <div className="habit-info">
                  <h3>{habit.name}</h3>
                  <span className="time-badge">{habit.timeOfDay}</span>
                  <span className="streak">🔥 {habit.currentStreak} day streak</span>
                </div>
                <div className="habit-actions">
                  <button 
                    className={`check-btn ${isCompleted ? 'checked' : ''}`}
                    onClick={() => toggleHabitCompletion(habit._id, dateStr, isCompleted)}
                  >
                    {isCompleted ? '✓' : '○'}
                  </button>
                  <button className="delete-btn" onClick={() => handleDeleteHabit(habit._id)}>
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeeklyView = () => {
    const weekDays = [];
    const startDate = new Date(getWeekStart(currentDate));
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      weekDays.push(date);
    }

    return (
      <div className="weekly-view">
        <div className="date-selector">
          <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)))}>
            ← Previous Week
          </button>
          <h2>Week of {weekDays[0].toLocaleDateString()}</h2>
          <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)))}>
            Next Week →
          </button>
        </div>
        
        <div className="weekly-grid">
          <div className="grid-header">
            <div className="habit-name-col">Habit</div>
            {weekDays.map(day => (
              <div key={day.toISOString()} className="day-col">
                {day.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
              </div>
            ))}
          </div>
          
          {habits.map(habit => (
            <div key={habit._id} className="grid-row">
              <div className="habit-name-col">
                <span>{habit.name}</span>
                <small>🔥 {habit.currentStreak}</small>
              </div>
              {weekDays.map(day => {
                const dateStr = day.toISOString().split('T')[0];
                const isCompleted = getLogStatus(habit._id, dateStr);
                return (
                  <div key={dateStr} className="day-col">
                    <button
                      className={`mini-check ${isCompleted ? 'checked' : ''}`}
                      onClick={() => toggleHabitCompletion(habit._id, dateStr, isCompleted)}
                    >
                      {isCompleted ? '✓' : '○'}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleWeekDayToggle = (day) => {
    setNewHabit(prev => ({
      ...prev,
      weekDays: prev.weekDays.includes(day) 
        ? prev.weekDays.filter(d => d !== day)
        : [...prev.weekDays, day]
    }));
  };

  return (
    <div className="App">
      <header>
        <h1>💪 Habit Tracker</h1>
        <div className="header-actions">
          <div className="view-toggle">
            <button 
              className={view === 'daily' ? 'active' : ''}
              onClick={() => setView('daily')}
            >
              Daily
            </button>
            <button 
              className={view === 'weekly' ? 'active' : ''}
              onClick={() => setView('weekly')}
            >
              Weekly
            </button>
          </div>
          <button className="add-btn" onClick={() => setShowModal(true)}>
            + Add Habit
          </button>
        </div>
      </header>

      <main>
        {view === 'daily' ? renderDailyView() : renderWeeklyView()}
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Add New Habit</h2>
            <form onSubmit={handleAddHabit}>
              <div className="form-group">
                <label>Habit Name</label>
                <input
                  type="text"
                  value={newHabit.name}
                  onChange={e => setNewHabit({...newHabit, name: e.target.value})}
                  placeholder="e.g., Morning Exercise"
                  required
                />
              </div>

              <div className="form-group">
                <label>Time of Day</label>
                <select
                  value={newHabit.timeOfDay}
                  onChange={e => setNewHabit({...newHabit, timeOfDay: e.target.value})}
                >
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                  <option value="night">Night</option>
                  <option value="anytime">Anytime</option>
                </select>
              </div>

              <div className="form-group">
                <label>Frequency</label>
                <select
                  value={newHabit.frequency}
                  onChange={e => setNewHabit({...newHabit, frequency: e.target.value})}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              {newHabit.frequency === 'weekly' && (
                <div className="form-group">
                  <label>Select Days</label>
                  <div className="weekday-selector">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                      <button
                        key={day}
                        type="button"
                        className={newHabit.weekDays.includes(idx) ? 'selected' : ''}
                        onClick={() => handleWeekDayToggle(idx)}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={newHabit.reminderEnabled}
                    onChange={e => setNewHabit({...newHabit, reminderEnabled: e.target.checked})}
                  />
                  Enable Reminders
                </label>
              </div>

              {newHabit.reminderEnabled && (
                <div className="form-group">
                  <label>Reminder Time</label>
                  <input
                    type="time"
                    value={newHabit.reminderTime}
                    onChange={e => setNewHabit({...newHabit, reminderTime: e.target.value})}
                  />
                </div>
              )}

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="primary">Add Habit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;


