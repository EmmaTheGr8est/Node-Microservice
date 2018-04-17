const express = require("express");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const thumbnailSize = require("./thumb/resize");
const request = require("request");
const resolve = require("path");
// const join = require("path");
// const readFileSync = require("fs");
// const createWriteStream = require("fs");
const path = require('path');


const app = express();

app.use(bodyParser.json());

// global.baseDirectory = path.resolve(__dirname);

app.post("/login", (req, res) => {
  // Mock user
  const user = {
    id: 1,
    username: "admin",
    password: "test"
  };
  jwt.sign({ user }, "secretkey", (err, token) => {
    res.json({
      token
    });
  });
});

app.post("/patch", verifyToken, (req, res, next) => {
  jwt.verify(req.token, "secretkey", err => {
    if (err) {
      res.sendStatus(403);
    } else if (typeof req.body.jsonObject === "undefined") {
      res.statusCode = 400;
      res.json({ message: "missing jsonObject" });
    } else if (typeof req.body.Patch === "undefined") {
      res.statusCode = 400;
      res.json({ message: "missing patch operations" });
    } else {
      let jsonObject = req.body.jsonObject;
      let operation = req.body.Patch;
      try {
        let patchDocument = apply_patch(jsonObject, operation);
        res.statusCode = 200;
        res.json({ patch: patchDocument });
      } catch (e) {
        res.statusCode = 400;
        res.json({ message: "wrong patch operations" });
      }
    }
  });
});

app.post("/thumbnail", verifyToken, (req, res, next) => {
  jwt.verify(req.token, "secretkey", err => {
    if (err) {
      res.sendStatus(403);
    } else if (typeof req.query.imageUrl !== "undefined") {
      let imageUrl = req.query.imageUrl;
      request.head(imageUrl, function(err, response, body) {
        if (err) {
          next(err);
        } else {
          let contentType = response.headers["content-type"].substring(0, 5);
          let imgFormat = response.headers["content-type"].substring(6);
          let date = response.headers["date"].split(" ").join("_");
          if (response.statusCode === 200 && contentType === "image") {
            if (response.headers["content-length"] <= 10 * 1024 * 1024) {
              const originalLocation =
                resolve(join(__dirname, "img")) +
                "/original_" +
                date +
                "." +
                imgFormat;
              const thumbnailLocation =
                resolve(join(__dirname, "img")) +
                "/thumbnail_" +
                date +
                "." +
                imgFormat;
              let stream = request
                .get(imageUrl)
                .pipe(createWriteStream(originalLocation));
              stream.on("finish", () => {
                thumbnailSize(
                  originalLocation,
                  thumbnailLocation,
                  (err, out) => {
                    if (err) {
                      next(err);
                    } else {
                      res.writeHead(200, {
                        "content-type": response.headers["content-type"],
                        Connection: "close"
                      });
                      res.end(readFileSync(thumbnailLocation), "binary");
                    }
                  }
                );
              });
            } else {
              res.status(400);
              res.json({ message: "image exceeds than 10 MB" });
            }
          } else {
            res.status(400);
            res.json({ message: "image not found" });
          }
        }
      });
    } else {
      res.status(400);
      res.json({ message: "url not found" });
    }
  });
});


function verifyToken(req, res, next) {
  // Get auth header value
  const bearerHeader = req.headers["authorization"];
  //   Check if bearer is undefined
  if (typeof bearerHeader !== "undefined") {
    //   Split at the space
    const bearer = bearerHeader.split(" ");
    // Get token from array
    const bearerToken = bearer[1];
    // Set the token
    req.token = bearerToken;
    // Next middleware
    next();
  } else {
    res.sendStatus(403);
  }
}

app.listen(5000, () => console.log("Server started on port 5000"));
