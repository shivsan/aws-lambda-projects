const scrapper = require("../src/habyt-scrapper");

test('Convert json from habyt to database room object', async () => {
    const roomJson = {
        "id": "a021i0000057vQ9AAI",
        "code": "DE-01-001-001-02H",
        "bookable": true,
        "availableDate": "2022-10-19",
        "shareType": "PRIVATE_ROOM",
        "amenities": [
            "Wardrobe",
            "Private balcony",
            "Queen size bed"
        ],
        "images": [
            {
                "url": "https://dkxxy6rs8czp7.cloudfront.net/a02-room__c/a021i0000057vQ9AAI/bedroom_2i.jpg.jpg",
                "__typename": "Image"
            },
            {
                "url": "https://dkxxy6rs8czp7.cloudfront.net/a02-room__c/a021i0000057vQ9AAI/bedroom_2ii.jpg.jpg",
                "__typename": "Image"
            },
            {
                "url": "https://dkxxy6rs8czp7.cloudfront.net/a02-room__c/a021i0000057vQ9AAI/bedroom_2iii.jpg.jpg",
                "__typename": "Image"
            },
            {
                "url": "https://dkxxy6rs8czp7.cloudfront.net/a02-room__c/a021i0000057vQ9AAI/detail.jpg.jpg",
                "__typename": "Image"
            }
        ],
        "rent": {
            "amount": 990,
            "currencySymbol": "€",
            "__typename": "Amount"
        },
        "area": {
            "unit": "sqm.",
            "value": 12.62,
            "__typename": "Area"
        },
        "apartment": {
            "id": "a0N1i00000AyGexEAF",
            "floor": "5th Floor",
            "bedrooms": 3,
            "amenities": [
                "1 Shared bathrooms",
                "Laundry lounge",
                "Dining area",
                "Fully equipped kitchen"
            ],
            "images": [
                {
                    "url": "https://dkxxy6rs8czp7.cloudfront.net/a0N-apartment__c/a0N1i00000AyGexEAF/corridor.jpg.jpg",
                    "__typename": "Image"
                },
                {
                    "url": "https://dkxxy6rs8czp7.cloudfront.net/a0N-apartment__c/a0N1i00000AyGexEAF/kitchen_1.jpg.jpg",
                    "__typename": "Image"
                },
                {
                    "url": "https://dkxxy6rs8czp7.cloudfront.net/a0N-apartment__c/a0N1i00000AyGexEAF/kitchen_2.jpg.jpg",
                    "__typename": "Image"
                },
                {
                    "url": "https://dkxxy6rs8czp7.cloudfront.net/a0N-apartment__c/a0N1i00000AyGexEAF/zams7_a_final.jpg.jpg",
                    "__typename": "Image"
                },
                {
                    "url": "https://dkxxy6rs8czp7.cloudfront.net/a0N-apartment__c/a0N1i00000AyGexEAF/zbathroom_1.jpg.jpg",
                    "__typename": "Image"
                }
            ],
            "__typename": "Apartment"
        },
        "property": {
            "id": "a011i00000GUqkNAAT",
            "code": "Amsterdamer Straße 7, 13347 Berlin, GER",
            "coordinates": {
                "latitude": 52.5505867,
                "longitude": 13.35581017,
                "__typename": "Coordinates"
            },
            "neighbourhood": {
                "name": "Wedding",
                "__typename": "Neighbourhood"
            },
            "amenities": [],
            "images": [],
            "address": {
                "addressLine1": "Amsterdamer Str. 7",
                "city": "Berlin",
                "__typename": "Address"
            },
            "__typename": "Property"
        },
        "__typename": "Room"
    };

    expect(scrapper.jsonToRoom(roomJson)).toStrictEqual({
        id: "a021i0000057vQ9AAI",
        "area": 12.62,
        "availableDate": "2022-10-19",
        "bedrooms": 3,
        "location": "Wedding",
        "rentEuros": 990,
        "shareType": "PRIVATE_ROOM"
    });
});

test('Get date time formatted', async () => {
    const testDate = new Date(2022, 3, 12, 12, 12, 45);
    const expectedDateString = "2022-04-12, 12:12:45 p.m."

    expect(scrapper.getDateTimeFormattedText(testDate)).toBe(expectedDateString)
    }
);
