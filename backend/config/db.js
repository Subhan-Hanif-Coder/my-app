import mongoose from "mongoose";

export const connectDB = async () => {
  await mongoose.connect('mongodb+srv://subhanhanifkhan1_db_user:oB7bS1eWJBrqd1GE@cluster0.kceydka.mongodb.net/my-app');
  console.log("DB Connected");
};