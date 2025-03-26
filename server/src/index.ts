import dotenv from "dotenv"
import express from "express"
import cors from "cors"

// get routes
import { example } from "./routers/route-example";
import { chat } from "./routers/chat";

dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const app = express();

app.use(express.json({ limit: '100mb' }))
app.use(cors({
  origin: '*',
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type,Authorization'
}));
// // const allowedOrigins = ['http://localhost:3000'];
// app.use(express.json())
// app.use(cors({
//   origin: function (origin, callback) {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   methods: 'GET,POST,PUT,DELETE',
//   allowedHeaders: 'Content-Type,Authorization'
// }));

// use routes
app.use("/example", example);
app.use("/chat", chat);

app.get("/", (req, res) => {
  res.status(200).json({ status: "what's up" });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
