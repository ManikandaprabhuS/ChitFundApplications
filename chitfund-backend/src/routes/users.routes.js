import express from "express";
import User from "../models/User.js";

const router = express.Router();

// ✅ Get all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get paginated users
router.get('/paginated', async (req, res) => {
  try {
    let { page = 1, limit = 10, q, filter } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const pipeline = [];

    // Filtering
    // Dynamic filtering
    if (q && filter) {
      const allowedFilters = ['name', 'email', 'phone', 'role'];
      if (allowedFilters.includes(filter)) {
        pipeline.push({
          $match: {
            [filter]: { $regex: q, $options: 'i' } // case-insensitive search
          }
        });
      }
    }
    
    // Count total records
    const totalResult = await User.aggregate([...pipeline, { $count: 'count' }]);
    const totalRecords = totalResult[0]?.count || 0;

    // Apply pagination
    pipeline.push({ $sort: { createdAt: -1 } });
    pipeline.push({ $skip: (page - 1) * limit });
    pipeline.push({ $limit: limit });

    const users = await User.aggregate(pipeline);

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({
      success: true,
      page,
      limit,
      totalPages: Math.ceil(totalRecords / limit),
      totalRecords,
      users
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Create new user
router.post("/", async (req, res) => {
  try {
    const { name, address, email, phone, pincode, username, password } = req.body;
    const newUser = new User({
      name,
      address,
      email,
      phone,
      pincode,
      username,
      passwordHash: password, // ⚠️ later hash this
    });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Get a single user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Update user by ID
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body; // contains fields to update
    const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true });
    if (!updatedUser) return res.status(404).json({ error: "User not found" });
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Delete user by ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



export default router;
