const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI).then(() => {
    console.log("Database connected");
}).catch(() => {
    console.log("Error connecting database");
})

// Models
const habitSchema = new mongoose.Schema({
  name: { type: String, required: true },
  timeOfDay: { type: String, required: true, enum: ['morning', 'afternoon', 'evening', 'night', 'anytime'] },
  frequency: { type: String, required: true, enum: ['daily', 'weekly'] },
  weekDays: [{ type: Number, min: 0, max: 6 }], // 0=Sunday, 6=Saturday
  createdAt: { type: Date, default: Date.now },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  reminderEnabled: { type: Boolean, default: false },
  reminderTime: String
});

const logSchema = new mongoose.Schema({
  habitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  completed: { type: Boolean, default: false },
  completedAt: Date
});

logSchema.index({ habitId: 1, date: 1 }, { unique: true });

const Habit = mongoose.model('Habit', habitSchema);
const Log = mongoose.model('Log', logSchema);

// Helper Functions
const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};

const calculateStreak = async (habitId) => {
  const habit = await Habit.findById(habitId);
  const logs = await Log.find({ habitId, completed: true }).sort({ date: -1 });
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < logs.length; i++) {
    const logDate = new Date(logs[i].date);
    logDate.setHours(0, 0, 0, 0);
    
    if (i === 0) {
      const diffDays = Math.floor((today - logDate) / (1000 * 60 * 60 * 24));
      if (diffDays <= 1) {
        currentStreak = 1;
        tempStreak = 1;
      }
    } else {
      const prevLogDate = new Date(logs[i - 1].date);
      prevLogDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((prevLogDate - logDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        tempStreak++;
        if (i === 1) currentStreak = tempStreak;
      } else {
        tempStreak = 1;
      }
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);
  }
  
  return { currentStreak, longestStreak };
};

// Routes

// Get all habits
app.get('/api/habits', async (req, res) => {
  try {
    const habits = await Habit.find().sort({ createdAt: -1 });
    res.json(habits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create habit
app.post('/api/habits', async (req, res) => {
  try {
    const habit = new Habit(req.body);
    await habit.save();
    res.status(201).json(habit);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update habit
app.put('/api/habits/:id', async (req, res) => {
  try {
    const habit = await Habit.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(habit);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete habit
app.delete('/api/habits/:id', async (req, res) => {
  try {
    await Habit.findByIdAndDelete(req.params.id);
    await Log.deleteMany({ habitId: req.params.id });
    res.json({ message: 'Habit deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get logs for a date range
app.get('/api/logs', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }
    const logs = await Log.find(query).populate('habitId');
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get logs for today
app.get('/api/logs/today', async (req, res) => {
  try {
    const today = getTodayString();
    const logs = await Log.find({ date: today }).populate('habitId');
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark habit as complete/incomplete for a date
app.post('/api/logs', async (req, res) => {
  try {
    const { habitId, date, completed } = req.body;
    
    const log = await Log.findOneAndUpdate(
      { habitId, date },
      { 
        completed, 
        completedAt: completed ? new Date() : null 
      },
      { upsert: true, new: true }
    );
    
    // Update streak
    const streaks = await calculateStreak(habitId);
    await Habit.findByIdAndUpdate(habitId, streaks);
    
    res.json(log);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get habit statistics
app.get('/api/habits/:id/stats', async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);
    const logs = await Log.find({ habitId: req.params.id, completed: true });
    
    const totalCompleted = logs.length;
    const streaks = await calculateStreak(req.params.id);
    
    res.json({
      totalCompleted,
      currentStreak: streaks.currentStreak,
      longestStreak: streaks.longestStreak,
      habit
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cron job to reset daily logs (runs at midnight)
cron.schedule('0 0 * * *', async () => {
  console.log('Running daily reset job');
  const habits = await Habit.find();
  const today = getTodayString();
  
  for (const habit of habits) {
    const existingLog = await Log.findOne({ habitId: habit._id, date: today });
    if (!existingLog) {
      await Log.create({ habitId: habit._id, date: today, completed: false });
    }
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});