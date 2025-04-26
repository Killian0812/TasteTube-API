// Scheduled Trigger: ANALYTICS_AGGREGATION
// Runs hourly to compute analytics for each restaurant (userId with role: RESTAURANT)
exports = async function () {
  console.log(
    `[${new Date().toISOString()}] Starting ANALYTICS_AGGREGATION trigger`
  );

  const db = context.services.get("KillianCluster").db("tastetube");
  const analyticsCollection = db.collection("analytics");
  const ordersCollection = db.collection("orders");
  const videosCollection = db.collection("videos");
  const usersCollection = db.collection("users");

  try {
    // Get all restaurant userIds
    console.log(`[${new Date().toISOString()}] Fetching restaurant IDs`);
    const restaurantIds = await usersCollection.distinct("_id", {
      role: "RESTAURANT",
    });
    console.log(
      `[${new Date().toISOString()}] Found ${restaurantIds.length} restaurants`
    );

    for (const restaurantId of restaurantIds) {
      try {
        console.log(
          `[${new Date().toISOString()}] Processing restaurant ID: ${restaurantId}`
        );

        // Define date range for the last 7 days
        const endDate = new Date();
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 7);

        // Aggregate orders data
        console.log(
          `[${new Date().toISOString()}] Aggregating orders for restaurant ${restaurantId}`
        );
        const ordersAgg = await ordersCollection
          .aggregate([
            {
              $match: {
                shopId: restaurantId,
                createdAt: { $gte: startDate, $lte: endDate },
                status: { $in: ["COMPLETED", "DELIVERY"] },
              },
            },
            {
              $group: {
                _id: {
                  day: { $dayOfWeek: "$createdAt" },
                },
                totalRevenue: { $sum: "$total" },
                orderCount: { $sum: 1 },
                products: {
                  $push: {
                    productId: "$items.product",
                    quantity: "$items.quantity",
                  },
                },
                categories: { $push: { categoryId: "$items.product" } },
                paymentMethod: { $push: "$paymentMethod" },
                customerId: { $addToSet: "$userId" },
              },
            },
          ])
          .toArray();
        console.log(
          `[${new Date().toISOString()}] Orders aggregated: ${ordersAgg.length}`
        );

        // Process daily sales
        const dailySales = {};
        const dayNames = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];
        let totalRevenue = 0;
        let totalOrders = 0;
        ordersAgg.forEach((day) => {
          dailySales[dayNames[day._id.day - 1]] = day.totalRevenue;
          totalRevenue += day.totalRevenue;
          totalOrders += day.orderCount;
        });

        // Calculate average order value
        const averageOrderValue =
          totalOrders > 0 ? totalRevenue / totalOrders : 0;
        console.log(
          `[${new Date().toISOString()}] Calculated: totalRevenue=${totalRevenue}, orderCount=${totalOrders}, avgOrderValue=${averageOrderValue}`
        );

        // Aggregate reviews
        console.log(
          `[${new Date().toISOString()}] Aggregating reviews for restaurant ${restaurantId}`
        );
        const reviewsAgg = await ordersCollection
          .aggregate([
            {
              $match: {
                shopId: restaurantId,
                createdAt: { $gte: startDate, $lte: endDate },
                "items.rating": { $ne: null },
              },
            },
            { $unwind: "$items" },
            {
              $group: {
                _id: {
                  $cond: [
                    { $gte: ["$items.rating", 4] },
                    "positive",
                    {
                      $cond: [
                        { $eq: ["$items.rating", 3] },
                        "neutral",
                        "negative",
                      ],
                    },
                  ],
                },
                count: { $sum: 1 },
              },
            },
          ])
          .toArray();

        let positiveReviews = 0;
        let neutralReviews = 0;
        let negativeReviews = 0;
        reviewsAgg.forEach((review) => {
          if (review._id === "positive") positiveReviews += review.count;
          else if (review._id === "neutral") neutralReviews += review.count;
          else negativeReviews += review.count;
        });
        console.log(
          `[${new Date().toISOString()}] Reviews: positive=${positiveReviews}, neutral=${neutralReviews}, negative=${negativeReviews}`
        );

        // Aggregate video views
        console.log(
          `[${new Date().toISOString()}] Aggregating video views for restaurant ${restaurantId}`
        );
        const videoViewsAgg = await videosCollection
          .aggregate([
            {
              $match: {
                userId: restaurantId,
                createdAt: { $gte: startDate, $lte: endDate },
              },
            },
            {
              $group: {
                _id: null,
                totalViews: { $sum: "$views" },
              },
            },
          ])
          .toArray();
        const videoViews = videoViewsAgg[0]?.totalViews || 0;
        console.log(`[${new Date().toISOString()}] Video views: ${videoViews}`);

        // Aggregate top products
        console.log(
          `[${new Date().toISOString()}] Aggregating top products for restaurant ${restaurantId}`
        );
        const productSalesAgg = await ordersCollection
          .aggregate([
            {
              $match: {
                shopId: restaurantId,
                createdAt: { $gte: startDate, $lte: endDate },
              },
            },
            {
              $unwind: "$items",
            },
            {
              $group: {
                _id: null,
                itemCount: { $sum: 1 },
              },
            },
            {
              $project: {
                itemCount: 1,
              },
            },
          ])
          .toArray();
        console.log(
          `[${new Date().toISOString()}] Items after unwind: ${
            productSalesAgg[0]?.itemCount || 0
          }`
        );

        const productSalesAggPipeline = await ordersCollection
          .aggregate([
            {
              $match: {
                shopId: restaurantId,
                createdAt: { $gte: startDate, $lte: endDate },
              },
            },
            { $unwind: "$items" },
            {
              $lookup: {
                from: "products",
                localField: "items.product",
                foreignField: "_id",
                as: "productInfo",
              },
            },
            {
              $addFields: {
                productInfoCount: { $size: "$productInfo" },
              },
            },
            {
              $match: {
                productInfoCount: { $gt: 0 },
              },
            },
            { $unwind: "$productInfo" },
            {
              $group: {
                _id: "$items.product",
                name: { $first: "$productInfo.name" },
                sales: { $sum: "$items.quantity" },
                revenue: {
                  $sum: { $multiply: ["$items.quantity", "$productInfo.cost"] },
                },
                rating: { $avg: "$items.rating" },
              },
            },
            { $sort: { revenue: -1 } },
            { $limit: 4 },
          ])
          .toArray();
        console.log(
          `[${new Date().toISOString()}] Product lookup results: ${JSON.stringify(
            productSalesAggPipeline.slice(0, 2)
          )}`
        );
        console.log(
          `[${new Date().toISOString()}] Top products aggregated: ${
            productSalesAggPipeline.length
          }`
        );

        const topProducts = productSalesAggPipeline.map((p) => ({
          name: p.name,
          sales: p.sales,
          revenue: p.revenue,
          rating: p.rating || 0,
        }));

        // Aggregate top categories
        console.log(
          `[${new Date().toISOString()}] Aggregating top categories for restaurant ${restaurantId}`
        );
        const categorySalesAggPipeline = await ordersCollection
          .aggregate([
            {
              $match: {
                shopId: restaurantId,
                createdAt: { $gte: startDate, $lte: endDate },
              },
            },
            { $unwind: "$items" },
            {
              $lookup: {
                from: "products",
                localField: "items.product",
                foreignField: "_id",
                as: "productInfo",
              },
            },
            {
              $addFields: {
                productInfoCount: { $size: "$productInfo" },
              },
            },
            {
              $match: {
                productInfoCount: { $gt: 0 },
              },
            },
            { $unwind: "$productInfo" },
            {
              $lookup: {
                from: "categories",
                localField: "productInfo.category",
                foreignField: "_id",
                as: "categoryInfo",
              },
            },
            {
              $addFields: {
                categoryInfoCount: { $size: "$categoryInfo" },
              },
            },
            {
              $match: {
                categoryInfoCount: { $gt: 0 },
              },
            },
            { $unwind: "$categoryInfo" },
            {
              $group: {
                _id: "$productInfo.category",
                name: { $first: "$categoryInfo.name" },
                sales: { $sum: "$items.quantity" },
                revenue: {
                  $sum: { $multiply: ["$items.quantity", "$productInfo.cost"] },
                },
              },
            },
            { $sort: { revenue: -1 } },
            { $limit: 3 },
          ])
          .toArray();
        console.log(
          `[${new Date().toISOString()}] Category lookup results: ${JSON.stringify(
            categorySalesAggPipeline.slice(0, 2)
          )}`
        );
        console.log(
          `[${new Date().toISOString()}] Top categories aggregated: ${
            categorySalesAggPipeline.length
          }`
        );

        // Calculate growth for categories
        console.log(
          `[${new Date().toISOString()}] Calculating category growth for restaurant ${restaurantId}`
        );
        const prevStartDate = new Date(startDate);
        prevStartDate.setDate(startDate.getDate() - 7);
        const prevCategorySales = await ordersCollection
          .aggregate([
            {
              $match: {
                shopId: restaurantId,
                createdAt: { $gte: prevStartDate, $lte: startDate },
              },
            },
            { $unwind: "$items" },
            {
              $lookup: {
                from: "products",
                localField: "items.product",
                foreignField: "_id",
                as: "productInfo",
              },
            },
            {
              $addFields: {
                productInfoCount: { $size: "$productInfo" },
              },
            },
            {
              $match: {
                productInfoCount: { $gt: 0 },
              },
            },
            { $unwind: "$productInfo" },
            {
              $group: {
                _id: "$productInfo.category",
                revenue: {
                  $sum: { $multiply: ["$items.quantity", "$productInfo.cost"] },
                },
              },
            },
          ])
          .toArray();
        console.log(
          `[${new Date().toISOString()}] Previous category sales: ${
            prevCategorySales.length
          }`
        );

        const topCategories = categorySalesAggPipeline.map((cat) => {
          const prevRev =
            prevCategorySales.find(
              (p) => p._id?.toString() === cat._id?.toString()
            )?.revenue || 0;
          const growth =
            prevRev > 0 ? ((cat.revenue - prevRev) / prevRev) * 100 : 0;
          return {
            name: cat.name,
            sales: cat.sales,
            revenue: cat.revenue,
            growth,
          };
        });

        // Calculate conversion rate
        const conversionRate =
          videoViews > 0 ? Math.min(totalOrders / videoViews, 1) * 100 : 0;
        console.log(
          `[${new Date().toISOString()}] Conversion rate: ${conversionRate}%`
        );

        // Aggregate customer data
        console.log(
          `[${new Date().toISOString()}] Aggregating customer data for restaurant ${restaurantId}`
        );
        const customerAgg = await ordersCollection
          .aggregate([
            {
              $match: {
                shopId: restaurantId,
                createdAt: { $gte: startDate, $lte: endDate },
              },
            },
            {
              $group: {
                _id: "$userId",
                firstOrderDate: { $min: "$createdAt" },
              },
            },
            {
              $group: {
                _id: {
                  $cond: [
                    { $lte: ["$firstOrderDate", startDate] },
                    "returning",
                    "new",
                  ],
                },
                count: { $sum: 1 },
              },
            },
          ])
          .toArray();

        let returningCustomers = 0;
        let newCustomers = 0;
        customerAgg.forEach((c) => {
          if (c._id === "returning") returningCustomers = c.count;
          else newCustomers = c.count;
        });
        console.log(
          `[${new Date().toISOString()}] Customers: returning=${returningCustomers}, new=${newCustomers}`
        );

        // Aggregate payment methods
        console.log(
          `[${new Date().toISOString()}] Aggregating payment methods for restaurant ${restaurantId}`
        );
        const paymentAgg = await ordersCollection
          .aggregate([
            {
              $match: {
                shopId: restaurantId,
                createdAt: { $gte: startDate, $lte: endDate },
                status: { $in: ["COMPLETED", "DELIVERY"] },
              },
            },
            {
              $group: {
                _id: "$paymentMethod",
                count: { $sum: 1 },
              },
            },
          ])
          .toArray();

        const paymentMethods = paymentAgg.map((p) => ({
          name: p._id || "Unknown",
          count: p.count,
          percentage: totalOrders > 0 ? (p.count / totalOrders) * 100 : 0,
        }));
        console.log(
          `[${new Date().toISOString()}] Payment methods aggregated: ${
            paymentMethods.length
          }`
        );

        // Get restaurant currency
        console.log(
          `[${new Date().toISOString()}] Fetching currency for restaurant ${restaurantId}`
        );
        const restaurant = await usersCollection.findOne({ _id: restaurantId });
        const currency = restaurant?.currency || "VND";

        // Construct AnalyticsData document
        const analyticsData = {
          shopId: restaurantId,
          date: endDate,
          totalRevenue,
          orderCount: totalOrders,
          averageOrderValue,
          dailySales,
          videoViews,
          positiveReviews,
          neutralReviews,
          negativeReviews,
          topProducts,
          topCategories,
          conversionRate,
          returningCustomers,
          newCustomers,
          paymentMethods,
          currency,
        };

        // Store in analytics collection
        console.log(
          `[${new Date().toISOString()}] Storing analytics data for restaurant ${restaurantId}`
        );
        await analyticsCollection.updateOne(
          { shopId: restaurantId, date: { $eq: endDate } },
          { $set: analyticsData },
          { upsert: true }
        );
        console.log(
          `[${new Date().toISOString()}] Analytics data stored successfully for restaurant ${restaurantId}`
        );
      } catch (error) {
        console.error(
          `[${new Date().toISOString()}] Error processing restaurant ${restaurantId}: ${
            error.message
          }`
        );
        continue; // Continue with the next restaurant
      }
    }
    console.log(
      `[${new Date().toISOString()}] ANALYTICS_AGGREGATION trigger completed successfully`
    );
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Fatal error in ANALYTICS_AGGREGATION trigger: ${
        error.message
      }`
    );
    throw error; // Rethrow to ensure trigger failure is recorded
  }
};
