var express = require('express');
var app = express();

require('dotenv').config()

const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const dbo = require('./db/conn');
const ENV = process.env.ENVIRONMENT || "test";

const KIEM_TRA_PATH = 'ki3mtr4-l1x1';
const THEM_PATH = 'th3m-l1x1';



let DB_SOLUONGLIXI = 'soluonglixi';
let DB_HISTORY = 'history';
let DB_LIST_KEY = 'list-key';
let DB_MENHGIA = 'menh-gia';
let dbConnect;
if (ENV == 'test') {
  DB_SOLUONGLIXI = 'test-' + DB_SOLUONGLIXI;
  DB_LIST_KEY = 'test-' + DB_LIST_KEY;
  DB_HISTORY = 'test-' + DB_HISTORY;
}

/* Database */

async function addHistory(data) {
  const collection = dbConnect.collection(DB_HISTORY);
  await collection.insertOne(data);
}

async function findCollectionBy(colName, by, value) {
  const collection = dbConnect.collection(colName);
  var query = {};
  query[by] = value;
  return await collection.findOne(query, { projection: { _id: 0 } });
}

async function getMenhGiaById(value) {
  let menhgia = await findCollectionBy(DB_MENHGIA, 'id', value)
  return menhgia['menh-gia']
}

async function themBaoLixi(data) {
  let menhgiaId = data.menhgiaId
  var baoLiXi = await findCollectionBy(DB_SOLUONGLIXI, 'menhgia_id', menhgiaId);
  console.log(baoLiXi)
  let result;
  const collection = dbConnect.collection(DB_SOLUONGLIXI);

  if (baoLiXi != null) {
    console.log("THÊM VÔ SỐ LƯỢNG TOTAL");
    let newTotal = baoLiXi.total + data.total;
    result = await collection.updateOne({ id: baoLiXi.id }, { $set: { total: newTotal } });
    console.log(result)
  } else {
    console.log("Tạo mới");
    var newBaoLiXi = {
      menhgia_id: menhgiaId,
      total: data.total,
      use: 0
    }
    result = await collection.insertOne(newBaoLiXi);
  }
  return true ? result : false;
}

async function updateBaoLixi(menhgiaId) {
  const collection = dbConnect.collection(DB_SOLUONGLIXI);
  let baolixi = await collection.findOne({ menhgia_id: menhgiaId }, { projection: { _id: 0 } });
  let use = baolixi.use + 1
  const result = await collection.updateOne({ menhgia_id: menhgiaId }, { $set: { use: use } });
}

async function getListKey() {
  return new Promise(function (resolve, reject) {
    dbConnect
      .collection(DB_LIST_KEY)
      .find({})
      .toArray(async function (err, result) {
        if (err) {
          return reject(err)
        }
        return resolve(result)
      })
  })
}

async function getListBaoLiXi() {
  return new Promise(function (resolve, reject) {
    dbConnect
      .collection(DB_SOLUONGLIXI)
      .find({})
      .toArray(async function (err, result) {
        if (err) {
          return reject(err)
        }
        return resolve(result)
      })
  })
}

async function getKey(key) {
  return await findCollectionBy(DB_LIST_KEY, 'key', key)
}

async function themKey(listKey) {
  const collection = dbConnect.collection(DB_LIST_KEY);
  result = await collection.insertMany(listKey);
  return result
}

async function updateKeyIsUsed(key) {
  const collection = dbConnect.collection(DB_LIST_KEY);
  const result = await collection.updateOne({ key: key }, { $set: { isUsed: true } });
}

/* API */
app.post('/api-them-lixi', async function (req, res) {
  const body = req.body;
  let result = true
  for (var i = 0; i < body.length; i++) {
    if (body[i].soLuong > 0) {
      result = result && await themBaoLixi({ menhgiaId: body[i].id, total: body[i].soLuong })
    }
  }

  if (result) {
    return res.status(200).send({})
  } else {
    return res.status(400).send({ msg: result })
  }

})

