import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";

export const analyticsData = async (req, res) => {
  try {
    const data = await getAnalyticsData();

    const startDate = new Date(endDate.getDate() - 7 * 24 * 60 * 60 * 1000);
    const endDate = new Date();

    const dailySalesData = await getDailySalesData(startDate, endDate);

    res.status(200).json({ success: true, analyticsData, dailySalesData });
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch analytics data" });
  }
};

async function getAnalyticsData() {
  const totalUsers = await User.countDocuments();
  const totalProducts = await Product.countDocuments();

  const salesData = await Order.aggregate([
    {
      $group: {
        _id: null,
        totalSales: { $sum: 1 },
        totalRevenue: { $sum: "$totalAmount" },
      },
    },
  ]);

  const [totalSales, totalRevenue] = salesData[0] || {
    totalSales: 0,
    totalRevenue: 0,
  };

  return {
    users: totalUsers,
    products: totalProducts,
    totalSales,
    totalRevenue,
  };
}

async function getDailySalesData(startDate, endDate) {
  try {
    const dailySalesData = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          sales: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    const dateArray = getDatesInRange(startDate, endDate);

    return dateArray.map((date) => {
      const foundData = dailySalesData.find((item) => item._id === date);
      return {
        date,
        sales: foundData?.sales || 0,
        revenue: foundData?.revenue || 0,
      };
    });
  } catch (error) {
    console.error("Error fetching daily sales data:", error);
    return [];
  }
}

function getDatesInRange(startDate, endDate) {
  const dates = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split("T")[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}
