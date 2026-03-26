const Task = require('../models/Task');
const { asyncHandler } = require('../middleware/errorMiddleware');

const VALID_STATUS = ['Todo', 'In Progress', 'Done'];
const VALID_PRIORITY = ['Low', 'Medium', 'High'];
const VALID_SORT_FIELDS = ['dueDate', 'priority', 'createdAt'];
const MAX_LIMIT = 50;

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const ensureOwnership = (task, userId, action) => {
  if (!task) {
    const ownershipError = new Error('Task not found');
    ownershipError.statusCode = 404;
    throw ownershipError;
  }

  if (task.user.toString() !== userId) {
    const ownershipError = new Error(`Not authorized to ${action} this task`);
    ownershipError.statusCode = 403;
    throw ownershipError;
  }
};

// ========== quick guard for status/priority before writing ==========
const createTask = asyncHandler(async (req, res) => {
  const { title, description, status, priority, dueDate } = req.body || {};

  if (status && !VALID_STATUS.includes(status)) {
    res.status(400);
    throw new Error('Invalid status value');
  }

  if (priority && !VALID_PRIORITY.includes(priority)) {
    res.status(400);
    throw new Error('Invalid priority value');
  }

  const task = await Task.create({
    title,
    description,
    status: status || 'Todo',
    priority: priority || 'Medium',
    dueDate,
    user: req.user.id,
  });

  res.status(201).json({
    success: true,
    task,
  });
});

// ========== fetch only the logged-in user's tasks ==========
const getTasks = asyncHandler(async (req, res) => {
  const {
    status,
    priority,
    search,
    page = 1,
    limit = 10,
    sortBy = 'dueDate',
    sortOrder = 'asc',
  } = req.query;

  if (status && !VALID_STATUS.includes(status)) {
    res.status(400);
    throw new Error('Invalid status filter');
  }

  if (priority && !VALID_PRIORITY.includes(priority)) {
    res.status(400);
    throw new Error('Invalid priority filter');
  }

  const normalizedSortBy = VALID_SORT_FIELDS.includes(sortBy) ? sortBy : 'dueDate';
  const normalizedSortOrder = sortOrder === 'desc' ? -1 : 1;
  const normalizedPage = parsePositiveInt(page, 1);
  const normalizedLimit = Math.min(parsePositiveInt(limit, 10), MAX_LIMIT);

  const query = { user: req.user.id };

  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (search) query.title = { $regex: search, $options: 'i' };

  const sortOptions = { [normalizedSortBy]: normalizedSortOrder };

  const skip = (normalizedPage - 1) * normalizedLimit;

  const [tasks, total] = await Promise.all([
    Task.find(query).sort(sortOptions).skip(skip).limit(normalizedLimit),
    Task.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    tasks,
    pagination: {
      page: normalizedPage,
      limit: normalizedLimit,
      total,
      pages: Math.ceil(total / normalizedLimit) || 1,
    },
  });
});

// ========== keep task updates scoped to owner only ==========
const updateTask = asyncHandler(async (req, res) => {
  const { title, description, status, priority, dueDate } = req.body || {};

  if (status && !VALID_STATUS.includes(status)) {
    res.status(400);
    throw new Error('Invalid status value');
  }

  if (priority && !VALID_PRIORITY.includes(priority)) {
    res.status(400);
    throw new Error('Invalid priority value');
  }

  const existingTask = await Task.findById(req.params.id);
  ensureOwnership(existingTask, req.user.id, 'update');

  const updatePayload = {
    title,
    description,
    status,
    priority,
    dueDate,
  };

  const task = await Task.findByIdAndUpdate(req.params.id, updatePayload, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    task,
  });
});

// ========== delete should fail fast if task is missing or owned by someone else ==========
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  ensureOwnership(task, req.user.id, 'delete');

  await task.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Task deleted successfully',
  });
});

// ========== lightweight endpoint to mark task done ==========
const markTaskComplete = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  ensureOwnership(task, req.user.id, 'update');

  task.status = 'Done';
  await task.save();

  res.status(200).json({
    success: true,
    task,
  });
});

// ========== aggregate a simple dashboard summary ==========
const getTaskAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const tasks = await Task.find({ user: userId });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === 'Done').length;
  const pendingTasks = totalTasks - completedTasks;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const tasksByStatus = {
    Todo: tasks.filter((task) => task.status === 'Todo').length,
    'In Progress': tasks.filter((task) => task.status === 'In Progress').length,
    Done: completedTasks,
  };

  const tasksByPriority = {
    Low: tasks.filter((task) => task.priority === 'Low').length,
    Medium: tasks.filter((task) => task.priority === 'Medium').length,
    High: tasks.filter((task) => task.priority === 'High').length,
  };

  const now = new Date();
  const overdueTasks = tasks.filter((task) => task.dueDate < now && task.status !== 'Done').length;

  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const tasksDueThisWeek = tasks.filter(
    (task) => task.dueDate <= weekFromNow && task.dueDate >= now && task.status !== 'Done'
  ).length;

  res.status(200).json({
    success: true,
    analytics: {
      totalTasks,
      completedTasks,
      pendingTasks,
      completionPercentage,
      tasksByStatus,
      tasksByPriority,
      overdueTasks,
      tasksDueThisWeek,
    },
  });
});

module.exports = {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  markTaskComplete,
  getTaskAnalytics,
};
