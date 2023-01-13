var OLD_BAOLIXI;
var OLD_KEY;
$(document).ready(function () {
  /* Bao Li Xi */
  OLD_BAOLIXI = getAllBaoLiXi();
  save();
  /* Key */
  addRow();
  OLD_KEY = getAllKey();
  saveKey();
});
/* Bao Li Xi */
function getAllBaoLiXi() {
  var oTable = document.getElementById("bao-lixi");
  var rowLength = oTable.rows.length;
  data = [];
  for (i = 1; i < rowLength; i++) {
    var id = oTable.rows[i].cells[0].closest("tr").getAttribute("menhgia-id");
    var total = oTable.rows[i].cells[1].getElementsByTagName("input")[0].value;
    var use = oTable.rows[i].cells[2].getElementsByTagName("input")[0].value;
    data.push({
      menhgiaId: parseInt(id),
      total: parseInt(total),
      use: parseInt(use),
    });
  }
  return data;
}

function save() {
  $("#save").click(function () {
    console.log("SAVE");
    newBaoLixi = getAllBaoLiXi();
    if (_.isEqual(OLD_BAOLIXI, newBaoLixi)) {
      showError("Có sửa gì đâu mà Save");
    } else {
      console.log("Send API update Data");
      let data = [];
      for (var i = 0; i < newBaoLixi.length; i++) {
        if (
          newBaoLixi[i].total != OLD_BAOLIXI[i].total ||
          newBaoLixi[i].use != OLD_BAOLIXI[i].use
        ) {
          data.push(newBaoLixi[i]);
        }
      }
      OLD_BAOLIXI = newBaoLixi;
      updateBaoLiXi(data);
    }
  });
}

function updateBaoLiXi(data) {
  $.ajax({
    type: "PUT",
    url: "/api-update-lixi",
    data: JSON.stringify(data),
    success: function () {
      showSuccess("Update xong roài đó");
      refreshUI(data);
    },
    error: function (err) {
      showError(err.responseJSON.msg);
    },
    contentType: "application/json",
    dataType: "json",
  });
}

showError = (msg) => {
  $(".icon-box").css("background", "#ff3333");
  $(".modal-msg").text(msg);
  $("#errorModal").modal("show");
};

showSuccess = (msg) => {
  $(".icon-box").css("background", "#18af36");
  $(".modal-msg").text(msg);
  $("#successModal").modal("show");
};

function refreshUI(data) {
  var oTable = document.getElementById("bao-lixi");
  var rowLength = oTable.rows.length;
  data.forEach((baolixi) => {
    for (i = 1; i < rowLength; i++) {
      var id = oTable.rows[i].cells[0].closest("tr").getAttribute("menhgia-id");
      if (parseInt(id) == parseInt(baolixi.menhgiaId)) {
        var total =
          oTable.rows[i].cells[1].getElementsByTagName("input")[0].value;
        var use =
          oTable.rows[i].cells[2].getElementsByTagName("input")[0].value;
        // Update 'Còn lại' UI:
        oTable.rows[i].cells[3].innerHTML = parseInt(total) - parseInt(use);
        break;
      }
    }
  });
}

/* Key */

function addRow() {
  var i = 1;
  $("#add_row").click(function () {
    $("#table-key").append(
      '<tr> <th scope="row"> <input class="form-control" value="" placeholder="Key"></th><td><select class="form-select" aria-label="false"><option value="true">true</option><option value="false" selected="">false</option></select></td></tr>'
    );
  });
}

function getAllKey() {
  var oTable = document.getElementById("table-key");
  var rowLength = oTable.rows.length;
  data = [];
  for (i = 1; i < rowLength; i++) {
    var oldKey = oTable.rows[i].cells[0].getAttribute("data-id");
    var key = oTable.rows[i].cells[0].getElementsByTagName("input")[0].value;
    var isUsed =
      oTable.rows[i].cells[1].getElementsByTagName("select")[0].value;
    data.push({
      oldKey: oldKey,
      key: key,
      isUsed: isUsed === "true",
    });
  }
  return data;
}

function saveKey() {
  $("#save_key").click(function (e) {
    e.preventDefault();
    var newKey = getAllKey();
    newKey = newKey.filter(function (el) {
      return el.key != "";
    });
    if (_.isEqual(OLD_KEY, newKey)) {
      showError("Có sửa gì đâu mà Save");
    } else {
      console.log("Send API to modify/add key");
      let data = [];
      // Data Cũ
      var updateData = newKey.filter(function (el) {
        return el.oldKey != null;
      });

      for (var i = 0; i < updateData.length; i++) {
        if (
          updateData[i].key != OLD_KEY[i].key ||
          updateData[i].isUsed != OLD_KEY[i].isUsed
        ) {
          data.push(updateData[i]);
        }
      }

      // New Data
      var newData = newKey.filter(function (el) {
        return el.oldKey == null;
      });
      data = data.concat(newData);
      updateKey(data);
    }
  });
}

function updateKey(data) {
  refreshTableKey(data);
  $.ajax({
    type: "PUT",
    url: "/api-update-key",
    data: JSON.stringify(data),
    success: function () {
      showSuccess("Update xong roài đó");
    },
    error: function (err) {
      showError(err.responseJSON.msg);
    },
    contentType: "application/json",
    dataType: "json",
  });
}

function refreshTableKey(data) {
  var oTable = document.getElementById("table-key");
  var rowLength = oTable.rows.length;
  data.forEach((item) => {
    for (i = 1; i < rowLength; i++) {
      var oldKey = oTable.rows[i].cells[0].getAttribute("data-id");
      if (oldKey === item.oldKey) {
        oTable.rows[i].cells[0].setAttribute("data-id", item.key);
        oTable.rows[i].cells[0].getElementsByTagName("input")[0].value =
          item.key;
        oTable.rows[i].cells[0]
          .getElementsByTagName("input")[0]
          .setAttribute("value", item.key);
        oTable.rows[i].cells[1]
          .getElementsByTagName("select")[0]
          .setAttribute("aria-label", item.isUsed);
        break;
      }
    }
  });
  OLD_KEY = getAllKey();
}
