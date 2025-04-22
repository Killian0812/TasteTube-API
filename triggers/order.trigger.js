// Database Trigger: AUTO_INCREMENT_ORDER_NUM
// Trigger on insert to the orders collection
exports = async function (changeEvent) {
  var doc = changeEvent.fullDocument;

  const countercollection = context.services
    .get("KillianCluster")
    .db(changeEvent.ns.db)
    .collection("counters");
  const ordercollection = context.services
    .get("KillianCluster")
    .db(changeEvent.ns.db)
    .collection(changeEvent.ns.coll);

  // Get the current date in 'YYYYMMDD' format
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
  const day = currentDate.getDate().toString().padStart(2, "0");
  const formattedDate = `${year}${month}${day}`;
  const shopAndDate = `${doc.shopId.toString()}-${formattedDate}`;

  var counter = await countercollection.findOneAndUpdate(
    { _id: shopAndDate },
    { $inc: { value: 1 } },
    { returnNewDocument: true, upsert: true }
  );

  var orderId = `${formattedDate}-${counter.value}`;

  var updateRes = await ordercollection.updateOne(
    { _id: doc._id },
    { $set: { orderNum: counter.value, orderId: orderId } }
  );

  console.log(
    `Updated ${JSON.stringify(changeEvent.ns)} with orderNum: ${
      counter.value
    }, orderId: ${orderId}, result: ${JSON.stringify(updateRes)}`
  );
};
