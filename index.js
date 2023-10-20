const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const SSLCommerzPayment = require("sslcommerz-lts");
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const store_id = process.env.STORE_ID;
const store_passwd = process.env.STORE_PASS;
const is_live = false; //true for live, false for sandbox

app.get("/", (req, res) => {
  res.send("CSE FROM HOME SERVER IS RUNNING....");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@mogodb-practice.uoisaxb.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

console.log(uri);
async function dataBase() {
  try {
    const courseCollection = client.db("cse-from-home").collection("courses");
    const enrollCollection = client.db("cse-from-home").collection("enroll");

    app.get("/courses", async (req, res) => {
      const query = {};
      const result = await courseCollection.find(query).toArray();
      res.send({
        message: "success",
        data: result,
      });
    });
    app.get("/course/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: ObjectId(id) };
      const courseById = await courseCollection.findOne(query);
      res.send({
        message: "success",
        data: courseById,
      });
    });

    app.post("/checkout", async (req, res) => {
      const paymentData = req.body;
      const transactionId = new ObjectId().toString();

      const data = {
        total_amount: paymentData.total_amount,
        currency: "BDT",
        tran_id: transactionId, // use unique tran_id for each api call
        success_url: `https://cse-from-home-server.vercel.app/payment/success?transactionId=${transactionId}`,
        fail_url: "http://localhost:3030/fail",
        cancel_url: "http://localhost:3030/cancel",
        ipn_url: "http://localhost:3030/ipn",
        shipping_method: "Courier",
        product_name: paymentData.product_name,
        product_category: "Electronic",
        product_profile: "general",
        cus_name: paymentData.cus_name,
        cus_email: paymentData.cus_email,
        cus_add1: "Dhaka",
        cus_add2: "Dhaka",
        cus_city: "Dhaka",
        cus_state: "Dhaka",
        cus_postcode: "1000",
        cus_country: "Bangladesh",
        cus_phone: paymentData.cus_phone,
        cus_fax: "01711111111",
        ship_name: "Customer Name",
        ship_add1: "Dhaka",
        ship_add2: "Dhaka",
        ship_city: "Dhaka",
        ship_state: "Dhaka",
        ship_postcode: 1000,
        ship_country: "Bangladesh",
      };
      const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
      sslcz.init(data).then((apiResponse) => {
        console.log(apiResponse);
        // Redirect the user to payment gateway
        let GatewayPageURL = apiResponse.GatewayPageURL;

        enrollCollection.insertOne({
          transactionId,
          studentName: paymentData.cus_name,
          email: paymentData.cus_email,
          studentPhone: paymentData.cus_phone,
          courseName: paymentData.product_name,
          paid: false,
        });
        res.send({ url: GatewayPageURL, transactionId });
      });
    });

    app.post("/payment/success", async (req, res) => {
      const { transactionId } = req.query;
      // res.redirect(`https://cse-from-home-app.web.app/user?transactionId=${transactionId}`)
      const result = await enrollCollection.updateOne(
        { transactionId },
        {
          $set: { paid: true, paidAt: new Date() },
        }
      );
      if (result.modifiedCount > 0) {
        res.redirect(
          `https://cse-from-home-app.web.app/payment/success?transactionId=${transactionId}`
        );
      }
    });

    app.get("/enrollInfo", async (req, res) => {
      const transactionId = req.query.tranSactionId;
      const query = { transactionId };
      const result = await enrollCollection.findOne(query);
      console.log(transactionId);
      res.send({
        message: "success",
        data: result,
      });
    });

    app.get("/my-courses/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await enrollCollection.find(query).toArray();
      res.send(result);
    });
  } catch (error) {
    console.log(error);
  }
}

dataBase();

app.listen(port, () => {
  console.log("CSE From Server Is Running on ", port);
});
