export const firebaseConfig = {
  type: process.env["FIREBASE_TYPE"] || "service_account",
  projectId: process.env["FIREBASE_PROJECT_ID"] || "zippypay-test",
  privateKeyId: process.env["FIREBASE_PRIVATE_KEY_ID"] || "2c4c65f8795d4dcc8a68714529ce978e4e851b22",
  privateKey: (
    process.env["FIREBASE_PRIVATE_KEY"] ||
    "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCueqeFM0CwORoD\noWGFITnDb7iPmfGiLrx+nHWqTbtc456q13SD2U7tNhp8ROh6RwspDUBdE/R6tyBe\n5BgQP161s0Y7WvqxbKsPI0G/tsSJzo6o4BXZwC1bgj6zkUeawnxtL2T3DiJwvrVm\nBO/37PSm2b/nW1jKHeQz9HZLPA7by7Gp+hAQPojxX0i82cDIU0Ezsc/cIBUcyQ/V\n2N5HrmwRRsvsZ80AtzlojbrjOYfgta4ABRKqT/4ih5NP1Zj0b2/K/YsRP3cLtOPZ\n/1g62w3qXVMxoJEplnLkS2vjn12KUCzg9C5UwNJZNGp8bM0IITagUNqhexlY5X3a\nfJP5/ukTAgMBAAECggEACCoa8t7LzQZtaYET03Gs4DCdcsuYPoFJ9osmVTJ8LRcS\nCPPtcr2bwpOqPpyc2+fwi9qGY5sE8PizwSz5B7DN1kCa1AYB8bgTjLEW9dXwF9pW\nDtOMwjRxCuirCKaomQNqMVPEuWwF//LONNI2hnC/0mghewqC7gZJdB+63CXMNJjq\nO8u3MqPwMJcMLEE3LXubys2ebAH0WQRt2iJJk+xe8ZZuryEXVC/ipGVinhsOAopD\npVQy2+HB4SRkTW13PfVqb3JYG1a6wq7Hl4joQb+qQkexB7mfEMXBGq6sSFRhrnpT\nG/7p3d/MD3WAJxYzOEdJorsR33NDzRXlBUVi/aqQFQKBgQDU/kfD7MTxCOaiZoxy\nn59NzZoe9dNIvdvgH2DQPanjxc+JGjAH09/SwiPThIwyJ336WnHzHYN0bEL+mVp1\njfwJ/lLI/GMbXPDd58W5q2ZL60TsysNYk7RvdlFKhuyxzqY8NF9g0jFUiv4Zns8t\n+CLrqbFAZ1oymQng9ENmQNjodwKBgQDRtY80PiBUGv0ZF97HUXMKdm2ak1eYffLZ\nREbpJku3XwKJeKPvcQqNr4TOsdbsBmC7ZwNXxgvgHHAvjaempCknRQ0qRV/xjG2Z\n6ry6x4anmwKWJkPbc0ekAw2GaUXKVtkDmug91G4FwIZvvJZxFb6KPNgZgNjuZm3O\nZ3zIIHsHRQKBgA4YWcV0eL/+t8yNfsPjHla2wXlFCVtp/RAC45REUGbbY1WOXxlV\ngx1ebaKExgZXqLWVoK7XCCj/NRvGKD9ZSxGaO/5C/YgFCYeV2/biid2CT0hgTrcg\n5zLtIIoPDcDijQu0547vugX/QLuPT+SZ5C22SB2b+VMZ35Z8c61jozcXAoGBAKAy\nogK2stuNAmt44KZCgi8r6O58QB4tmKaAkerpZk3eNoHtts3i/LzfqAR9tkD3Xk3K\nk7Mph0jccJbjD38tSILHLRdth61uKQu7VhEY+rRupbst4Ah0N/YCnwJeyQGY9o7a\ndy9EaAfc2tXgqswYYEYZ1LsmwpDbjmZuh9QZe+JBAoGBAMXg2J0zmvf1oma5JCRb\no9Yw52Goru+uTX19vmRvZEbBXMORGCZ+YB35eWkEmbIxnLp2LBsYrAr8gbJTcfjp\nLqydfUfRkNAw+7fnGNUcJ+VwfGsnM/y1zzCsZYv3jHgxJr0+J+UeGzU4guXGLaUY\n4M4/rUi+f7oBs32anos3Bs4J\n-----END PRIVATE KEY-----\n"
  ).replace(/\\n/g, "\n"),
  clientEmail: process.env["FIREBASE_EMAIL_CLIENT"] || "firebase-adminsdk-qd1r5@zippypay-test.iam.gserviceaccount.com",
  clientId: process.env["FIREBASE_CLIENT_ID"] || "109708169711206366468",
  authUri: process.env["FIREBASE_AUTH_URI"] || "https://accounts.google.com/o/oauth2/auth",
  tokenUri: process.env["FIREBASE_TOKEN_URI"] || "https://oauth2.googleapis.com/token",
  authProviderX509CertUrl: process.env["FIREBASE_AUTH_PROVIDER_CERT_URL"] || "https://www.googleapis.com/oauth2/v1/certs",
  clientX509CertUrl:
    process.env["FIREBASE_CLIENT_CERT_URL"] ||
    "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-qd1r5%40zippypay-test.iam.gserviceaccount.com",
  universe_domain: process.env["FIREBASE_UNIVERSE_DOMAIN"] || "googleapis.com",
  storage_bucket: process.env["FIREBASE_STORAGE_BUCKET"] || "gs://zippypay-test.appspot.com",
} as const;
