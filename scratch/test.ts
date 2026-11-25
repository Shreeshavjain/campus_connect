import mongoose from "mongoose";

const tokenPayload = { userId: "60f1b9b9b9b9b9b9b9b9b9b9" };
const userObjectId = new mongoose.Types.ObjectId(tokenPayload.userId);

const connected = [new mongoose.Types.ObjectId("60f1b9b9b9b9b9b9b9b9b9b8")];

const excluded = new Set<string>([
  userObjectId.toString(),
  ...connected.map((id) => id.toString()),
]);

const excludedIds = Array.from(excluded).map((id) => new mongoose.Types.ObjectId(id));

console.log("userObjectId:", userObjectId);
console.log("excluded array:", Array.from(excluded));
console.log("excludedIds:", excludedIds);
