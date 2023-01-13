var express = require("express");
var app = express();

require("dotenv").config();

const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const dbo = require("./db/conn");
const ENV = process.env.ENVIRONMENT || "test";
const TOKEN = process.env.TOKEN || "test-token";

const KIEM_TRA_PATH = "ki3mtr4-l1x1";
const THEM_PATH = "th3m-l1x1";

let DB_SOLUONGLIXI = "soluonglixi";
let DB_HISTORY = "history";
let DB_LIST_KEY = "list-key";
let DB_MENHGIA = "menh-gia";
let dbConnect;
if (ENV == "test") {
  DB_SOLUONGLIXI = "test-" + DB_SOLUONGLIXI;
  DB_LIST_KEY = "test-" + DB_LIST_KEY;
  DB_HISTORY = "test-" + DB_HISTORY;
}

/* Database */

async function addHistory(data) {
  const collection = dbConnect.collection(DB_HISTORY);
  await collection.insertOne(data);
}

async function findAll(colName) {
  return new Promise(function (resolve, reject) {
    dbConnect
      .collection(colName)
      .find({})
      .toArray(async function (err, result) {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
  });
}

async function findCollectionBy(colName, by, value) {
  const collection = dbConnect.collection(colName);
  var query = {};
  if (value != null) {
    //console.log("Find One ....");
    query[by] = value;
    return await collection.findOne(query, { projection: { _id: 0 } });
  } else {
    //console.log("Find All ....");
    return await findAll(colName);
  }
}

async function getMenhGiaById(value) {
  let menhgia = await findCollectionBy(DB_MENHGIA, "id", value);
  return menhgia;
}

async function getAllMenhGia() {
  return await findCollectionBy(DB_MENHGIA, "id", null);
}

async function themBaoLixi(data) {
  let menhgiaId = data.menhgiaId;
  var baoLiXi = await findCollectionBy(DB_SOLUONGLIXI, "menhgia_id", menhgiaId);
  let result;
  const collection = dbConnect.collection(DB_SOLUONGLIXI);

  if (baoLiXi != null) {
    let newTotal = baoLiXi.total + data.total;
    result = await collection.updateOne(
      { id: baoLiXi.id },
      { $set: { total: newTotal } }
    );
  } else {
    var newBaoLiXi = {
      menhgia_id: menhgiaId,
      total: data.total,
      use: 0,
    };
    result = await collection.insertOne(newBaoLiXi);
  }
  return true ? result : false;
}

async function updateBaoLixiIsUsed(menhgiaId) {
  const collection = dbConnect.collection(DB_SOLUONGLIXI);
  let baolixi = await collection.findOne(
    { menhgia_id: menhgiaId },
    { projection: { _id: 0 } }
  );
  let use = baolixi.use + 1;
  const result = await collection.updateOne(
    { menhgia_id: menhgiaId },
    { $set: { use: use } }
  );
}

async function updateBaoLiXi(data) {
  const collection = dbConnect.collection(DB_SOLUONGLIXI);
  return await collection.updateOne(
    { menhgia_id: data.menhgiaId },
    { $set: { use: data.use, total: data.total } }
  );
}

async function addKey(data) {
  const collection = dbConnect.collection(DB_LIST_KEY);
  return await collection.insertOne({ key: data.key, isUsed: data.isUsed });
}

async function updateKey(data) {
  const collection = dbConnect.collection(DB_LIST_KEY);
  return await collection.updateOne(
    { key: data.oldKey },
    { $set: { key: data.key, isUsed: data.isUsed } }
  );
}

async function getListKey() {
  return await findAll(DB_LIST_KEY);
}

async function getListBaoLiXi() {
  return await findAll(DB_SOLUONGLIXI);
}

async function getKey(key) {
  return await findCollectionBy(DB_LIST_KEY, "key", key);
}

async function themKey(listKey) {
  const collection = dbConnect.collection(DB_LIST_KEY);
  result = await collection.insertMany(listKey);
  return result;
}

async function updateKeyIsUsed(key) {
  const collection = dbConnect.collection(DB_LIST_KEY);
  const result = await collection.updateOne(
    { key: key },
    { $set: { isUsed: true } }
  );
}

async function clearKey() {
  const listKeyCol = dbConnect.collection(DB_LIST_KEY);
  await listKeyCol.remove();
}

async function clearLiXi() {
  const quantityLiXiCol = dbConnect.collection(DB_SOLUONGLIXI);
  await quantityLiXiCol.remove();
}

async function clearHistory() {
  const historyCol = dbConnect.collection(DB_HISTORY);
  await historyCol.remove();
}

async function clearKeyAndLiXi() {
  await clearKey();
  await clearLiXi();
}

async function clearAll() {
  await clearKeyAndLiXi();
  await clearHistory();
}

/* API */
app.get("/clear", async function (req, res) {
  /*  Params:
    token: from ENVIRONMENT
    method:
      - k: key
      - l: lixi
      - h: history
      - kl or lk: key & lx
      - 4ll: All 
  */
  var token = req.query.token;

  if (token != TOKEN) {
    return res.status(401).send("Ai cho đâu mà xóa :D");
  } else {
    var method = req.query.method;
    var msg = "Đã xóa hết ";
    switch (method) {
      case "k":
        await clearKey();
        msg += "Key";
        break;
      case "l":
        await clearLiXi();
        msg += "Lì xì";
        break;
      case "h":
        await clearHistory();
        msg += "History";
        break;
      case "kl":
        await clearKeyAndLiXi();
        msg += "Key và Lì Xì";
        break;
      case "lk":
        await clearKeyAndLiXi();
        msg += "Key và Lì Xì";
        break;
      case "4ll":
        await clearAll();
        msg += "tất cả";
        break;
      default:
        msg = "Không làm gì hết";
    }

    return res.status(200).send(msg);
  }
});

app.post("/api-them-lixi", async function (req, res) {
  const body = req.body;
  let result = true;
  for (var i = 0; i < body.length; i++) {
    if (body[i].soLuong > 0) {
      result =
        result &&
        (await themBaoLixi({ menhgiaId: body[i].id, total: body[i].soLuong }));
    }
  }

  if (result) {
    return res.status(200).send({});
  } else {
    return res.status(400).send({ msg: result });
  }
});

app.put("/nhan-lixi", async function (req, res) {
  const body = req.body;
  var key = body.key;
  let checkKey = await getKey(key);

  if (!checkKey) {
    return res.status(400).send({ msg: `Key '${key}' không hợp lệ` });
  } else {
    if (checkKey.isUsed) {
      return res
        .status(400)
        .send({ msg: `Lì xì của key '${key}' này đã có người lấy rồi` });
    } else {
      // List hết bao lì xì ra
      let listBaoLiXi = await getListBaoLiXi();
      // Lựa những bao còn giá available cho zô 1 list
      let listLiXiId = [];
      for (var i = 0; i < listBaoLiXi.length; i++) {
        if (listBaoLiXi[i].total - listBaoLiXi[i].use > 0) {
          listLiXiId.push(listBaoLiXi[i].menhgia_id);
        }
      }

      if (listLiXiId.length == 0) {
        return res.status(400).send({ msg: "Hết Bao Lì Xì rồi" });
      } else {
        // Random chọn 1 bao
        const lixiId =
          listLiXiId[Math.floor(Math.random() * listLiXiId.length)];

        // Update key đã sử dụng
        await updateKeyIsUsed(key);
        // update Bao lì xì đã sử dụng
        await updateBaoLixiIsUsed(lixiId);

        console.log("===== Nhận Lì xì =====");
        console.log(currentDate());
        console.log(`Lì Xì id: ${lixiId}`);

        let menhGiaDoc = await getMenhGiaById(lixiId);
        let menhGia = menhGiaDoc["menh-gia"];
        console.log(`Tiền: ${menhGia}`);
        console.log(`Name: ${body.name}`);
        //Param to Send Email
        params = {
          nguoi_nhan_li_xi: body.name,
          lixi: menhGia,
          method: body.method,
          phoneNumber: body.phoneNumber,
        };

        await addHistory({
          name: body.name,
          key: key,
          method: body.method,
          phoneNumber: body.phoneNumber,
          lixi: menhGia,
          message: body.message,
          params: params,
        });

        return res.status(200).send({
          name: body.name,
          key: key,
          method: body.method,
          phoneNumber: body.phoneNumber,
          lixi: menhGia,
          params: params,
          YOUR_SERVICE_ID: process.env.YOUR_SERVICE_ID,
          YOUR_TEMPLATE_ID: process.env.YOUR_TEMPLATE_ID,
          YOUR_PUBLIC_KEY: process.env.YOUR_PUBLIC_KEY,
        });
      }
    }
  }
});

app.put("/api-update-lixi", async function (req, res) {
  const body = req.body;
  let result = true;

  for (var i = 0; i < body.length; i++) {
    let checkBaoLiXi = await findCollectionBy(
      DB_SOLUONGLIXI,
      "menhgia_id",
      body[i].menhgiaId
    );

    if (checkBaoLiXi) {
      result = result && (await updateBaoLiXi(body[i]));
    } else {
      console.log("Tạo Bao Lì Xì zô Collection");
      result = result && (await themBaoLixi(body[i]));
    }
  }

  if (!result) {
    return res.status(400).send({ msg: "Bị lỗi gì rồi đại vương ơi" });
  } else {
    return res.status(200).send({ msg: "OK" });
  }
});

app.put("/api-update-key", async function (req, res) {
  const body = req.body;
  let result = true;

  for (var i = 0; i < body.length; i++) {
    if (body[i].oldKey == null) {
      console.log("Tạo Key zô Collection");
      result = result && (await addKey(body[i]));
    } else {
      let checkKey = await findCollectionBy(DB_LIST_KEY, "key", body[i].oldKey);
      if (checkKey) {
        result = result && (await updateKey(body[i]));
      } else {
        console.log("Tạo Key zô Collection");
        result = result && (await addKey(body[i]));
      }
    }
  }

  if (!result) {
    return res.status(400).send({ msg: "Bị lỗi gì rồi đại vương ơi" });
  } else {
    return res.status(200).send({ msg: "OK" });
  }
});

/* ROUTE */
app.get("/", function (req, res) {
  res.render("pages/index");
});

/* Obsolete */
/*
app.get(`/${THEM_PATH}`, function (req, res) {
  dbConnect
    .collection("menh-gia")
    .find({})
    .limit(50)
    .toArray(function (err, result) {
      if (err) {
        res.render("pages/ops");
      } else {
        res.render("pages/add-lixi", {
          listMenhGia: result,
        });
      }
    });
});
*/

app.get(`/${KIEM_TRA_PATH}`, async function (req, res) {
  var token = req.query.token;
  if (token != TOKEN) {
    return res.render("pages/ops");
  }
  let listBaoLiXi = [];
  result = await getAllMenhGia();
  for (var i = 0; i < result.length; i++) {
    let baolixi = await findCollectionBy(
      DB_SOLUONGLIXI,
      "menhgia_id",
      result[i].id
    );

    listBaoLiXi.push({
      total: baolixi ? baolixi.total : 0,
      use: baolixi ? baolixi.use : 0,
      menhgia: result[i]["menh-gia"],
      menhgiaId: result[i].id,
    });
  }
  var resultKeys = await getListKey();
  var listKey = [];
  for (var i = 0; i < resultKeys.length; i++) {
    listKey.push({
      key: resultKeys[i].key,
      isUsed: resultKeys[i].isUsed,
    });
  }

  // let totalBaoLiXi = 0;
  // for (var i = 0; i < listBaoLiXi.length; i++) {
  //   totalBaoLiXi += listBaoLiXi[i].total - listBaoLiXi[i].use;
  // }

  //let numberOfNewKey = totalBaoLiXi - listKey.length;

  // if (numberOfNewKey > 0) {
  //   let listNewKeys = [];
  //   // Update Key cho khớp với số bao lì xì
  //   for (var i = 0; i < totalBaoLiXi; i++) {
  //     listNewKeys.push({
  //       key: uuidv4().split("-")[0],
  //       isUsed: false,
  //     });
  //   }
  //   let resultAddKey = await themKey(listNewKeys);
  //   if (!resultAddKey) {
  //     res.render("pages/ops");
  //   }
  //   listKey = listKey.concat(listNewKeys);
  // }
  res.render("pages/kiemtra-lixi", {
    listBaoLiXi: listBaoLiXi,
    listKey: listKey,
  });
});

dbo.connectToServer(function (err) {
  if (err) {
    console.error(err);
    process.exit();
  }

  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
  });
  dbConnect = dbo.getDb();
});

function currentDate() {
  var currentdate = new Date();
  var datetime =
    "Last Sync: " +
    currentdate.getDate() +
    "/" +
    (currentdate.getMonth() + 1) +
    "/" +
    currentdate.getFullYear() +
    " @ " +
    currentdate.getHours() +
    ":" +
    currentdate.getMinutes() +
    ":" +
    currentdate.getSeconds();
  return datetime;
}
