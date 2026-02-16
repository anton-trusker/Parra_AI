Summary
URL: https://parra.syrve.app/api/store/get/10638
Status: 200 OK
Source: Network
Address: 185.185.49.118:443
Initiator: 
polyfills.js:7:32047

Request
GET /api/store/get/10638 HTTP/1.1
Accept: application/json, text/plain, */*
Accept-Encoding: gzip, deflate, br
Accept-Language: "en_GB"
Connection: keep-alive
Cookie: PHPSESSID=gsidkdejajj51f7b7usp6b1b8i
Priority: u=3, i
Referer: https://parra.syrve.app/configuration/index.html
Sec-Fetch-Dest: empty
Sec-Fetch-Mode: cors
Sec-Fetch-Site: same-origin
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.2 Safari/605.1.15

Response
HTTP/1.1 200 OK
Cache-Control: max-age=0, must-revalidate, private
Content-Type: application/json
Date: Sun, 15 Feb 2026 22:17:52 GMT
Expires: Sun, 15 Feb 2026 22:17:52 GMT
pid: 39795bd5-748f-47de-bb19-5f6b45a735ef
Strict-Transport-Security: max-age=0; includeSubDomains; preload
Transfer-Encoding: chunked


{
    "id": 10638,
    "name": "Parra",
    "template": {
        "id": 7342,
        "name": "Default",
        "isExpress": true,
        "isDelco": false,
        "isDineIn": false
    },
    "workingHours": {
        "Monday": {
            "open": "06:00",
            "close": "04:00",
            "preset": true
        },
        "Tuesday": {
            "open": "06:00",
            "close": "04:00",
            "preset": true
        },
        "Wednesday": {
            "open": "06:00",
            "close": "04:00",
            "preset": true
        },
        "Thursday": {
            "open": "06:00",
            "close": "04:00",
            "preset": true
        },
        "Friday": {
            "open": "06:00",
            "close": "04:00",
            "preset": true
        },
        "Saturday": {
            "open": "06:00",
            "close": "04:00",
            "preset": true
        },
        "Sunday": {
            "open": "06:00",
            "close": "04:00",
            "preset": true
        }
    },
    "templates": [
        {
            "id": 7342,
            "name": "Default",
            "isExpress": true,
            "isDelco": false,
            "isDineIn": false
        }
    ],
    "delcoTerminals": [],
    "isAliveConnection": true,
    "lat": "38.7082622",
    "lng": "-9.1547408",
    "terminalId": null,
    "properties": {
        "generalProperties": {
            "addressString": "Lisboa, Lisboa, 90, Rua da Esperança",
            "address": {
                "country_name": "",
                "country": "",
                "region": "",
                "city": "",
                "street_line": "Lisboa, Lisboa, 90, Rua da Esperança",
                "comment": "",
                "postal_code": ""
            },
            "departments": [],
            "userModifiedAddress": false,
            "intervalAmendments": []
        },
        "delcoProperties": {
            "useBiz": false,
            "activeTerminalGroupIds": []
        },
        "expressProperties": [],
        "dineInProperties": [],
        "inventoryProperties": {
            "storages": [
                {
                    "id": "1239d270-1bbe-f64f-b7ea-5f00518ef508",
                    "name": "Kitchen storage",
                    "code": "01",
                    "gln": "",
                    "storageType": "KITCHEN_1",
                    "deleted": false
                },
                {
                    "id": "f7f7562c-f6dd-486b-b259-ca72ec4529de",
                    "name": "Bar storage",
                    "code": "02",
                    "gln": "",
                    "storageType": "BAR_1",
                    "deleted": false
                },
                {
                    "id": "eee13b09-dfe2-487a-9635-27f75a16afc8",
                    "name": "Хозтовары и инвентарь",
                    "code": "03",
                    "gln": "",
                    "storageType": "",
                    "deleted": false
                },
                {
                    "id": "51c0b1a3-f8fc-4639-9f6c-37f484e0f455",
                    "name": "Boa Hora storage",
                    "code": "04",
                    "gln": "",
                    "storageType": "BAR_2",
                    "deleted": false
                },
                {
                    "id": "fedb65bd-78d1-4252-bb76-ccd0c596b0c6",
                    "name": "Storage for return",
                    "code": "",
                    "gln": "",
                    "storageType": "",
                    "deleted": false
                }
            ],
            "defaultStorageId": "1239d270-1bbe-f64f-b7ea-5f00518ef508"
        },
        "overrideTaxes": null
    },
    "timezone": "Europe/Lisbon",
    "timezoneList": [
        {
            "code": "Pacific/Midway",
            "name": "Pacific/Midway",
            "offset": "-39600",
            "offsetInHours": "-11:00",
            "fullName": "(UTC-11:00) Pacific/Midway"
        },
        {
            "code": "Pacific/Niue",
            "name": "Pacific/Niue",
            "offset": "-39600",
            "offsetInHours": "-11:00",
            "fullName": "(UTC-11:00) Pacific/Niue"
        },
        {
            "code": "Pacific/Pago_Pago",
            "name": "Pacific/Pago-Pago",
            "offset": "-39600",
            "offsetInHours": "-11:00",
            "fullName": "(UTC-11:00) Pacific/Pago-Pago"
        },
        {
            "code": "America/Adak",
            "name": "America/Adak",
            "offset": "-36000",
            "offsetInHours": "-10:00",
            "fullName": "(UTC-10:00) America/Adak"
        },
        {
            "code": "Pacific/Honolulu",
            "name": "Pacific/Honolulu",
            "offset": "-36000",
            "offsetInHours": "-10:00",
            "fullName": "(UTC-10:00) Pacific/Honolulu"
        },
        {
            "code": "Pacific/Rarotonga",
            "name": "Pacific/Rarotonga",
            "offset": "-36000",
            "offsetInHours": "-10:00",
            "fullName": "(UTC-10:00) Pacific/Rarotonga"
        },
        {
            "code": "Pacific/Tahiti",
            "name": "Pacific/Tahiti",
            "offset": "-36000",
            "offsetInHours": "-10:00",
            "fullName": "(UTC-10:00) Pacific/Tahiti"
        },
        {
            "code": "Pacific/Marquesas",
            "name": "Pacific/Marquesas",
            "offset": "-34200",
            "offsetInHours": "-10:30",
            "fullName": "(UTC-10:30) Pacific/Marquesas"
        },
        {
            "code": "America/Anchorage",
            "name": "America/Anchorage",
            "offset": "-32400",
            "offsetInHours": "-9:00",
            "fullName": "(UTC-9:00) America/Anchorage"
        },
        {
            "code": "America/Juneau",
            "name": "America/Juneau",
            "offset": "-32400",
            "offsetInHours": "-9:00",
            "fullName": "(UTC-9:00) America/Juneau"
        },
        {
            "code": "America/Metlakatla",
            "name": "America/Metlakatla",
            "offset": "-32400",
            "offsetInHours": "-9:00",
            "fullName": "(UTC-9:00) America/Metlakatla"
        },
        {
            "code": "America/Nome",
            "name": "America/Nome",
            "offset": "-32400",
            "offsetInHours": "-9:00",
            "fullName": "(UTC-9:00) America/Nome"
        },
        {
            "code": "America/Sitka",
            "name": "America/Sitka",
            "offset": "-32400",
            "offsetInHours": "-9:00",
            "fullName": "(UTC-9:00) America/Sitka"
        },
        {
            "code": "America/Yakutat",
            "name": "America/Yakutat",
            "offset": "-32400",
            "offsetInHours": "-9:00",
            "fullName": "(UTC-9:00) America/Yakutat"
        },
        {
            "code": "Pacific/Gambier",
            "name": "Pacific/Gambier",
            "offset": "-32400",
            "offsetInHours": "-9:00",
            "fullName": "(UTC-9:00) Pacific/Gambier"
        },
        {
            "code": "America/Los_Angeles",
            "name": "America/Los-Angeles",
            "offset": "-28800",
            "offsetInHours": "-8:00",
            "fullName": "(UTC-8:00) America/Los-Angeles"
        },
        {
            "code": "America/Tijuana",
            "name": "America/Tijuana",
            "offset": "-28800",
            "offsetInHours": "-8:00",
            "fullName": "(UTC-8:00) America/Tijuana"
        },
        {
            "code": "America/Vancouver",
            "name": "America/Vancouver",
            "offset": "-28800",
            "offsetInHours": "-8:00",
            "fullName": "(UTC-8:00) America/Vancouver"
        },
        {
            "code": "Pacific/Pitcairn",
            "name": "Pacific/Pitcairn",
            "offset": "-28800",
            "offsetInHours": "-8:00",
            "fullName": "(UTC-8:00) Pacific/Pitcairn"
        },
        {
            "code": "America/Boise",
            "name": "America/Boise",
            "offset": "-25200",
            "offsetInHours": "-7:00",
            "fullName": "(UTC-7:00) America/Boise"
        },
        {
            "code": "America/Cambridge_Bay",
            "name": "America/Cambridge-Bay",
            "offset": "-25200",
            "offsetInHours": "-7:00",
            "fullName": "(UTC-7:00) America/Cambridge-Bay"
        },
        {
            "code": "America/Ciudad_Juarez",
            "name": "America/Ciudad_Juarez",
            "offset": "-25200",
            "offsetInHours": "-7:00",
            "fullName": "(UTC-7:00) America/Ciudad_Juarez"
        },
        {
            "code": "America/Creston",
            "name": "America/Creston",
            "offset": "-25200",
            "offsetInHours": "-7:00",
            "fullName": "(UTC-7:00) America/Creston"
        },
        {
            "code": "America/Dawson",
            "name": "America/Dawson",
            "offset": "-25200",
            "offsetInHours": "-7:00",
            "fullName": "(UTC-7:00) America/Dawson"
        },
        {
            "code": "America/Dawson_Creek",
            "name": "America/Dawson-Creek",
            "offset": "-25200",
            "offsetInHours": "-7:00",
            "fullName": "(UTC-7:00) America/Dawson-Creek"
        },
        {
            "code": "America/Denver",
            "name": "America/Denver",
            "offset": "-25200",
            "offsetInHours": "-7:00",
            "fullName": "(UTC-7:00) America/Denver"
        },
        {
            "code": "America/Edmonton",
            "name": "America/Edmonton",
            "offset": "-25200",
            "offsetInHours": "-7:00",
            "fullName": "(UTC-7:00) America/Edmonton"
        },
        {
            "code": "America/Fort_Nelson",
            "name": "America/Fort Nelson",
            "offset": "-25200",
            "offsetInHours": "-7:00",
            "fullName": "(UTC-7:00) America/Fort Nelson"
        },
        {
            "code": "America/Hermosillo",
            "name": "America/Hermosillo",
            "offset": "-25200",
            "offsetInHours": "-7:00",
            "fullName": "(UTC-7:00) America/Hermosillo"
        },
        {
            "code": "America/Inuvik",
            "name": "America/Inuvik",
            "offset": "-25200",
            "offsetInHours": "-7:00",
            "fullName": "(UTC-7:00) America/Inuvik"
        },
        {
            "code": "America/Mazatlan",
            "name": "America/Mazatlan",
            "offset": "-25200",
            "offsetInHours": "-7:00",
            "fullName": "(UTC-7:00) America/Mazatlan"
        },
        {
            "code": "America/Phoenix",
            "name": "America/Phoenix",
            "offset": "-25200",
            "offsetInHours": "-7:00",
            "fullName": "(UTC-7:00) America/Phoenix"
        },
        {
            "code": "America/Whitehorse",
            "name": "America/Whitehorse",
            "offset": "-25200",
            "offsetInHours": "-7:00",
            "fullName": "(UTC-7:00) America/Whitehorse"
        },
        {
            "code": "America/Bahia_Banderas",
            "name": "America/Bahia-Banderas",
            "offset": "-21600",
            "offsetInHours": "-6:00",
            "fullName": "(UTC-6:00) America/Bahia-Banderas"
        },
        {
            "code": "America/Belize",
            "name": "America/Belize",
            "offset": "-21600",
            "offsetInHours": "-6:00",
            "fullName": "(UTC-6:00) America/Belize"
        },
        {
            "code": "America/Chicago",
            "name": "America/Chicago",
            "offset": "-21600",
            "offsetInHours": "-6:00",
            "fullName": "(UTC-6:00) America/Chicago"
        },
        {
            "code": "America/Chihuahua",
            "name": "America/Chihuahua",
            "offset": "-21600",
            "offsetInHours": "-6:00",
            "fullName": "(UTC-6:00) America/Chihuahua"
        },
        {
            "code": "America/Costa_Rica",
            "name": "America/Costa-Rica",
            "offset": "-21600",
            "offsetInHours": "-6:00",
            "fullName": "(UTC-6:00) America/Costa-Rica"
        },
        {
            "code": "America/El_Salvador",
            "name": "America/El-Salvador",
            "offset": "-21600",
            "offsetInHours": "-6:00",
            "fullName": "(UTC-6:00) America/El-Salvador"
        },
        {
            "code": "America/Guatemala",
            "name": "America/Guatemala",
            "offset": "-21600",
            "offsetInHours": "-6:00",
            "fullName": "(UTC-6:00) America/Guatemala"
        },
        {
            "code": "America/Indiana/Knox",
            "name": "America/Indiana/Knox",
            "offset": "-21600",
            "offsetInHours": "-6:00",
            "fullName": "(UTC-6:00) America/Indiana/Knox"
        },
        {
            "code": "America/Indiana/Tell_City",
            "name": "America/Indiana/Tell-City",
            "offset": "-21600",
            "offsetInHours": "-6:00",
            "fullName": "(UTC-6:00) America/Indiana/Tell-City"
        },
        {
            "code": "America/Managua",
            "name": "America/Managua",
            "offset": "-21600",
            "offsetInHours": "-6:00",
            "fullName": "(UTC-6:00) America/Managua"
        },
        {
            "code": "America/Matamoros",
            "name": "America/Matamoros",
            "offset": "-21600",
            "offsetInHours": "-6:00",
            "fullName": "(UTC-6:00) America/Matamoros"
        },
        {
            "code": "America/Menominee",
            "name": "America/Menominee",
            "offset": "-21600",
            "offsetInHours": "-6:00",
            "fullName": "(UTC-6:00) America/Menominee"
        },
        {
            "code": "America/Merida",
            "name": "America/Merida",
            "offset": "-21600",
            "offsetInHours": "-6:00",
            "fullName": "(UTC-6:00) America/Merida"
        },
        {
            "code": "America/Mexico_City",
            "name": "America/Mexico City",
            "offset": "-21600",
            "offsetInHours": "-6:00",
            "fullName": "(UTC-6:00) America/Mexico City"
        },
        {
            "code": "America/Monterrey",
            "name": "America/Monterrey",
            "offset": "-21600",
            "offsetInHours": "-6:00",
            "fullName": "(UTC-6:00) America/Monterrey"
        },
        {
            "code": "America/North_Dakota/Beulah",
            "name": "America/North Dakota/Beulah",
            "offset": "-21600",
            "offsetInHours": "-6:00",
            "fullName": "(UTC-6:00) America/North Dakota/Beulah"
        },
        {
            "code": "America/North_Dakota/Center",
            "name": "America/North Dakota/Center",
            "offset": "-21600",
            "offsetInHours": "-6:00",
            "fullName": "(UTC-6:00) America/North Dakota/Center"
        },
        {
            "code": "America/North_Dakota/New_Salem",
            "name": "America/North Dakota/New-Salem",
            "offset": "-21600",
            "offsetInHours": "-6:00",
            "fullName": "(UTC-6:00) America/North Dakota/New-Salem"
        },
        {
            "code": "America/Ojinaga",
            "name": "America/Ojinaga",
            "offset": "-21600",
            "offsetInHours": "-6:00",
            "fullName": "(UTC-6:00) America/Ojinaga"
        },
        {
            "code": "America/Rankin_Inlet",
            "name": "America/Ranki-Inlet",
            "offset": "-21600",
            "offsetInHours": "-6:00",
            "fullName": "(UTC-6:00) America/Ranki-Inlet"
        },
        {
            "code": "America/Regina",
            "name": "America/Regina",
            "offset": "-21600",
            "offsetInHours": "-6:00",
            "fullName": "(UTC-6:00) America/Regina"
        },
        {
            "code": "America/Resolute",
            "name": "America/Resolute",
            "offset": "-21600",
            "offsetInHours": "-6:00",
            "fullName": "(UTC-6:00) America/Resolute"
        },
        {
            "code": "America/Swift_Current",
            "name": "America/Swift Current",
            "offset": "-21600",
            "offsetInHours": "-6:00",
            "fullName": "(UTC-6:00) America/Swift Current"
        },
        {
            "code": "America/Tegucigalpa",
            "name": "America/Tegucigalpa",
            "offset": "-21600",
            "offsetInHours": "-6:00",
            "fullName": "(UTC-6:00) America/Tegucigalpa"
        },
        {
            "code": "America/Winnipeg",
            "name": "America/Winnipeg",
            "offset": "-21600",
            "offsetInHours": "-6:00",
            "fullName": "(UTC-6:00) America/Winnipeg"
        },
        {
            "code": "Pacific/Galapagos",
            "name": "Pacific/Galapagos",
            "offset": "-21600",
            "offsetInHours": "-6:00",
            "fullName": "(UTC-6:00) Pacific/Galapagos"
        },
        {
            "code": "America/Atikokan",
            "name": "America/Atikokan",
            "offset": "-18000",
            "offsetInHours": "-5:00",
            "fullName": "(UTC-5:00) America/Atikokan"
        },
        {
            "code": "America/Bogota",
            "name": "America/Bogota",
            "offset": "-18000",
            "offsetInHours": "-5:00",
            "fullName": "(UTC-5:00) America/Bogota"
        },
        {
            "code": "America/Cancun",
            "name": "America/Cancun",
            "offset": "-18000",
            "offsetInHours": "-5:00",
            "fullName": "(UTC-5:00) America/Cancun"
        },
        {
            "code": "America/Cayman",
            "name": "America/Cayman",
            "offset": "-18000",
            "offsetInHours": "-5:00",
            "fullName": "(UTC-5:00) America/Cayman"
        },
        {
            "code": "America/Detroit",
            "name": "America/Detroit",
            "offset": "-18000",
            "offsetInHours": "-5:00",
            "fullName": "(UTC-5:00) America/Detroit"
        },
        {
            "code": "America/Eirunepe",
            "name": "America/Eirunepe",
            "offset": "-18000",
            "offsetInHours": "-5:00",
            "fullName": "(UTC-5:00) America/Eirunepe"
        },
        {
            "code": "America/Grand_Turk",
            "name": "America/Grand-Turk",
            "offset": "-18000",
            "offsetInHours": "-5:00",
            "fullName": "(UTC-5:00) America/Grand-Turk"
        },
        {
            "code": "America/Guayaquil",
            "name": "America/Guayaquil",
            "offset": "-18000",
            "offsetInHours": "-5:00",
            "fullName": "(UTC-5:00) America/Guayaquil"
        },
        {
            "code": "America/Havana",
            "name": "America/Havana",
            "offset": "-18000",
            "offsetInHours": "-5:00",
            "fullName": "(UTC-5:00) America/Havana"
        },
        {
            "code": "America/Indiana/Indianapolis",
            "name": "America/Indiana/Indianapolis",
            "offset": "-18000",
            "offsetInHours": "-5:00",
            "fullName": "(UTC-5:00) America/Indiana/Indianapolis"
        },
        {
            "code": "America/Indiana/Marengo",
            "name": "America/Indiana/Marengo",
            "offset": "-18000",
            "offsetInHours": "-5:00",
            "fullName": "(UTC-5:00) America/Indiana/Marengo"
        },
        {
            "code": "America/Indiana/Petersburg",
            "name": "America/Indiana/Petersburg",
            "offset": "-18000",
            "offsetInHours": "-5:00",
            "fullName": "(UTC-5:00) America/Indiana/Petersburg"
        },
        {
            "code": "America/Indiana/Vevay",
            "name": "America/Indiana/Vevay",
            "offset": "-18000",
            "offsetInHours": "-5:00",
            "fullName": "(UTC-5:00) America/Indiana/Vevay"
        },
        {
            "code": "America/Indiana/Vincennes",
            "name": "America/Indiana/Vincennes",
            "offset": "-18000",
            "offsetInHours": "-5:00",
            "fullName": "(UTC-5:00) America/Indiana/Vincennes"
        },
        {
            "code": "America/Indiana/Winamac",
            "name": "America/Indiana/Winamac",
            "offset": "-18000",
            "offsetInHours": "-5:00",
            "fullName": "(UTC-5:00) America/Indiana/Winamac"
        },
        {
            "code": "America/Iqaluit",
            "name": "America/Iqaluit",
            "offset": "-18000",
            "offsetInHours": "-5:00",
            "fullName": "(UTC-5:00) America/Iqaluit"
        },
        {
            "code": "America/Jamaica",
            "name": "America/Jamaica",
            "offset": "-18000",
            "offsetInHours": "-5:00",
            "fullName": "(UTC-5:00) America/Jamaica"
        },
        {
            "code": "America/Kentucky/Louisville",
            "name": "America/Kentucky/Louisville",
            "offset": "-18000",
            "offsetInHours": "-5:00",
            "fullName": "(UTC-5:00) America/Kentucky/Louisville"
        },
        {
            "code": "America/Kentucky/Monticello",
            "name": "America/Kentucky/Monticello",
            "offset": "-18000",
            "offsetInHours": "-5:00",
            "fullName": "(UTC-5:00) America/Kentucky/Monticello"
        },
        {
            "code": "America/Lima",
            "name": "America/Lima",
            "offset": "-18000",
            "offsetInHours": "-5:00",
            "fullName": "(UTC-5:00) America/Lima"
        },
        {
            "code": "America/Nassau",
            "name": "America/Nassau",
            "offset": "-18000",
            "offsetInHours": "-5:00",
            "fullName": "(UTC-5:00) America/Nassau"
        },
        {
            "code": "America/New_York",
            "name": "America/New-York",
            "offset": "-18000",
            "offsetInHours": "-5:00",
            "fullName": "(UTC-5:00) America/New-York"
        },
        {
            "code": "America/Panama",
            "name": "America/Panama",
            "offset": "-18000",
            "offsetInHours": "-5:00",
            "fullName": "(UTC-5:00) America/Panama"
        },
        {
            "code": "America/Port-au-Prince",
            "name": "America/Port-au-Prince",
            "offset": "-18000",
            "offsetInHours": "-5:00",
            "fullName": "(UTC-5:00) America/Port-au-Prince"
        },
        {
            "code": "America/Rio_Branco",
            "name": "America/Rio-Branco",
            "offset": "-18000",
            "offsetInHours": "-5:00",
            "fullName": "(UTC-5:00) America/Rio-Branco"
        },
        {
            "code": "America/Toronto",
            "name": "America/Toronto",
            "offset": "-18000",
            "offsetInHours": "-5:00",
            "fullName": "(UTC-5:00) America/Toronto"
        },
        {
            "code": "Pacific/Easter",
            "name": "Pacific/Easter",
            "offset": "-18000",
            "offsetInHours": "-5:00",
            "fullName": "(UTC-5:00) Pacific/Easter"
        },
        {
            "code": "America/Anguilla",
            "name": "America/Anguilla",
            "offset": "-14400",
            "offsetInHours": "-4:00",
            "fullName": "(UTC-4:00) America/Anguilla"
        },
        {
            "code": "America/Antigua",
            "name": "America/Antigua",
            "offset": "-14400",
            "offsetInHours": "-4:00",
            "fullName": "(UTC-4:00) America/Antigua"
        },
        {
            "code": "America/Aruba",
            "name": "America/Aruba",
            "offset": "-14400",
            "offsetInHours": "-4:00",
            "fullName": "(UTC-4:00) America/Aruba"
        },
        {
            "code": "America/Barbados",
            "name": "America/Barbados",
            "offset": "-14400",
            "offsetInHours": "-4:00",
            "fullName": "(UTC-4:00) America/Barbados"
        },
        {
            "code": "America/Blanc-Sablon",
            "name": "America/Blanc-Sablon",
            "offset": "-14400",
            "offsetInHours": "-4:00",
            "fullName": "(UTC-4:00) America/Blanc-Sablon"
        },
        {
            "code": "America/Boa_Vista",
            "name": "America/Boa-Vista",
            "offset": "-14400",
            "offsetInHours": "-4:00",
            "fullName": "(UTC-4:00) America/Boa-Vista"
        },
        {
            "code": "America/Campo_Grande",
            "name": "America/Campo-Grande",
            "offset": "-14400",
            "offsetInHours": "-4:00",
            "fullName": "(UTC-4:00) America/Campo-Grande"
        },
        {
            "code": "America/Caracas",
            "name": "America/Caracas",
            "offset": "-14400",
            "offsetInHours": "-4:00",
            "fullName": "(UTC-4:00) America/Caracas"
        },
        {
            "code": "America/Cuiaba",
            "name": "America/Cuiaba",
            "offset": "-14400",
            "offsetInHours": "-4:00",
            "fullName": "(UTC-4:00) America/Cuiaba"
        },
        {
            "code": "America/Curacao",
            "name": "America/Curacao",
            "offset": "-14400",
            "offsetInHours": "-4:00",
            "fullName": "(UTC-4:00) America/Curacao"
        },
        {
            "code": "America/Dominica",
            "name": "America/Dominica",
            "offset": "-14400",
            "offsetInHours": "-4:00",
            "fullName": "(UTC-4:00) America/Dominica"
        },
        {
            "code": "America/Glace_Bay",
            "name": "America/Glace Bay",
            "offset": "-14400",
            "offsetInHours": "-4:00",
            "fullName": "(UTC-4:00) America/Glace Bay"
        },
        {
            "code": "America/Goose_Bay",
            "name": "America/Goose Bay",
            "offset": "-14400",
            "offsetInHours": "-4:00",
            "fullName": "(UTC-4:00) America/Goose Bay"
        },
        {
            "code": "America/Grenada",
            "name": "America/Grenada",
            "offset": "-14400",
            "offsetInHours": "-4:00",
            "fullName": "(UTC-4:00) America/Grenada"
        },
        {
            "code": "America/Guadeloupe",
            "name": "America/Guadeloupe",
            "offset": "-14400",
            "offsetInHours": "-4:00",
            "fullName": "(UTC-4:00) America/Guadeloupe"
        },
        {
            "code": "America/Guyana",
            "name": "America/Guyana",
            "offset": "-14400",
            "offsetInHours": "-4:00",
            "fullName": "(UTC-4:00) America/Guyana"
        },
        {
            "code": "America/Halifax",
            "name": "America/Halifax",
            "offset": "-14400",
            "offsetInHours": "-4:00",
            "fullName": "(UTC-4:00) America/Halifax"
        },
        {
            "code": "America/Kralendijk",
            "name": "America/Kralendijk",
            "offset": "-14400",
            "offsetInHours": "-4:00",
            "fullName": "(UTC-4:00) America/Kralendijk"
        },
        {
            "code": "America/La_Paz",
            "name": "America/La-Paz",
            "offset": "-14400",
            "offsetInHours": "-4:00",
            "fullName": "(UTC-4:00) America/La-Paz"
        },
        {
            "code": "America/Lower_Princes",
            "name": "America/Lower-Princes",
            "offset": "-14400",
            "offsetInHours": "-4:00",
            "fullName": "(UTC-4:00) America/Lower-Princes"
        },
        {
            "code": "America/Manaus",
            "name": "America/Manaus",
            "offset": "-14400",
            "offsetInHours": "-4:00",
            "fullName": "(UTC-4:00) America/Manaus"
        },
        {
            "code": "America/Marigot",
            "name": "America/Marigot",
            "offset": "-14400",
            "offsetInHours": "-4:00",
            "fullName": "(UTC-4:00) America/Marigot"
        },
        {
            "code": "America/Martinique",
            "name": "America/Martinique",
            "offset": "-14400",
            "offsetInHours": "-4:00",
            "fullName": "(UTC-4:00) America/Martinique"
        },
        {
            "code": "America/Moncton",
            "name": "America/Moncton",
            "offset": "-14400",
            "offsetInHours": "-4:00",
            "fullName": "(UTC-4:00) America/Moncton"
        },
        {
            "code": "America/Montserrat",
            "name": "America/Montserrat",
            "offset": "-14400",
            "offsetInHours": "-4:00",
            "fullName": "(UTC-4:00) America/Montserrat"
        },
        {
            "code": "America/Port_of_Spain",
            "name": "America/Port of Spain",
            "offset": "-14400",
            "offsetInHours": "-4:00",
            "fullName": "(UTC-4:00) America/Port of Spain"
        },
        {
            "code": "America/Porto_Velho",
            "name": "America/Porto Velho",
            "offset": "-14400",
            "offsetInHours": "-4:00",
            "fullName": "(UTC-4:00) America/Porto Velho"
        },
        {
            "code": "America/Puerto_Rico",
            "name": "America/Puerto-Rico",
            "offset": "-14400",
            "offsetInHours": "-4:00",
            "fullName": "(UTC-4:00) America/Puerto-Rico"
        },
        {
            "code": "America/Santo_Domingo",
            "name": "America/Santo-Domingo",
            "offset": "-14400",
            "offsetInHours": "-4:00",
            "fullName": "(UTC-4:00) America/Santo-Domingo"
        },
        {
            "code": "America/St_Barthelemy",
            "name": "America/St.Barthelemy",
            "offset": "-14400",
            "offsetInHours": "-4:00",
            "fullName": "(UTC-4:00) America/St.Barthelemy"
        },
        {
            "code": "America/St_Kitts",
            "name": "America/St.Kitts",
            "offset": "-14400",
            "offsetInHours": "-4:00",
            "fullName": "(UTC-4:00) America/St.Kitts"
        },
        {
            "code": "America/St_Lucia",
            "name": "America/St.Lucia",
            "offset": "-14400",
            "offsetInHours": "-4:00",
            "fullName": "(UTC-4:00) America/St.Lucia"
        },
        {
            "code": "America/St_Thomas",
            "name": "America/St.Thomas",
            "offset": "-14400",
            "offsetInHours": "-4:00",
            "fullName": "(UTC-4:00) America/St.Thomas"
        },
        {
            "code": "America/St_Vincent",
            "name": "America/St.Vincent",
            "offset": "-14400",
            "offsetInHours": "-4:00",
            "fullName": "(UTC-4:00) America/St.Vincent"
        },
        {
            "code": "America/Thule",
            "name": "America/Thule",
            "offset": "-14400",
            "offsetInHours": "-4:00",
            "fullName": "(UTC-4:00) America/Thule"
        },
        {
            "code": "America/Tortola",
            "name": "America/Tortola",
            "offset": "-14400",
            "offsetInHours": "-4:00",
            "fullName": "(UTC-4:00) America/Tortola"
        },
        {
            "code": "Atlantic/Bermuda",
            "name": "Atlantic/Bermuda",
            "offset": "-14400",
            "offsetInHours": "-4:00",
            "fullName": "(UTC-4:00) Atlantic/Bermuda"
        },
        {
            "code": "America/St_Johns",
            "name": "America/St.Johns",
            "offset": "-12600",
            "offsetInHours": "-4:30",
            "fullName": "(UTC-4:30) America/St.Johns"
        },
        {
            "code": "America/Araguaina",
            "name": "America/Araguaina",
            "offset": "-10800",
            "offsetInHours": "-3:00",
            "fullName": "(UTC-3:00) America/Araguaina"
        },
        {
            "code": "America/Argentina/Buenos_Aires",
            "name": "America/Argentina/Buenos-Aires",
            "offset": "-10800",
            "offsetInHours": "-3:00",
            "fullName": "(UTC-3:00) America/Argentina/Buenos-Aires"
        },
        {
            "code": "America/Argentina/Catamarca",
            "name": "America/Argentina/Catamarca",
            "offset": "-10800",
            "offsetInHours": "-3:00",
            "fullName": "(UTC-3:00) America/Argentina/Catamarca"
        },
        {
            "code": "America/Argentina/Cordoba",
            "name": "America/Argentina/Cordoba",
            "offset": "-10800",
            "offsetInHours": "-3:00",
            "fullName": "(UTC-3:00) America/Argentina/Cordoba"
        },
        {
            "code": "America/Argentina/Jujuy",
            "name": "America/Argentina/Jujuy",
            "offset": "-10800",
            "offsetInHours": "-3:00",
            "fullName": "(UTC-3:00) America/Argentina/Jujuy"
        },
        {
            "code": "America/Argentina/La_Rioja",
            "name": "America/Argentina/La-Rioja",
            "offset": "-10800",
            "offsetInHours": "-3:00",
            "fullName": "(UTC-3:00) America/Argentina/La-Rioja"
        },
        {
            "code": "America/Argentina/Mendoza",
            "name": "America/Argentina/Mendoza",
            "offset": "-10800",
            "offsetInHours": "-3:00",
            "fullName": "(UTC-3:00) America/Argentina/Mendoza"
        },
        {
            "code": "America/Argentina/Rio_Gallegos",
            "name": "America/Argentina/Rio-Gallegos",
            "offset": "-10800",
            "offsetInHours": "-3:00",
            "fullName": "(UTC-3:00) America/Argentina/Rio-Gallegos"
        },
        {
            "code": "America/Argentina/Salta",
            "name": "America/Argentina/Salta",
            "offset": "-10800",
            "offsetInHours": "-3:00",
            "fullName": "(UTC-3:00) America/Argentina/Salta"
        },
        {
            "code": "America/Argentina/San_Juan",
            "name": "America/Argentina/San-Juan",
            "offset": "-10800",
            "offsetInHours": "-3:00",
            "fullName": "(UTC-3:00) America/Argentina/San-Juan"
        },
        {
            "code": "America/Argentina/San_Luis",
            "name": "America/Argentina/San-Luis",
            "offset": "-10800",
            "offsetInHours": "-3:00",
            "fullName": "(UTC-3:00) America/Argentina/San-Luis"
        },
        {
            "code": "America/Argentina/Tucuman",
            "name": "America/Argentina/Tucuman",
            "offset": "-10800",
            "offsetInHours": "-3:00",
            "fullName": "(UTC-3:00) America/Argentina/Tucuman"
        },
        {
            "code": "America/Argentina/Ushuaia",
            "name": "America/Argentina/Ushuaia",
            "offset": "-10800",
            "offsetInHours": "-3:00",
            "fullName": "(UTC-3:00) America/Argentina/Ushuaia"
        },
        {
            "code": "America/Asuncion",
            "name": "America/Asuncion",
            "offset": "-10800",
            "offsetInHours": "-3:00",
            "fullName": "(UTC-3:00) America/Asuncion"
        },
        {
            "code": "America/Bahia",
            "name": "America/Bahia",
            "offset": "-10800",
            "offsetInHours": "-3:00",
            "fullName": "(UTC-3:00) America/Bahia"
        },
        {
            "code": "America/Belem",
            "name": "America/Belem",
            "offset": "-10800",
            "offsetInHours": "-3:00",
            "fullName": "(UTC-3:00) America/Belem"
        },
        {
            "code": "America/Cayenne",
            "name": "America/Cayenne",
            "offset": "-10800",
            "offsetInHours": "-3:00",
            "fullName": "(UTC-3:00) America/Cayenne"
        },
        {
            "code": "America/Coyhaique",
            "name": "America/Coyhaique",
            "offset": "-10800",
            "offsetInHours": "-3:00",
            "fullName": "(UTC-3:00) America/Coyhaique"
        },
        {
            "code": "America/Fortaleza",
            "name": "America/Fortaleza",
            "offset": "-10800",
            "offsetInHours": "-3:00",
            "fullName": "(UTC-3:00) America/Fortaleza"
        },
        {
            "code": "America/Maceio",
            "name": "America/Maceio",
            "offset": "-10800",
            "offsetInHours": "-3:00",
            "fullName": "(UTC-3:00) America/Maceio"
        },
        {
            "code": "America/Miquelon",
            "name": "America/Miquelon",
            "offset": "-10800",
            "offsetInHours": "-3:00",
            "fullName": "(UTC-3:00) America/Miquelon"
        },
        {
            "code": "America/Montevideo",
            "name": "America/Montevideo",
            "offset": "-10800",
            "offsetInHours": "-3:00",
            "fullName": "(UTC-3:00) America/Montevideo"
        },
        {
            "code": "America/Paramaribo",
            "name": "America/Paramaribo",
            "offset": "-10800",
            "offsetInHours": "-3:00",
            "fullName": "(UTC-3:00) America/Paramaribo"
        },
        {
            "code": "America/Punta_Arenas",
            "name": "America/Punta-Arenas",
            "offset": "-10800",
            "offsetInHours": "-3:00",
            "fullName": "(UTC-3:00) America/Punta-Arenas"
        },
        {
            "code": "America/Recife",
            "name": "America/Recife",
            "offset": "-10800",
            "offsetInHours": "-3:00",
            "fullName": "(UTC-3:00) America/Recife"
        },
        {
            "code": "America/Santarem",
            "name": "America/Santarem",
            "offset": "-10800",
            "offsetInHours": "-3:00",
            "fullName": "(UTC-3:00) America/Santarem"
        },
        {
            "code": "America/Santiago",
            "name": "America/Santiago",
            "offset": "-10800",
            "offsetInHours": "-3:00",
            "fullName": "(UTC-3:00) America/Santiago"
        },
        {
            "code": "America/Sao_Paulo",
            "name": "America/Sao-Paulo",
            "offset": "-10800",
            "offsetInHours": "-3:00",
            "fullName": "(UTC-3:00) America/Sao-Paulo"
        },
        {
            "code": "Antarctica/Palmer",
            "name": "Antarctica/Palmer",
            "offset": "-10800",
            "offsetInHours": "-3:00",
            "fullName": "(UTC-3:00) Antarctica/Palmer"
        },
        {
            "code": "Antarctica/Rothera",
            "name": "Antarctica/Rothera",
            "offset": "-10800",
            "offsetInHours": "-3:00",
            "fullName": "(UTC-3:00) Antarctica/Rothera"
        },
        {
            "code": "Atlantic/Stanley",
            "name": "Atlantic/Stanley",
            "offset": "-10800",
            "offsetInHours": "-3:00",
            "fullName": "(UTC-3:00) Atlantic/Stanley"
        },
        {
            "code": "America/Noronha",
            "name": "America/Noronha",
            "offset": "-7200",
            "offsetInHours": "-2:00",
            "fullName": "(UTC-2:00) America/Noronha"
        },
        {
            "code": "America/Nuuk",
            "name": "America/Nuuk",
            "offset": "-7200",
            "offsetInHours": "-2:00",
            "fullName": "(UTC-2:00) America/Nuuk"
        },
        {
            "code": "America/Scoresbysund",
            "name": "America/Scoresbysund",
            "offset": "-7200",
            "offsetInHours": "-2:00",
            "fullName": "(UTC-2:00) America/Scoresbysund"
        },
        {
            "code": "Atlantic/South_Georgia",
            "name": "Atlantic/South Georgia",
            "offset": "-7200",
            "offsetInHours": "-2:00",
            "fullName": "(UTC-2:00) Atlantic/South Georgia"
        },
        {
            "code": "Atlantic/Azores",
            "name": "Atlantic/Azores",
            "offset": "-3600",
            "offsetInHours": "-1:00",
            "fullName": "(UTC-1:00) Atlantic/Azores"
        },
        {
            "code": "Atlantic/Cape_Verde",
            "name": "Atlantic/Cape-Verde",
            "offset": "-3600",
            "offsetInHours": "-1:00",
            "fullName": "(UTC-1:00) Atlantic/Cape-Verde"
        },
        {
            "code": "Africa/Abidjan",
            "name": "Africa/Abidjan",
            "offset": "0",
            "offsetInHours": "+0:00",
            "fullName": "(UTC+0:00) Africa/Abidjan"
        },
        {
            "code": "Africa/Accra",
            "name": "Africa/Accra",
            "offset": "0",
            "offsetInHours": "+0:00",
            "fullName": "(UTC+0:00) Africa/Accra"
        },
        {
            "code": "Africa/Bamako",
            "name": "Africa/Bamako",
            "offset": "0",
            "offsetInHours": "+0:00",
            "fullName": "(UTC+0:00) Africa/Bamako"
        },
        {
            "code": "Africa/Banjul",
            "name": "Africa/Banjul",
            "offset": "0",
            "offsetInHours": "+0:00",
            "fullName": "(UTC+0:00) Africa/Banjul"
        },
        {
            "code": "Africa/Bissau",
            "name": "Africa/Bissau",
            "offset": "0",
            "offsetInHours": "+0:00",
            "fullName": "(UTC+0:00) Africa/Bissau"
        },
        {
            "code": "Africa/Casablanca",
            "name": "Africa/Casablanca",
            "offset": "0",
            "offsetInHours": "+0:00",
            "fullName": "(UTC+0:00) Africa/Casablanca"
        },
        {
            "code": "Africa/Conakry",
            "name": "Africa/Conakry",
            "offset": "0",
            "offsetInHours": "+0:00",
            "fullName": "(UTC+0:00) Africa/Conakry"
        },
        {
            "code": "Africa/Dakar",
            "name": "Africa/Dakar",
            "offset": "0",
            "offsetInHours": "+0:00",
            "fullName": "(UTC+0:00) Africa/Dakar"
        },
        {
            "code": "Africa/El_Aaiun",
            "name": "Africa/El-Aaiun",
            "offset": "0",
            "offsetInHours": "+0:00",
            "fullName": "(UTC+0:00) Africa/El-Aaiun"
        },
        {
            "code": "Africa/Freetown",
            "name": "Africa/Freetown",
            "offset": "0",
            "offsetInHours": "+0:00",
            "fullName": "(UTC+0:00) Africa/Freetown"
        },
        {
            "code": "Africa/Lome",
            "name": "Africa/Lome",
            "offset": "0",
            "offsetInHours": "+0:00",
            "fullName": "(UTC+0:00) Africa/Lome"
        },
        {
            "code": "Africa/Monrovia",
            "name": "Africa/Monrovia",
            "offset": "0",
            "offsetInHours": "+0:00",
            "fullName": "(UTC+0:00) Africa/Monrovia"
        },
        {
            "code": "Africa/Nouakchott",
            "name": "Africa/Nouakchott",
            "offset": "0",
            "offsetInHours": "+0:00",
            "fullName": "(UTC+0:00) Africa/Nouakchott"
        },
        {
            "code": "Africa/Ouagadougou",
            "name": "Africa/Ouagadougou",
            "offset": "0",
            "offsetInHours": "+0:00",
            "fullName": "(UTC+0:00) Africa/Ouagadougou"
        },
        {
            "code": "Africa/Sao_Tome",
            "name": "Africa/Sao-Tome",
            "offset": "0",
            "offsetInHours": "+0:00",
            "fullName": "(UTC+0:00) Africa/Sao-Tome"
        },
        {
            "code": "America/Danmarkshavn",
            "name": "America/Danmarkshavn",
            "offset": "0",
            "offsetInHours": "+0:00",
            "fullName": "(UTC+0:00) America/Danmarkshavn"
        },
        {
            "code": "Antarctica/Troll",
            "name": "Antarctica/Troll",
            "offset": "0",
            "offsetInHours": "+0:00",
            "fullName": "(UTC+0:00) Antarctica/Troll"
        },
        {
            "code": "Atlantic/Canary",
            "name": "Atlantic/Canary",
            "offset": "0",
            "offsetInHours": "+0:00",
            "fullName": "(UTC+0:00) Atlantic/Canary"
        },
        {
            "code": "Atlantic/Faroe",
            "name": "Atlantic/Faroe",
            "offset": "0",
            "offsetInHours": "+0:00",
            "fullName": "(UTC+0:00) Atlantic/Faroe"
        },
        {
            "code": "Atlantic/Madeira",
            "name": "Atlantic/Madeira",
            "offset": "0",
            "offsetInHours": "+0:00",
            "fullName": "(UTC+0:00) Atlantic/Madeira"
        },
        {
            "code": "Atlantic/Reykjavik",
            "name": "Atlantic/Reykjavik",
            "offset": "0",
            "offsetInHours": "+0:00",
            "fullName": "(UTC+0:00) Atlantic/Reykjavik"
        },
        {
            "code": "Atlantic/St_Helena",
            "name": "Atlantic/St. Helena",
            "offset": "0",
            "offsetInHours": "+0:00",
            "fullName": "(UTC+0:00) Atlantic/St. Helena"
        },
        {
            "code": "Europe/Dublin",
            "name": "Europe/Dublin",
            "offset": "0",
            "offsetInHours": "+0:00",
            "fullName": "(UTC+0:00) Europe/Dublin"
        },
        {
            "code": "Europe/Guernsey",
            "name": "Europe/Guernsey",
            "offset": "0",
            "offsetInHours": "+0:00",
            "fullName": "(UTC+0:00) Europe/Guernsey"
        },
        {
            "code": "Europe/Isle_of_Man",
            "name": "Europe/Isleof Man",
            "offset": "0",
            "offsetInHours": "+0:00",
            "fullName": "(UTC+0:00) Europe/Isleof Man"
        },
        {
            "code": "Europe/Jersey",
            "name": "Europe/Jersey",
            "offset": "0",
            "offsetInHours": "+0:00",
            "fullName": "(UTC+0:00) Europe/Jersey"
        },
        {
            "code": "Europe/Lisbon",
            "name": "Europe/Lisbon",
            "offset": "0",
            "offsetInHours": "+0:00",
            "fullName": "(UTC+0:00) Europe/Lisbon"
        },
        {
            "code": "Europe/London",
            "name": "Europe/London",
            "offset": "0",
            "offsetInHours": "+0:00",
            "fullName": "(UTC+0:00) Europe/London"
        },
        {
            "code": "UTC",
            "name": "UTC",
            "offset": "0",
            "offsetInHours": "+0:00",
            "fullName": "(UTC+0:00) UTC"
        },
        {
            "code": "Africa/Algiers",
            "name": "Africa/Algiers",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Africa/Algiers"
        },
        {
            "code": "Africa/Bangui",
            "name": "Africa/Bangui",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Africa/Bangui"
        },
        {
            "code": "Africa/Brazzaville",
            "name": "Africa/Brazzaville",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Africa/Brazzaville"
        },
        {
            "code": "Africa/Ceuta",
            "name": "Africa/Ceuta",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Africa/Ceuta"
        },
        {
            "code": "Africa/Douala",
            "name": "Africa/Douala",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Africa/Douala"
        },
        {
            "code": "Africa/Kinshasa",
            "name": "Africa/Kinshasa",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Africa/Kinshasa"
        },
        {
            "code": "Africa/Lagos",
            "name": "Africa/Lagos",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Africa/Lagos"
        },
        {
            "code": "Africa/Libreville",
            "name": "Africa/Libreville",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Africa/Libreville"
        },
        {
            "code": "Africa/Luanda",
            "name": "Africa/Luanda",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Africa/Luanda"
        },
        {
            "code": "Africa/Malabo",
            "name": "Africa/Malabo",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Africa/Malabo"
        },
        {
            "code": "Africa/Ndjamena",
            "name": "Africa/Ndjamena",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Africa/Ndjamena"
        },
        {
            "code": "Africa/Niamey",
            "name": "Africa/Niamey",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Africa/Niamey"
        },
        {
            "code": "Africa/Porto-Novo",
            "name": "Africa/Porto-Novo",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Africa/Porto-Novo"
        },
        {
            "code": "Africa/Tunis",
            "name": "Africa/Tunis",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Africa/Tunis"
        },
        {
            "code": "Arctic/Longyearbyen",
            "name": "Arctic/Longyearbyen",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Arctic/Longyearbyen"
        },
        {
            "code": "Europe/Amsterdam",
            "name": "Europe/Amsterdam",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Europe/Amsterdam"
        },
        {
            "code": "Europe/Andorra",
            "name": "Europe/Andorra",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Europe/Andorra"
        },
        {
            "code": "Europe/Belgrade",
            "name": "Europe/Belgrade",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Europe/Belgrade"
        },
        {
            "code": "Europe/Berlin",
            "name": "Europe/Berlin",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Europe/Berlin"
        },
        {
            "code": "Europe/Bratislava",
            "name": "Europe/Bratislava",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Europe/Bratislava"
        },
        {
            "code": "Europe/Brussels",
            "name": "Europe/Brussels",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Europe/Brussels"
        },
        {
            "code": "Europe/Budapest",
            "name": "Europe/Budapest",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Europe/Budapest"
        },
        {
            "code": "Europe/Busingen",
            "name": "Europe/Busingen",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Europe/Busingen"
        },
        {
            "code": "Europe/Copenhagen",
            "name": "Europe/Copenhagen",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Europe/Copenhagen"
        },
        {
            "code": "Europe/Gibraltar",
            "name": "Europe/Gibraltar",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Europe/Gibraltar"
        },
        {
            "code": "Europe/Ljubljana",
            "name": "Europe/Ljubljana",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Europe/Ljubljana"
        },
        {
            "code": "Europe/Luxembourg",
            "name": "Europe/Luxembourg",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Europe/Luxembourg"
        },
        {
            "code": "Europe/Madrid",
            "name": "Europe/Madrid",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Europe/Madrid"
        },
        {
            "code": "Europe/Malta",
            "name": "Europe/Malta",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Europe/Malta"
        },
        {
            "code": "Europe/Monaco",
            "name": "Europe/Monaco",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Europe/Monaco"
        },
        {
            "code": "Europe/Oslo",
            "name": "Europe/Oslo",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Europe/Oslo"
        },
        {
            "code": "Europe/Paris",
            "name": "Europe/Paris",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Europe/Paris"
        },
        {
            "code": "Europe/Podgorica",
            "name": "Europe/Podgorica",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Europe/Podgorica"
        },
        {
            "code": "Europe/Prague",
            "name": "Europe/Prague",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Europe/Prague"
        },
        {
            "code": "Europe/Rome",
            "name": "Europe/Rome",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Europe/Rome"
        },
        {
            "code": "Europe/San_Marino",
            "name": "Europe/San-Marino",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Europe/San-Marino"
        },
        {
            "code": "Europe/Sarajevo",
            "name": "Europe/Sarajevo",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Europe/Sarajevo"
        },
        {
            "code": "Europe/Skopje",
            "name": "Europe/Skopje",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Europe/Skopje"
        },
        {
            "code": "Europe/Stockholm",
            "name": "Europe/Stockholm",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Europe/Stockholm"
        },
        {
            "code": "Europe/Tirane",
            "name": "Europe/Tirane",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Europe/Tirane"
        },
        {
            "code": "Europe/Vaduz",
            "name": "Europe/Vaduz",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Europe/Vaduz"
        },
        {
            "code": "Europe/Vatican",
            "name": "Europe/Vatican",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Europe/Vatican"
        },
        {
            "code": "Europe/Vienna",
            "name": "Europe/Vienna",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Europe/Vienna"
        },
        {
            "code": "Europe/Warsaw",
            "name": "Europe/Warsaw",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Europe/Warsaw"
        },
        {
            "code": "Europe/Zagreb",
            "name": "Europe/Zagreb",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Europe/Zagreb"
        },
        {
            "code": "Europe/Zurich",
            "name": "Europe/Zurich",
            "offset": "3600",
            "offsetInHours": "+1:00",
            "fullName": "(UTC+1:00) Europe/Zurich"
        },
        {
            "code": "Africa/Blantyre",
            "name": "Africa/Blantyre",
            "offset": "7200",
            "offsetInHours": "+2:00",
            "fullName": "(UTC+2:00) Africa/Blantyre"
        },
        {
            "code": "Africa/Bujumbura",
            "name": "Africa/Bujumbura",
            "offset": "7200",
            "offsetInHours": "+2:00",
            "fullName": "(UTC+2:00) Africa/Bujumbura"
        },
        {
            "code": "Africa/Cairo",
            "name": "Africa/Cairo",
            "offset": "7200",
            "offsetInHours": "+2:00",
            "fullName": "(UTC+2:00) Africa/Cairo"
        },
        {
            "code": "Africa/Gaborone",
            "name": "Africa/Gaborone",
            "offset": "7200",
            "offsetInHours": "+2:00",
            "fullName": "(UTC+2:00) Africa/Gaborone"
        },
        {
            "code": "Africa/Harare",
            "name": "Africa/Harare",
            "offset": "7200",
            "offsetInHours": "+2:00",
            "fullName": "(UTC+2:00) Africa/Harare"
        },
        {
            "code": "Africa/Johannesburg",
            "name": "Africa/Johannesburg",
            "offset": "7200",
            "offsetInHours": "+2:00",
            "fullName": "(UTC+2:00) Africa/Johannesburg"
        },
        {
            "code": "Africa/Juba",
            "name": "Africa/Juba",
            "offset": "7200",
            "offsetInHours": "+2:00",
            "fullName": "(UTC+2:00) Africa/Juba"
        },
        {
            "code": "Africa/Khartoum",
            "name": "Africa/Khartoum",
            "offset": "7200",
            "offsetInHours": "+2:00",
            "fullName": "(UTC+2:00) Africa/Khartoum"
        },
        {
            "code": "Africa/Kigali",
            "name": "Africa/Kigali",
            "offset": "7200",
            "offsetInHours": "+2:00",
            "fullName": "(UTC+2:00) Africa/Kigali"
        },
        {
            "code": "Africa/Lubumbashi",
            "name": "Africa/Lubumbashi",
            "offset": "7200",
            "offsetInHours": "+2:00",
            "fullName": "(UTC+2:00) Africa/Lubumbashi"
        },
        {
            "code": "Africa/Lusaka",
            "name": "Africa/Lusaka",
            "offset": "7200",
            "offsetInHours": "+2:00",
            "fullName": "(UTC+2:00) Africa/Lusaka"
        },
        {
            "code": "Africa/Maputo",
            "name": "Africa/Maputo",
            "offset": "7200",
            "offsetInHours": "+2:00",
            "fullName": "(UTC+2:00) Africa/Maputo"
        },
        {
            "code": "Africa/Maseru",
            "name": "Africa/Maseru",
            "offset": "7200",
            "offsetInHours": "+2:00",
            "fullName": "(UTC+2:00) Africa/Maseru"
        },
        {
            "code": "Africa/Mbabane",
            "name": "Africa/Mbabane",
            "offset": "7200",
            "offsetInHours": "+2:00",
            "fullName": "(UTC+2:00) Africa/Mbabane"
        },
        {
            "code": "Africa/Tripoli",
            "name": "Africa/Tripoli",
            "offset": "7200",
            "offsetInHours": "+2:00",
            "fullName": "(UTC+2:00) Africa/Tripoli"
        },
        {
            "code": "Africa/Windhoek",
            "name": "Africa/Windhoek",
            "offset": "7200",
            "offsetInHours": "+2:00",
            "fullName": "(UTC+2:00) Africa/Windhoek"
        },
        {
            "code": "Asia/Beirut",
            "name": "Asia/Beirut",
            "offset": "7200",
            "offsetInHours": "+2:00",
            "fullName": "(UTC+2:00) Asia/Beirut"
        },
        {
            "code": "Asia/Famagusta",
            "name": "Asia/Famagusta",
            "offset": "7200",
            "offsetInHours": "+2:00",
            "fullName": "(UTC+2:00) Asia/Famagusta"
        },
        {
            "code": "Asia/Gaza",
            "name": "Asia/Gaza",
            "offset": "7200",
            "offsetInHours": "+2:00",
            "fullName": "(UTC+2:00) Asia/Gaza"
        },
        {
            "code": "Asia/Hebron",
            "name": "Asia/Hebron",
            "offset": "7200",
            "offsetInHours": "+2:00",
            "fullName": "(UTC+2:00) Asia/Hebron"
        },
        {
            "code": "Asia/Jerusalem",
            "name": "Asia/Jerusalem",
            "offset": "7200",
            "offsetInHours": "+2:00",
            "fullName": "(UTC+2:00) Asia/Jerusalem"
        },
        {
            "code": "Asia/Nicosia",
            "name": "Asia/Nicosia",
            "offset": "7200",
            "offsetInHours": "+2:00",
            "fullName": "(UTC+2:00) Asia/Nicosia"
        },
        {
            "code": "Europe/Athens",
            "name": "Europe/Athens",
            "offset": "7200",
            "offsetInHours": "+2:00",
            "fullName": "(UTC+2:00) Europe/Athens"
        },
        {
            "code": "Europe/Bucharest",
            "name": "Europe/Bucharest",
            "offset": "7200",
            "offsetInHours": "+2:00",
            "fullName": "(UTC+2:00) Europe/Bucharest"
        },
        {
            "code": "Europe/Chisinau",
            "name": "Europe/Chisinau",
            "offset": "7200",
            "offsetInHours": "+2:00",
            "fullName": "(UTC+2:00) Europe/Chisinau"
        },
        {
            "code": "Europe/Helsinki",
            "name": "Europe/Helsinki",
            "offset": "7200",
            "offsetInHours": "+2:00",
            "fullName": "(UTC+2:00) Europe/Helsinki"
        },
        {
            "code": "Europe/Kaliningrad",
            "name": "Europe/Kaliningrad",
            "offset": "7200",
            "offsetInHours": "+2:00",
            "fullName": "(UTC+2:00) Europe/Kaliningrad"
        },
        {
            "code": "Europe/Kyiv",
            "name": "Europe/Kyiv",
            "offset": "7200",
            "offsetInHours": "+2:00",
            "fullName": "(UTC+2:00) Europe/Kyiv"
        },
        {
            "code": "Europe/Mariehamn",
            "name": "Europe/Mariehamn",
            "offset": "7200",
            "offsetInHours": "+2:00",
            "fullName": "(UTC+2:00) Europe/Mariehamn"
        },
        {
            "code": "Europe/Riga",
            "name": "Europe/Riga",
            "offset": "7200",
            "offsetInHours": "+2:00",
            "fullName": "(UTC+2:00) Europe/Riga"
        },
        {
            "code": "Europe/Sofia",
            "name": "Europe/Sofia",
            "offset": "7200",
            "offsetInHours": "+2:00",
            "fullName": "(UTC+2:00) Europe/Sofia"
        },
        {
            "code": "Europe/Tallinn",
            "name": "Europe/Tallinn",
            "offset": "7200",
            "offsetInHours": "+2:00",
            "fullName": "(UTC+2:00) Europe/Tallinn"
        },
        {
            "code": "Europe/Vilnius",
            "name": "Europe/Vilnius",
            "offset": "7200",
            "offsetInHours": "+2:00",
            "fullName": "(UTC+2:00) Europe/Vilnius"
        },
        {
            "code": "Africa/Addis_Ababa",
            "name": "Africa/Addis-Ababa",
            "offset": "10800",
            "offsetInHours": "+3:00",
            "fullName": "(UTC+3:00) Africa/Addis-Ababa"
        },
        {
            "code": "Africa/Asmara",
            "name": "Africa/Asmara",
            "offset": "10800",
            "offsetInHours": "+3:00",
            "fullName": "(UTC+3:00) Africa/Asmara"
        },
        {
            "code": "Africa/Dar_es_Salaam",
            "name": "Africa/Dar-es-Salaam",
            "offset": "10800",
            "offsetInHours": "+3:00",
            "fullName": "(UTC+3:00) Africa/Dar-es-Salaam"
        },
        {
            "code": "Africa/Djibouti",
            "name": "Africa/Djibouti",
            "offset": "10800",
            "offsetInHours": "+3:00",
            "fullName": "(UTC+3:00) Africa/Djibouti"
        },
        {
            "code": "Africa/Kampala",
            "name": "Africa/Kampala",
            "offset": "10800",
            "offsetInHours": "+3:00",
            "fullName": "(UTC+3:00) Africa/Kampala"
        },
        {
            "code": "Africa/Mogadishu",
            "name": "Africa/Mogadishu",
            "offset": "10800",
            "offsetInHours": "+3:00",
            "fullName": "(UTC+3:00) Africa/Mogadishu"
        },
        {
            "code": "Africa/Nairobi",
            "name": "Africa/Nairobi",
            "offset": "10800",
            "offsetInHours": "+3:00",
            "fullName": "(UTC+3:00) Africa/Nairobi"
        },
        {
            "code": "Antarctica/Syowa",
            "name": "Antarctica/Showa",
            "offset": "10800",
            "offsetInHours": "+3:00",
            "fullName": "(UTC+3:00) Antarctica/Showa"
        },
        {
            "code": "Asia/Aden",
            "name": "Asia/Aden",
            "offset": "10800",
            "offsetInHours": "+3:00",
            "fullName": "(UTC+3:00) Asia/Aden"
        },
        {
            "code": "Asia/Amman",
            "name": "Asia/Amman",
            "offset": "10800",
            "offsetInHours": "+3:00",
            "fullName": "(UTC+3:00) Asia/Amman"
        },
        {
            "code": "Asia/Baghdad",
            "name": "Asia/Baghdad",
            "offset": "10800",
            "offsetInHours": "+3:00",
            "fullName": "(UTC+3:00) Asia/Baghdad"
        },
        {
            "code": "Asia/Bahrain",
            "name": "Asia/Bahrain",
            "offset": "10800",
            "offsetInHours": "+3:00",
            "fullName": "(UTC+3:00) Asia/Bahrain"
        },
        {
            "code": "Asia/Damascus",
            "name": "Asia/Damascus",
            "offset": "10800",
            "offsetInHours": "+3:00",
            "fullName": "(UTC+3:00) Asia/Damascus"
        },
        {
            "code": "Asia/Kuwait",
            "name": "Asia/Kuwait",
            "offset": "10800",
            "offsetInHours": "+3:00",
            "fullName": "(UTC+3:00) Asia/Kuwait"
        },
        {
            "code": "Asia/Qatar",
            "name": "Asia/Qatar",
            "offset": "10800",
            "offsetInHours": "+3:00",
            "fullName": "(UTC+3:00) Asia/Qatar"
        },
        {
            "code": "Asia/Riyadh",
            "name": "Asia/Riyadh",
            "offset": "10800",
            "offsetInHours": "+3:00",
            "fullName": "(UTC+3:00) Asia/Riyadh"
        },
        {
            "code": "Europe/Istanbul",
            "name": "Europe/Istanbul",
            "offset": "10800",
            "offsetInHours": "+3:00",
            "fullName": "(UTC+3:00) Europe/Istanbul"
        },
        {
            "code": "Europe/Kirov",
            "name": "Europe/Kirov",
            "offset": "10800",
            "offsetInHours": "+3:00",
            "fullName": "(UTC+3:00) Europe/Kirov"
        },
        {
            "code": "Europe/Minsk",
            "name": "Europe/Minsk",
            "offset": "10800",
            "offsetInHours": "+3:00",
            "fullName": "(UTC+3:00) Europe/Minsk"
        },
        {
            "code": "Europe/Moscow",
            "name": "Europe/Moscow",
            "offset": "10800",
            "offsetInHours": "+3:00",
            "fullName": "(UTC+3:00) Europe/Moscow"
        },
        {
            "code": "Europe/Simferopol",
            "name": "Europe/Simferopol",
            "offset": "10800",
            "offsetInHours": "+3:00",
            "fullName": "(UTC+3:00) Europe/Simferopol"
        },
        {
            "code": "Europe/Volgograd",
            "name": "Europe/Volgograd",
            "offset": "10800",
            "offsetInHours": "+3:00",
            "fullName": "(UTC+3:00) Europe/Volgograd"
        },
        {
            "code": "Indian/Antananarivo",
            "name": "Indian/Antananarivo",
            "offset": "10800",
            "offsetInHours": "+3:00",
            "fullName": "(UTC+3:00) Indian/Antananarivo"
        },
        {
            "code": "Indian/Comoro",
            "name": "Indian/Comoro",
            "offset": "10800",
            "offsetInHours": "+3:00",
            "fullName": "(UTC+3:00) Indian/Comoro"
        },
        {
            "code": "Indian/Mayotte",
            "name": "Indian/Mayotte",
            "offset": "10800",
            "offsetInHours": "+3:00",
            "fullName": "(UTC+3:00) Indian/Mayotte"
        },
        {
            "code": "Asia/Tehran",
            "name": "Asia/Tehran",
            "offset": "12600",
            "offsetInHours": "+4:30",
            "fullName": "(UTC+4:30) Asia/Tehran"
        },
        {
            "code": "Asia/Baku",
            "name": "Asia/Baku",
            "offset": "14400",
            "offsetInHours": "+4:00",
            "fullName": "(UTC+4:00) Asia/Baku"
        },
        {
            "code": "Asia/Dubai",
            "name": "Asia/Dubai",
            "offset": "14400",
            "offsetInHours": "+4:00",
            "fullName": "(UTC+4:00) Asia/Dubai"
        },
        {
            "code": "Asia/Muscat",
            "name": "Asia/Muscat",
            "offset": "14400",
            "offsetInHours": "+4:00",
            "fullName": "(UTC+4:00) Asia/Muscat"
        },
        {
            "code": "Asia/Tbilisi",
            "name": "Asia/Tbilisi",
            "offset": "14400",
            "offsetInHours": "+4:00",
            "fullName": "(UTC+4:00) Asia/Tbilisi"
        },
        {
            "code": "Asia/Yerevan",
            "name": "Asia/Yerevan",
            "offset": "14400",
            "offsetInHours": "+4:00",
            "fullName": "(UTC+4:00) Asia/Yerevan"
        },
        {
            "code": "Europe/Astrakhan",
            "name": "Europe/Astrakhan",
            "offset": "14400",
            "offsetInHours": "+4:00",
            "fullName": "(UTC+4:00) Europe/Astrakhan"
        },
        {
            "code": "Europe/Samara",
            "name": "Europe/Samara",
            "offset": "14400",
            "offsetInHours": "+4:00",
            "fullName": "(UTC+4:00) Europe/Samara"
        },
        {
            "code": "Europe/Saratov",
            "name": "Europe/Saratov",
            "offset": "14400",
            "offsetInHours": "+4:00",
            "fullName": "(UTC+4:00) Europe/Saratov"
        },
        {
            "code": "Europe/Ulyanovsk",
            "name": "Europe/Ulyanovsk",
            "offset": "14400",
            "offsetInHours": "+4:00",
            "fullName": "(UTC+4:00) Europe/Ulyanovsk"
        },
        {
            "code": "Indian/Mahe",
            "name": "Indian/Mahe",
            "offset": "14400",
            "offsetInHours": "+4:00",
            "fullName": "(UTC+4:00) Indian/Mahe"
        },
        {
            "code": "Indian/Mauritius",
            "name": "Indian/Mauritius",
            "offset": "14400",
            "offsetInHours": "+4:00",
            "fullName": "(UTC+4:00) Indian/Mauritius"
        },
        {
            "code": "Indian/Reunion",
            "name": "Indian/Reunion",
            "offset": "14400",
            "offsetInHours": "+4:00",
            "fullName": "(UTC+4:00) Indian/Reunion"
        },
        {
            "code": "Asia/Kabul",
            "name": "Asia/Kabul",
            "offset": "16200",
            "offsetInHours": "+5:30",
            "fullName": "(UTC+5:30) Asia/Kabul"
        },
        {
            "code": "Antarctica/Mawson",
            "name": "Antarctica/Mawson",
            "offset": "18000",
            "offsetInHours": "+5:00",
            "fullName": "(UTC+5:00) Antarctica/Mawson"
        },
        {
            "code": "Antarctica/Vostok",
            "name": "Antarctica/Vostok",
            "offset": "18000",
            "offsetInHours": "+5:00",
            "fullName": "(UTC+5:00) Antarctica/Vostok"
        },
        {
            "code": "Asia/Almaty",
            "name": "Asia/Almaty",
            "offset": "18000",
            "offsetInHours": "+5:00",
            "fullName": "(UTC+5:00) Asia/Almaty"
        },
        {
            "code": "Asia/Aqtau",
            "name": "Asia/Aqtau",
            "offset": "18000",
            "offsetInHours": "+5:00",
            "fullName": "(UTC+5:00) Asia/Aqtau"
        },
        {
            "code": "Asia/Aqtobe",
            "name": "Asia/Aqtobe",
            "offset": "18000",
            "offsetInHours": "+5:00",
            "fullName": "(UTC+5:00) Asia/Aqtobe"
        },
        {
            "code": "Asia/Ashgabat",
            "name": "Asia/Ashgabat",
            "offset": "18000",
            "offsetInHours": "+5:00",
            "fullName": "(UTC+5:00) Asia/Ashgabat"
        },
        {
            "code": "Asia/Atyrau",
            "name": "Asia/Atyrau",
            "offset": "18000",
            "offsetInHours": "+5:00",
            "fullName": "(UTC+5:00) Asia/Atyrau"
        },
        {
            "code": "Asia/Dushanbe",
            "name": "Asia/Dushanbe",
            "offset": "18000",
            "offsetInHours": "+5:00",
            "fullName": "(UTC+5:00) Asia/Dushanbe"
        },
        {
            "code": "Asia/Karachi",
            "name": "Asia/Karachi",
            "offset": "18000",
            "offsetInHours": "+5:00",
            "fullName": "(UTC+5:00) Asia/Karachi"
        },
        {
            "code": "Asia/Oral",
            "name": "Asia/Oral",
            "offset": "18000",
            "offsetInHours": "+5:00",
            "fullName": "(UTC+5:00) Asia/Oral"
        },
        {
            "code": "Asia/Qostanay",
            "name": "Asia/Qostanay",
            "offset": "18000",
            "offsetInHours": "+5:00",
            "fullName": "(UTC+5:00) Asia/Qostanay"
        },
        {
            "code": "Asia/Qyzylorda",
            "name": "Asia/Qyzylorda",
            "offset": "18000",
            "offsetInHours": "+5:00",
            "fullName": "(UTC+5:00) Asia/Qyzylorda"
        },
        {
            "code": "Asia/Samarkand",
            "name": "Asia/Samarkand",
            "offset": "18000",
            "offsetInHours": "+5:00",
            "fullName": "(UTC+5:00) Asia/Samarkand"
        },
        {
            "code": "Asia/Tashkent",
            "name": "Asia/Tashkent",
            "offset": "18000",
            "offsetInHours": "+5:00",
            "fullName": "(UTC+5:00) Asia/Tashkent"
        },
        {
            "code": "Asia/Yekaterinburg",
            "name": "Asia/Yekaterinburg",
            "offset": "18000",
            "offsetInHours": "+5:00",
            "fullName": "(UTC+5:00) Asia/Yekaterinburg"
        },
        {
            "code": "Indian/Kerguelen",
            "name": "Indian/Kerguelen",
            "offset": "18000",
            "offsetInHours": "+5:00",
            "fullName": "(UTC+5:00) Indian/Kerguelen"
        },
        {
            "code": "Indian/Maldives",
            "name": "Indian/Maldives",
            "offset": "18000",
            "offsetInHours": "+5:00",
            "fullName": "(UTC+5:00) Indian/Maldives"
        },
        {
            "code": "Asia/Colombo",
            "name": "Asia/Colombo",
            "offset": "19800",
            "offsetInHours": "+6:30",
            "fullName": "(UTC+6:30) Asia/Colombo"
        },
        {
            "code": "Asia/Kolkata",
            "name": "Asia/Kolkata",
            "offset": "19800",
            "offsetInHours": "+6:30",
            "fullName": "(UTC+6:30) Asia/Kolkata"
        },
        {
            "code": "Asia/Kathmandu",
            "name": "Asia/Kathmandu",
            "offset": "20700",
            "offsetInHours": "+6:45",
            "fullName": "(UTC+6:45) Asia/Kathmandu"
        },
        {
            "code": "Asia/Bishkek",
            "name": "Asia/Bishkek",
            "offset": "21600",
            "offsetInHours": "+6:00",
            "fullName": "(UTC+6:00) Asia/Bishkek"
        },
        {
            "code": "Asia/Dhaka",
            "name": "Asia/Dhaka",
            "offset": "21600",
            "offsetInHours": "+6:00",
            "fullName": "(UTC+6:00) Asia/Dhaka"
        },
        {
            "code": "Asia/Omsk",
            "name": "Asia/Omsk",
            "offset": "21600",
            "offsetInHours": "+6:00",
            "fullName": "(UTC+6:00) Asia/Omsk"
        },
        {
            "code": "Asia/Thimphu",
            "name": "Asia/Thimphu",
            "offset": "21600",
            "offsetInHours": "+6:00",
            "fullName": "(UTC+6:00) Asia/Thimphu"
        },
        {
            "code": "Asia/Urumqi",
            "name": "Asia/Urumqi",
            "offset": "21600",
            "offsetInHours": "+6:00",
            "fullName": "(UTC+6:00) Asia/Urumqi"
        },
        {
            "code": "Indian/Chagos",
            "name": "Indian/Chagos",
            "offset": "21600",
            "offsetInHours": "+6:00",
            "fullName": "(UTC+6:00) Indian/Chagos"
        },
        {
            "code": "Asia/Yangon",
            "name": "Asia/Yangon",
            "offset": "23400",
            "offsetInHours": "+7:30",
            "fullName": "(UTC+7:30) Asia/Yangon"
        },
        {
            "code": "Indian/Cocos",
            "name": "Indian/Cocos",
            "offset": "23400",
            "offsetInHours": "+7:30",
            "fullName": "(UTC+7:30) Indian/Cocos"
        },
        {
            "code": "Antarctica/Davis",
            "name": "Antarctica/Davis",
            "offset": "25200",
            "offsetInHours": "+7:00",
            "fullName": "(UTC+7:00) Antarctica/Davis"
        },
        {
            "code": "Asia/Bangkok",
            "name": "Asia/Bangkok",
            "offset": "25200",
            "offsetInHours": "+7:00",
            "fullName": "(UTC+7:00) Asia/Bangkok"
        },
        {
            "code": "Asia/Barnaul",
            "name": "Asia/Barnaul",
            "offset": "25200",
            "offsetInHours": "+7:00",
            "fullName": "(UTC+7:00) Asia/Barnaul"
        },
        {
            "code": "Asia/Ho_Chi_Minh",
            "name": "Asia/Ho Chi Minh",
            "offset": "25200",
            "offsetInHours": "+7:00",
            "fullName": "(UTC+7:00) Asia/Ho Chi Minh"
        },
        {
            "code": "Asia/Hovd",
            "name": "Asia/Hovd",
            "offset": "25200",
            "offsetInHours": "+7:00",
            "fullName": "(UTC+7:00) Asia/Hovd"
        },
        {
            "code": "Asia/Jakarta",
            "name": "Asia/Jakarta",
            "offset": "25200",
            "offsetInHours": "+7:00",
            "fullName": "(UTC+7:00) Asia/Jakarta"
        },
        {
            "code": "Asia/Krasnoyarsk",
            "name": "Asia/Krasnoyarsk",
            "offset": "25200",
            "offsetInHours": "+7:00",
            "fullName": "(UTC+7:00) Asia/Krasnoyarsk"
        },
        {
            "code": "Asia/Novokuznetsk",
            "name": "Asia/Novokuznetsk",
            "offset": "25200",
            "offsetInHours": "+7:00",
            "fullName": "(UTC+7:00) Asia/Novokuznetsk"
        },
        {
            "code": "Asia/Novosibirsk",
            "name": "Asia/Novosibirsk",
            "offset": "25200",
            "offsetInHours": "+7:00",
            "fullName": "(UTC+7:00) Asia/Novosibirsk"
        },
        {
            "code": "Asia/Phnom_Penh",
            "name": "Asia/Phnom-Penh",
            "offset": "25200",
            "offsetInHours": "+7:00",
            "fullName": "(UTC+7:00) Asia/Phnom-Penh"
        },
        {
            "code": "Asia/Pontianak",
            "name": "Asia/Pontianak",
            "offset": "25200",
            "offsetInHours": "+7:00",
            "fullName": "(UTC+7:00) Asia/Pontianak"
        },
        {
            "code": "Asia/Tomsk",
            "name": "Asia/Tomsk",
            "offset": "25200",
            "offsetInHours": "+7:00",
            "fullName": "(UTC+7:00) Asia/Tomsk"
        },
        {
            "code": "Asia/Vientiane",
            "name": "Asia/Vientiane",
            "offset": "25200",
            "offsetInHours": "+7:00",
            "fullName": "(UTC+7:00) Asia/Vientiane"
        },
        {
            "code": "Indian/Christmas",
            "name": "Indian/Cocos",
            "offset": "25200",
            "offsetInHours": "+7:00",
            "fullName": "(UTC+7:00) Indian/Cocos"
        },
        {
            "code": "Antarctica/Casey",
            "name": "Antarctica/Casey",
            "offset": "28800",
            "offsetInHours": "+8:00",
            "fullName": "(UTC+8:00) Antarctica/Casey"
        },
        {
            "code": "Asia/Brunei",
            "name": "Asia/Brunei",
            "offset": "28800",
            "offsetInHours": "+8:00",
            "fullName": "(UTC+8:00) Asia/Brunei"
        },
        {
            "code": "Asia/Hong_Kong",
            "name": "Asia/Hong Kong",
            "offset": "28800",
            "offsetInHours": "+8:00",
            "fullName": "(UTC+8:00) Asia/Hong Kong"
        },
        {
            "code": "Asia/Irkutsk",
            "name": "Asia/Irkutsk",
            "offset": "28800",
            "offsetInHours": "+8:00",
            "fullName": "(UTC+8:00) Asia/Irkutsk"
        },
        {
            "code": "Asia/Kuala_Lumpur",
            "name": "Asia/Kuala Lumpur",
            "offset": "28800",
            "offsetInHours": "+8:00",
            "fullName": "(UTC+8:00) Asia/Kuala Lumpur"
        },
        {
            "code": "Asia/Kuching",
            "name": "Asia/Kuching",
            "offset": "28800",
            "offsetInHours": "+8:00",
            "fullName": "(UTC+8:00) Asia/Kuching"
        },
        {
            "code": "Asia/Macau",
            "name": "Asia/Macau",
            "offset": "28800",
            "offsetInHours": "+8:00",
            "fullName": "(UTC+8:00) Asia/Macau"
        },
        {
            "code": "Asia/Makassar",
            "name": "Asia/Makassar",
            "offset": "28800",
            "offsetInHours": "+8:00",
            "fullName": "(UTC+8:00) Asia/Makassar"
        },
        {
            "code": "Asia/Manila",
            "name": "Asia/Manila",
            "offset": "28800",
            "offsetInHours": "+8:00",
            "fullName": "(UTC+8:00) Asia/Manila"
        },
        {
            "code": "Asia/Shanghai",
            "name": "Asia/Shanghai",
            "offset": "28800",
            "offsetInHours": "+8:00",
            "fullName": "(UTC+8:00) Asia/Shanghai"
        },
        {
            "code": "Asia/Singapore",
            "name": "Asia/Singapore",
            "offset": "28800",
            "offsetInHours": "+8:00",
            "fullName": "(UTC+8:00) Asia/Singapore"
        },
        {
            "code": "Asia/Taipei",
            "name": "Asia/Taipei",
            "offset": "28800",
            "offsetInHours": "+8:00",
            "fullName": "(UTC+8:00) Asia/Taipei"
        },
        {
            "code": "Asia/Ulaanbaatar",
            "name": "Asia/Ulaanbaatar",
            "offset": "28800",
            "offsetInHours": "+8:00",
            "fullName": "(UTC+8:00) Asia/Ulaanbaatar"
        },
        {
            "code": "Australia/Perth",
            "name": "Australia/Perth",
            "offset": "28800",
            "offsetInHours": "+8:00",
            "fullName": "(UTC+8:00) Australia/Perth"
        },
        {
            "code": "Australia/Eucla",
            "name": "Australia/Eucla",
            "offset": "31500",
            "offsetInHours": "+9:45",
            "fullName": "(UTC+9:45) Australia/Eucla"
        },
        {
            "code": "Asia/Chita",
            "name": "Asia/Chita",
            "offset": "32400",
            "offsetInHours": "+9:00",
            "fullName": "(UTC+9:00) Asia/Chita"
        },
        {
            "code": "Asia/Dili",
            "name": "Asia/Dili",
            "offset": "32400",
            "offsetInHours": "+9:00",
            "fullName": "(UTC+9:00) Asia/Dili"
        },
        {
            "code": "Asia/Jayapura",
            "name": "Asia/Jayapura",
            "offset": "32400",
            "offsetInHours": "+9:00",
            "fullName": "(UTC+9:00) Asia/Jayapura"
        },
        {
            "code": "Asia/Khandyga",
            "name": "Asia/Khandyga",
            "offset": "32400",
            "offsetInHours": "+9:00",
            "fullName": "(UTC+9:00) Asia/Khandyga"
        },
        {
            "code": "Asia/Pyongyang",
            "name": "Asia/Pyongyang",
            "offset": "32400",
            "offsetInHours": "+9:00",
            "fullName": "(UTC+9:00) Asia/Pyongyang"
        },
        {
            "code": "Asia/Seoul",
            "name": "Asia/Seoul",
            "offset": "32400",
            "offsetInHours": "+9:00",
            "fullName": "(UTC+9:00) Asia/Seoul"
        },
        {
            "code": "Asia/Tokyo",
            "name": "Asia/Tokyo",
            "offset": "32400",
            "offsetInHours": "+9:00",
            "fullName": "(UTC+9:00) Asia/Tokyo"
        },
        {
            "code": "Asia/Yakutsk",
            "name": "Asia/Yakutsk",
            "offset": "32400",
            "offsetInHours": "+9:00",
            "fullName": "(UTC+9:00) Asia/Yakutsk"
        },
        {
            "code": "Pacific/Palau",
            "name": "Pacific/Palau",
            "offset": "32400",
            "offsetInHours": "+9:00",
            "fullName": "(UTC+9:00) Pacific/Palau"
        },
        {
            "code": "Australia/Darwin",
            "name": "Australia/Darwin",
            "offset": "34200",
            "offsetInHours": "+10:30",
            "fullName": "(UTC+10:30) Australia/Darwin"
        },
        {
            "code": "Antarctica/DumontDUrville",
            "name": "Antarctica/DumontDUrville",
            "offset": "36000",
            "offsetInHours": "+10:00",
            "fullName": "(UTC+10:00) Antarctica/DumontDUrville"
        },
        {
            "code": "Asia/Ust-Nera",
            "name": "Asia/Ust-Nera",
            "offset": "36000",
            "offsetInHours": "+10:00",
            "fullName": "(UTC+10:00) Asia/Ust-Nera"
        },
        {
            "code": "Asia/Vladivostok",
            "name": "Asia/Vladivostok",
            "offset": "36000",
            "offsetInHours": "+10:00",
            "fullName": "(UTC+10:00) Asia/Vladivostok"
        },
        {
            "code": "Australia/Brisbane",
            "name": "Australia/Brisbane",
            "offset": "36000",
            "offsetInHours": "+10:00",
            "fullName": "(UTC+10:00) Australia/Brisbane"
        },
        {
            "code": "Australia/Lindeman",
            "name": "Australia/Lindeman",
            "offset": "36000",
            "offsetInHours": "+10:00",
            "fullName": "(UTC+10:00) Australia/Lindeman"
        },
        {
            "code": "Pacific/Chuuk",
            "name": "Pacific/Chuuk",
            "offset": "36000",
            "offsetInHours": "+10:00",
            "fullName": "(UTC+10:00) Pacific/Chuuk"
        },
        {
            "code": "Pacific/Guam",
            "name": "Pacific/Guam",
            "offset": "36000",
            "offsetInHours": "+10:00",
            "fullName": "(UTC+10:00) Pacific/Guam"
        },
        {
            "code": "Pacific/Port_Moresby",
            "name": "Pacific/Port-Moresby",
            "offset": "36000",
            "offsetInHours": "+10:00",
            "fullName": "(UTC+10:00) Pacific/Port-Moresby"
        },
        {
            "code": "Pacific/Saipan",
            "name": "Pacific/Saipan",
            "offset": "36000",
            "offsetInHours": "+10:00",
            "fullName": "(UTC+10:00) Pacific/Saipan"
        },
        {
            "code": "Australia/Adelaide",
            "name": "Australia/Adelaide",
            "offset": "37800",
            "offsetInHours": "+11:30",
            "fullName": "(UTC+11:30) Australia/Adelaide"
        },
        {
            "code": "Australia/Broken_Hill",
            "name": "Australia/Broken Hill",
            "offset": "37800",
            "offsetInHours": "+11:30",
            "fullName": "(UTC+11:30) Australia/Broken Hill"
        },
        {
            "code": "Antarctica/Macquarie",
            "name": "Antarctica/Macquarie",
            "offset": "39600",
            "offsetInHours": "+11:00",
            "fullName": "(UTC+11:00) Antarctica/Macquarie"
        },
        {
            "code": "Asia/Magadan",
            "name": "Asia/Magadan",
            "offset": "39600",
            "offsetInHours": "+11:00",
            "fullName": "(UTC+11:00) Asia/Magadan"
        },
        {
            "code": "Asia/Sakhalin",
            "name": "Asia/Sakhalin",
            "offset": "39600",
            "offsetInHours": "+11:00",
            "fullName": "(UTC+11:00) Asia/Sakhalin"
        },
        {
            "code": "Asia/Srednekolymsk",
            "name": "Asia/Srednekolymsk",
            "offset": "39600",
            "offsetInHours": "+11:00",
            "fullName": "(UTC+11:00) Asia/Srednekolymsk"
        },
        {
            "code": "Australia/Hobart",
            "name": "Australia/Hobart",
            "offset": "39600",
            "offsetInHours": "+11:00",
            "fullName": "(UTC+11:00) Australia/Hobart"
        },
        {
            "code": "Australia/Lord_Howe",
            "name": "Australia/Lord Howe",
            "offset": "39600",
            "offsetInHours": "+11:00",
            "fullName": "(UTC+11:00) Australia/Lord Howe"
        },
        {
            "code": "Australia/Melbourne",
            "name": "Australia/Melbourne",
            "offset": "39600",
            "offsetInHours": "+11:00",
            "fullName": "(UTC+11:00) Australia/Melbourne"
        },
        {
            "code": "Australia/Sydney",
            "name": "Australia/Sydney",
            "offset": "39600",
            "offsetInHours": "+11:00",
            "fullName": "(UTC+11:00) Australia/Sydney"
        },
        {
            "code": "Pacific/Bougainville",
            "name": "Pacific/Bougainville",
            "offset": "39600",
            "offsetInHours": "+11:00",
            "fullName": "(UTC+11:00) Pacific/Bougainville"
        },
        {
            "code": "Pacific/Efate",
            "name": "Pacific/Efate",
            "offset": "39600",
            "offsetInHours": "+11:00",
            "fullName": "(UTC+11:00) Pacific/Efate"
        },
        {
            "code": "Pacific/Guadalcanal",
            "name": "Pacific/Guadalcanal",
            "offset": "39600",
            "offsetInHours": "+11:00",
            "fullName": "(UTC+11:00) Pacific/Guadalcanal"
        },
        {
            "code": "Pacific/Kosrae",
            "name": "Pacific/Kosrae",
            "offset": "39600",
            "offsetInHours": "+11:00",
            "fullName": "(UTC+11:00) Pacific/Kosrae"
        },
        {
            "code": "Pacific/Noumea",
            "name": "Pacific/Noumea",
            "offset": "39600",
            "offsetInHours": "+11:00",
            "fullName": "(UTC+11:00) Pacific/Noumea"
        },
        {
            "code": "Pacific/Pohnpei",
            "name": "Pacific/Pohnpei",
            "offset": "39600",
            "offsetInHours": "+11:00",
            "fullName": "(UTC+11:00) Pacific/Pohnpei"
        },
        {
            "code": "Asia/Anadyr",
            "name": "Asia/Anadyr",
            "offset": "43200",
            "offsetInHours": "+12:00",
            "fullName": "(UTC+12:00) Asia/Anadyr"
        },
        {
            "code": "Asia/Kamchatka",
            "name": "Asia/Kamchatka",
            "offset": "43200",
            "offsetInHours": "+12:00",
            "fullName": "(UTC+12:00) Asia/Kamchatka"
        },
        {
            "code": "Pacific/Fiji",
            "name": "Pacific/Fiji",
            "offset": "43200",
            "offsetInHours": "+12:00",
            "fullName": "(UTC+12:00) Pacific/Fiji"
        },
        {
            "code": "Pacific/Funafuti",
            "name": "Pacific/Funafuti",
            "offset": "43200",
            "offsetInHours": "+12:00",
            "fullName": "(UTC+12:00) Pacific/Funafuti"
        },
        {
            "code": "Pacific/Kwajalein",
            "name": "Pacific/Kwajalein",
            "offset": "43200",
            "offsetInHours": "+12:00",
            "fullName": "(UTC+12:00) Pacific/Kwajalein"
        },
        {
            "code": "Pacific/Majuro",
            "name": "Pacific/Majuro",
            "offset": "43200",
            "offsetInHours": "+12:00",
            "fullName": "(UTC+12:00) Pacific/Majuro"
        },
        {
            "code": "Pacific/Nauru",
            "name": "Pacific/Nauru",
            "offset": "43200",
            "offsetInHours": "+12:00",
            "fullName": "(UTC+12:00) Pacific/Nauru"
        },
        {
            "code": "Pacific/Norfolk",
            "name": "Pacific/Norfolk",
            "offset": "43200",
            "offsetInHours": "+12:00",
            "fullName": "(UTC+12:00) Pacific/Norfolk"
        },
        {
            "code": "Pacific/Tarawa",
            "name": "Pacific/Tarawa",
            "offset": "43200",
            "offsetInHours": "+12:00",
            "fullName": "(UTC+12:00) Pacific/Tarawa"
        },
        {
            "code": "Pacific/Wake",
            "name": "Pacific/Wake",
            "offset": "43200",
            "offsetInHours": "+12:00",
            "fullName": "(UTC+12:00) Pacific/Wake"
        },
        {
            "code": "Pacific/Wallis",
            "name": "Pacific/Wallis",
            "offset": "43200",
            "offsetInHours": "+12:00",
            "fullName": "(UTC+12:00) Pacific/Wallis"
        },
        {
            "code": "Antarctica/McMurdo",
            "name": "Antarctica/McMurdo",
            "offset": "46800",
            "offsetInHours": "+13:00",
            "fullName": "(UTC+13:00) Antarctica/McMurdo"
        },
        {
            "code": "Pacific/Apia",
            "name": "Pacific/Apia",
            "offset": "46800",
            "offsetInHours": "+13:00",
            "fullName": "(UTC+13:00) Pacific/Apia"
        },
        {
            "code": "Pacific/Auckland",
            "name": "Pacific/Auckland",
            "offset": "46800",
            "offsetInHours": "+13:00",
            "fullName": "(UTC+13:00) Pacific/Auckland"
        },
        {
            "code": "Pacific/Fakaofo",
            "name": "Pacific/Fakaofo",
            "offset": "46800",
            "offsetInHours": "+13:00",
            "fullName": "(UTC+13:00) Pacific/Fakaofo"
        },
        {
            "code": "Pacific/Kanton",
            "name": "Pacific/Kanton",
            "offset": "46800",
            "offsetInHours": "+13:00",
            "fullName": "(UTC+13:00) Pacific/Kanton"
        },
        {
            "code": "Pacific/Tongatapu",
            "name": "Pacific/Tongatapu",
            "offset": "46800",
            "offsetInHours": "+13:00",
            "fullName": "(UTC+13:00) Pacific/Tongatapu"
        },
        {
            "code": "Pacific/Chatham",
            "name": "Pacific/Chatham",
            "offset": "49500",
            "offsetInHours": "+14:45",
            "fullName": "(UTC+14:45) Pacific/Chatham"
        },
        {
            "code": "Pacific/Kiritimati",
            "name": "Pacific/Kiritimati",
            "offset": "50400",
            "offsetInHours": "+14:00",
            "fullName": "(UTC+14:00) Pacific/Kiritimati"
        }
    ],
    "storageTypes": [
        "BAR_1",
        "BAR_2",
        "BAR_3",
        "BAR_4",
        "BAR_5",
        "BAR_6",
        "KITCHEN_1",
        "KITCHEN_2",
        "KITCHEN_3",
        "KITCHEN_4",
        "KITCHEN_5",
        "KITCHEN_6",
        "COLD_SHOP_1",
        "COLD_SHOP_2",
        "COLD_SHOP_3",
        "HOT_SHOP_1",
        "HOT_SHOP_2",
        "HOT_SHOP_3",
        "HOT_SHOP_4",
        "STORAGE_1",
        "STORAGE_2",
        "STORAGE_3",
        "STORAGE_4",
        "STORAGE_5",
        "STORAGE_6",
        "NOT_USAGE"
    ]
}