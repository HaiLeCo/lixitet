$(document).ready(function () {

  let flagFail = false;

  $("#nhan-lixi").click(function () {
    var data = getData();
    showSpinner();
    if (!data.flag) {
      $.ajax({
        type: 'PUT',
        url: '/nhan-lixi',
        data: JSON.stringify(data),
        success: function (msg) {
          showNhanLiXiModal(msg)
          sendEmail(msg);
        },
        error: function (err) {
          showError(err.responseJSON.msg)
        },
        contentType: "application/json",
        dataType: 'json'
      });

    }

  });




});

sendEmail = (data) => {
  var data = {
    service_id: data.YOUR_SERVICE_ID,
    template_id: data.YOUR_TEMPLATE_ID,
    user_id: data.YOUR_PUBLIC_KEY,
    template_params: data.params
  };

  $.ajax('https://api.emailjs.com/api/v1.0/email/send', {
    type: 'POST',
    data: JSON.stringify(data),
    contentType: 'application/json'
  }).done(function () {
    console.log('Your mail is sent!');
  }).fail(function (error) {
    console.log('Oops... ' + JSON.stringify(error));
  });
}

showSpinner = () => {
  $('#form-lixi').attr('disabled', true);
  $('#loader').show().delay(10000).fadeOut();
}

showError = (msg) => {
  $('.icon-box').css('background', "#ff3333")
  $('.modal-msg').text(msg)
  $('#errorModal').modal('show');
}

showNhanLiXiModal = (data) => {
  $('.icon-box').css('background', "#fff52e")
  $('#nhan-lixi-modal').modal('show');
  $('#congrat-name').text(`Chúc mừng ${data.name} đã nhận được lì xì`)
  $('#lixi-content').text(`${data.lixi}đ qua ${data.method}`)
}

function getData() {
  let key = $('#key').val();
  let name = $('#name').val();
  let phoneNumber = $('#phoneNumber').val();

  if (key === '' || name === '' || phoneNumber === '') {
    flagFail = true;
    showError('Sao không chịu điền thông tin vô')
  } else {
    flagFail = false;
  }

  let momo = $("#momo:checked").val()
  var method = "MoMo";
  if (!momo) {
    method = "ZaloPay"
  }

  return {
    key: key,
    name: name,
    method: method,
    phoneNumber: phoneNumber,
    flag: flagFail
  };
}