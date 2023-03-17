
## MongoDB

- Add ATLAS_URI to Environment following the format below:
```
ATLAS_URI=mongodb+srv://<username>:<password>@<host>/?retryWrites=true&w=majority
```
- Add collections:
```
history
list-key
menh-gia
soluonglixi
test-soluonglixi
test-list-key
```

## EmailJS
- Add a new Service and get the Service ID
- Add a new Template and get the Template ID
```
Hello {{to_name}},
Bạn {{nguoi_nhan_li_xi}} vừa rút được bao Lì Xì trị giá {{lixi}} đ.
Gửi Lì Xì qua {{method}} với SĐT này của bạn {{phoneNumber}}
Nhớ gửi đó nha :D
```
- Go to Account Setting and get Public Key and Private Key

- Add variables into Environment:
```
YOUR_SERVICE_ID=<service_id>
YOUR_PUBLIC_KEY=<public_key>
YOUR_PRIVATE_KEY=<private_key>
YOUR_TEMPLATE_ID=<template_id>
```

## Deploy
- Set ENVIRONMENT=prod
