Summary
URL: https://parra.syrve.app/api/stores/list
Status: 200 OK
Source: Network
Address: 185.185.49.118:443
Initiator: 
polyfills.js:7:32047

Request
GET /api/stores/list HTTP/1.1
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



response

{
    "error": false,
    "errorMessage": "",
    "stores": [
        {
            "id": 10638,
            "code": "01",
            "accountId": 7715,
            "crmId": 5014349,
            "templateId": 7342,
            "templateName": "Default",
            "templateProperties": {
                "isExpress": true,
                "isDineIn": false,
                "isDelco": false,
                "intervals": [
                    {
                        "name": "INTERVAL.DEFAULT.MORNING",
                        "time": "12:00"
                    },
                    {
                        "name": "INTERVAL.DEFAULT.LUNCH",
                        "time": "17:00"
                    },
                    {
                        "name": "INTERVAL.DEFAULT.EVENING",
                        "time": "05:00"
                    }
                ]
            },
            "restaurantAddress": "Lisboa, Lisboa, 90, Rua da Esperança",
            "timeZone": "(UTC+0:00) Europe/Lisbon",
            "isAliveConnection": true,
            "jurPersonId": "e264de03-5c52-ba50-018e-38de4f340010",
            "jurPersonName": "Planaltos Elegantes, Lda",
            "uocOrganizationId": "daa678cd-dca6-42a6-be35-f3315f8ff9e3",
            "departmentId": "e264de03-5c52-ba50-018e-38de4f340011",
            "name": "Parra",
            "lat": "38.7082622",
            "lng": "-9.1547408",
            "addressComment": "",
            "available": true
        }
    ],
    "domain": "parra"
}