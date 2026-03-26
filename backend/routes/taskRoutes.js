const express = require('express');
const { createTask, getTasks, updateTask, deleteTask, markTaskComplete, getTaskAnalytics } = require('../controllers/taskController');
const protect = require('../middleware/authMiddleware');
const router = express.Router();

// ========== task endpoints are private, auth middleware first ==========
router.use(protect);

// ========== create task ==========
router.post('/', createTask);

// ========== list tasks with search/filter/sort/pagination ==========
router.get('/', getTasks);

// ========== dashboard counters ==========
router.get('/analytics', getTaskAnalytics);

// ========== edit task ==========
router.put('/:id', updateTask);

// ========== remove task ==========
router.delete('/:id', deleteTask);

// ========== quick mark-as-done action ==========
router.patch('/:id/complete', markTaskComplete);

module.exports = router;
