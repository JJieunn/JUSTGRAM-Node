const http = require("http");
const cors = require("cors");
const express = require("express");

require("dotenv").config();
const { DataSource } = require("typeorm");
const { query } = require("express");

const app = express();
app.use(cors(), express.json());

const myDataSource = new DataSource({
  type: process.env.TYPEORM_CONNECTION,
  host: process.env.TYPEORM_HOST,
  port: process.env.TYPEORM_PORT,
  username: process.env.TYPEORM_USERNAME,
  password: process.env.TYPEORM_PASSWORD,
  database: process.env.TYPEORM_DATABASE,
});

myDataSource
  .initialize()
  .then(() => {
    console.log("Data Source has been initialized!");
  })
  .catch(() => {
    console.log("Data Source initialize failed..");
  });

// end point
app.post("/signup", (req, res) => {
  const { nickname, email, password, profile_image } = req.body;
  const queryRes = myDataSource.query(
    `INSERT INTO users(nickname, email, password, profile_image) VALUES (?, ?, ?, ?)`,
    [nickname, email, password, profile_image]
  );
  queryRes
    .then(() => {
      res.status(201).json({ message: "userCreated" });
    })
    .catch((err) => {
      res.status(500).json({ message: err });
    });
});

app.post("/post-create", (req, res) => {
  const { userID, contents, postImg_url } = req.body;
  const queryRes = myDataSource.query(
    `INSERT INTO posts (user_id, contents, postImg_url) VALUES (?, ?, ?)`,
    [userID, contents, postImg_url]
  );

  queryRes
    .then(() => {
      res.status(201).json({ message: "postCreated" });
    })
    .catch(() => {
      res.status(500).json({ message: "error" });
    });
});

app.get("/postlist", (req, res) => {
  let datas = [];
  const queryRes = myDataSource.query(
    "SELECT p.id, p.user_id, p.contents, p.postImg_url, u.profile_image FROM posts p INNER JOIN users u ON p.user_id = u.id"
  );

  queryRes
    .then((value) => {
      value.map((data) => {
        datas.push({
          userId: data.user_id,
          userProfileImage: data.profile_image,
          postingId: data.id,
          postingImageUrl: data.postImg_url,
          postingContent: data.contents,
        });
      });
      res.status(201).json({ data: datas });
    })
    .catch(() => {
      res.status(500).json({ message: "error" });
    });
});

app.patch("/post-modify", (req, res) => {
  const { id, content } = req.body;
  const queryRes = myDataSource.query(
    `SELECT p.id, p.postImg_url, p.contents, p.user_id, u.nickname FROM posts p INNER JOIN users u ON p.user_id = u.id WHERE p.id = ?`,
    [id]
  );

  queryRes
    .then((value) => {
      value[0].contents = content;
      myDataSource.query(`UPDATE posts SET contents = ? WHERE id = ?`, [
        content,
        id,
      ]);

      res.status(201).json({
        data: {
          userId: value[0].user_id,
          userName: value[0].nickname,
          postingId: value[0].id,
          postingImage: value[0].postImg_url,
          postingContent: value[0].contents,
        },
      });
    })
    .catch(() => {
      res.status(500).json({ message: "error" });
    });
});

app.delete("/post-delete", (req, res) => {
  const { id } = req.body;
  myDataSource
    .query(`DELETE FROM posts WHERE id = ?`, [id])
    .then(() => {
      res.status(201).json({ message: "postingDeleted" });
    })
    .catch(() => {
      res.status(500).json({ message: "error" });
    });
});

app.get("/user-PostList", (req, res) => {
  const { id } = req.body; // user id 값
  let postList = [];
  const queryRes = myDataSource.query(
    `SELECT u.id, u.profile_image, p.id, p.postImg_url, p.contents FROM users u JOIN posts p ON u.id = p.user_id WHERE u.id = ?`,
    [id]
  );

  queryRes
    .then((value) => {
      value.map((post) => {
        postList.push({
          postingId: post.id,
          postingImageUrl: post.postImg_url,
          postingContent: post.contents,
        });
      });
      res.status(201).json({
        data: {
          userId: id,
          userProfileImage: value[0].profile_image,
          postings: postList,
        },
      });
    })
    .catch(() => {
      res.status(500).json({ message: "error" });
    });
});

const server = http.createServer(app);

server.listen(8000, () => {
  console.log("server is listening on PORT 8000");
});
