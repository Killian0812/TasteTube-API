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

  var counter = await countercollection.findOneAndUpdate(
    { _id: doc.shopId },
    { $inc: { seq_value: 1 } },
    { returnNewDocument: true, upsert: true }
  );
  var updateRes = await ordercollection.updateOne(
    { _id: doc._id },
    { $set: { orderNum: counter.seq_value } }
  );

  console.log(
    `Updated ${JSON.stringify(changeEvent.ns)} with counter ${
      counter.seq_value
    } result : ${JSON.stringify(updateRes)}`
  );
};
