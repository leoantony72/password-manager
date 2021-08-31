import express, { Request, Response } from "express";
require("dotenv").config();
const client = require("./config/database");
import cors from "cors";
const { encrypt, decrypt } = require("./encryptionHandler");

const app = express();

app.use(cors());
app.use(express.json());

app.post("/addpassword", async (req: Request, res: Response) => {
  const { title, password } = req.body;
  if (!title || !password) {
    return res.json("Title and Password cannot be blank");
  }
  const hashedPassword = await encrypt(password);

  await client.query("BEGIN");
  const addPassword = await client.query(
    "INSERT INTO password (title,password,iv) VALUES($1,$2,$3)",
    [title, hashedPassword.password, hashedPassword.iv],
    async (err: any, result: any) => {
      if (err) {
        await client.query("ROLLBACK");
        console.log(err);
        res.json({ error: "An Error Occured" });
      } else {
        await client.query("COMMIT");
        res.json({ success: "Password Added" });
      }
    }
  );
});

app.get("/showpassword", async (req: Request, res: Response) => {
  client.query("SELECT * FROM password", (err: any, result: any) => {
    if (err) {
      console.log(err);
      res.json({ error: "An Error Occured" });
    }
    res.json(result.rows);
  });
});

app.post("/decryptpassword", (req, res) => {
  res.send(decrypt(req.body));
});

app.listen(process.env.PORT, () => {
  console.log(`Server Running At http://localhost:${process.env.PORT}`);
});