app.put('/nhan-lixi', async function (req, res) {
  const body = req.body;
  var key = body.key;
  let checkKey = await getKey(key);

  if (!checkKey) {
    return res.status(400).send({ msg: `Key '${key}' không hợp lệ` })
  } else {
    if (checkKey.isUsed) {
      return res.status(400).send({ msg: `Lì xì của key '${key}' này đã có người lấy rồi` })
    } else {

      // List hết bao lì xì ra
      let listBaoLiXi = await getListBaoLiXi();
      // Lựa những bao còn giá available cho zô 1 list
      let listLiXiId = [];
      for (var i = 0; i < listBaoLiXi.length; i++) {
        if (listBaoLiXi[i].total - listBaoLiXi[i].use > 0) {
          listLiXiId.push(listBaoLiXi[i].menhgia_id);
          console.log(listBaoLiXi[i].menhgia_id)
        }
      }

      if (listLiXiId.length == 0) {
        return res.status(400).send({ msg: "Hết Bao Lì Xì rồi" })
      } else {

        // Random chọn 1 bao
        const lixiId = listLiXiId[Math.floor(Math.random() * listLiXiId.length)];

        // Update key đã sử dụng
        await updateKeyIsUsed(key)
        // update Bao lì xì đã sử dụng
        await updateBaoLixi(lixiId)

        let menhGia = await getMenhGiaById(lixiId);

        //Param to Send Email
        params = {
          nguoi_nhan_li_xi: body.name,
          lixi: menhGia,
          method: body.method,
          phoneNumber: body.phoneNumber
        }

        await addHistory({
          name: body.name,
          key: key,
          method: body.method,
          phoneNumber: body.phoneNumber,
          lixi: menhGia,
          message: body.message,
          params: params
        })

        return res.status(200).send({
          name: body.name,
          key: key,
          method: body.method,
          phoneNumber: body.phoneNumber,
          lixi: menhGia,
          params: params,
          YOUR_SERVICE_ID: process.env.YOUR_SERVICE_ID,
          YOUR_TEMPLATE_ID: process.env.YOUR_TEMPLATE_ID,
          YOUR_PUBLIC_KEY: process.env.YOUR_PUBLIC_KEY
        })

      }
    }
  }


})


/* ROUTE */
app.get('/', function (req, res) {
  res.render('pages/index');
});


app.get(`/${THEM_PATH}`, function (req, res) {
  dbConnect
    .collection('menh-gia')
    .find({})
    .limit(50)
    .toArray(function (err, result) {
      if (err) {
        res.render('pages/ops')
      } else {
        res.render('pages/add-lixi', {
          listMenhGia: result
        });
      }
    });
});

app.get(`/${KIEM_TRA_PATH}`, async function (req, res) {
  let result = await getListBaoLiXi();
  let listBaoLiXi = [];
  for (var i = 0; i < result.length; i++) {
    listBaoLiXi.push(
      {
        total: result[i].total,
        use: result[i].use,
        menhgia: await getMenhGiaById(result[i].menhgia_id)
      }
    )
  }
  var resultKeys = await getListKey();
  var listKey = []
  for (var i = 0; i < resultKeys.length; i++) {
    listKey.push(
      {
        key: resultKeys[i].key,
        isUsed: resultKeys[i].isUsed,
      }
    )
  }

  let totalBaoLiXi = 0
  for (var i = 0; i < listBaoLiXi.length; i++) {
    totalBaoLiXi += listBaoLiXi[i].total - listBaoLiXi[i].use
  }

  let numberOfNewKey = totalBaoLiXi - listKey.length

  if (numberOfNewKey > 0) {
    let listNewKeys = []
    // Update Key cho khớp với số bao lì xì
    for (var i = 0; i < totalBaoLiXi; i++) {
      listNewKeys.push(
        {
          key: uuidv4().split('-')[0],
          isUsed: false
        }
      );
    }
    let resultAddKey = await themKey(listNewKeys)
    if (!resultAddKey) {
      res.render('pages/ops')
    }
    listKey = listKey.concat(listNewKeys);
  }

  res.render('pages/kiemtra-lixi', {
    listBaoLiXi: listBaoLiXi,
    listKey: listKey
  });
})


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
