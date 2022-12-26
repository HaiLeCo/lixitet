$(document).ready(function () {


  $("#btn-add-lixi").click(function () {
    var data = getData();
    $.ajax({
      type: 'POST',
      url: '/api-them-lixi',
      data:  JSON.stringify (data),
      success: function() { 
        $('#successModal').modal('show');
        $(location).attr('href','/kiemtra-lixi')
      },
      error: function() {
        showError();
      },
      contentType: "application/json",
      dataType: 'json'
  });
  });




});

showError = () => {
  $('#errorModal').modal('show');
}

function getData() {
  let data = [];
  $('.txt-add-lixi').each(function () {
    var soLuong = parseInt($(this).val());
    if (isNaN(soLuong)) {
      soLuong = 0;
    }
    var id = parseInt($(this).attr("id"));
    if (soLuong > 10 || soLuong < 0) {
      showError();
    }
    data.push({ id: id, soLuong: soLuong })
  });
  return data;
}