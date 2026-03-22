const Review = require('../models/Review');
const Complaint = require('../models/Complaint');
const User = require('../models/User');

/**
 * Recalculate a supplier's rating based on reviews and complaints.
 * Formula: avgReviewRating - (complaintPenalty)
 * Each unresolved complaint reduces rating by 0.1 (capped)
 */
const recalculateRating = async (supplierId) => {
  try {
    // Get average review rating
    const reviewStats = await Review.aggregate([
      { $match: { supplierId: supplierId } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    // Count active complaints (non-resolved)
    const activeComplaints = await Complaint.countDocuments({
      supplierId,
      status: { $in: ['open', 'investigating'] }
    });

    let rating = 0;
    let totalReviews = 0;

    if (reviewStats.length > 0) {
      rating = reviewStats[0].avgRating;
      totalReviews = reviewStats[0].count;
      
      // Penalty: each active complaint reduces rating by 0.1 (min 1.0)
      const penalty = activeComplaints * 0.1;
      rating = Math.max(1.0, rating - penalty);
      rating = Math.round(rating * 10) / 10;
    }

    await User.findByIdAndUpdate(supplierId, { rating, totalReviews });
    return { rating, totalReviews };
  } catch (error) {
    console.error('Error recalculating rating:', error);
    throw error;
  }
};

module.exports = { recalculateRating };
