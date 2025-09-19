import express from "express";
const router = express.Router();
import Subscription from '../models/Subscription.js';
import Plan from "../models/Plan.js";
import User from "../models/User.js";

// ✅ Create subscription
router.post('/create', async (req, res) => {
  try {
    const { userId, planId, totalAmountPaid, status, totalGramsEarned, planStartDate, planEndDate } = req.body;

    const subscription = new Subscription({
      userId,
      planId,
      totalAmountPaid,
      status,
      totalGramsEarned,
      planStartDate,
      planEndDate,
    });

    await subscription.save();
    res.status(201).json({ success: true, subscription });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ✅ Get all subscriptions
router.get('/', async (req, res) => {
  try {
    const subscriptions = await Subscription.find()
      .populate('userId', 'name email address phoneNumber')
      .populate('planId', 'name planDuration fixedAmount');
    res.status(200).json({ success: true, subscriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Get subscriptions by UserId
router.get('/user/:userId', async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ userId: req.params.userId })
      .populate('planId', 'planName planDuration fixedAmount');
    res.status(200).json({ success: true, subscriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Update subscription by ID
router.put('/:id', async (req, res) => {
  try {
    const updatedSubscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json({ success: true, subscription: updatedSubscription });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});
// ✅ Get subscriptions by PlanId
router.get('/plan/:planId', async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ planId: req.params.planId })
      .populate('userId', 'username email phoneNumber')
      .populate('planId', 'planName planDuration fixedAmount');
    res.status(200).json({ success: true, subscriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Get subscriptions by Status
router.get('/status/:status', async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ status: req.params.status })
      .populate('userId', 'username email phoneNumber')
      .populate('planId', 'planName planDuration fixedAmount');
    res.status(200).json({ success: true, subscriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// ✅ Delete subscription by ID
router.delete('/:id', async (req, res) => {
  try {
    await Subscription.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Subscription deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// ✅ Get subscriptions with pagination
router.get('/paginated', async (req, res) => {
  try {
    let { page = 1, limit = 10, q, filter } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const pipeline = [
      // Join user data
      {
        $lookup: {
          from: 'users', // name of your users collection
          localField: 'userId',
          foreignField: '_id',
          as: 'userId'
        }
      },
      { $unwind: '$userId' },

      // Join plan data
      {
        $lookup: {
          from: 'plans', // name of your plans collection
          localField: 'planId',
          foreignField: '_id',
          as: 'planId'
        }
      },
      { $unwind: { path: '$planId', preserveNullAndEmptyArrays: true } },
    ];

    // Filtering
    if (q && filter) {
      if (filter === "username") {
        pipeline.push({ $match: { "userId.name": { $regex: q, $options: "i" } } });
      } else if (filter === "phone") {
        pipeline.push({ $match: { "userId.phone": { $regex: q, $options: "i" } } });
      } else if (filter === "planId") {
        pipeline.push({ $match: { "planId.name": { $regex: q, $options: "i" } } });
      } else if (filter === "status") {
        pipeline.push({ $match: { status: { $regex: q, $options: "i" } } });
      }
    }

    // Count total records
    const totalResult = await Subscription.aggregate([...pipeline, { $count: 'count' }]);
    const totalRecords = totalResult[0]?.count || 0;

    // Apply pagination
    pipeline.push({ $sort: { createdAt: -1 } });
    pipeline.push({ $skip: (page - 1) * limit });
    pipeline.push({ $limit: limit });

    const subscriptions = await Subscription.aggregate(pipeline);

    console.log(subscriptions)

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({
      success: true,
      page,
      limit,
      totalPages: Math.ceil(totalRecords / limit),
      totalRecords,
      subscriptions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});


export default router;
