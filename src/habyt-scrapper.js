const https = require('https');
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
// const { SESClient, CloneReceiptRuleSetCommand } = require("@aws-sdk/client-ses");
const emailClient = new AWS.SES();
const params = {
    Destination: {
        ToAddresses: [
            'shivku.goku@gmail.com'
        ]
    },
    Message: {
        Body: {
            Html: {
                Charset: "UTF-8",
                Data: "There is a new room!!!<br>"
            }
        },
        Subject: {
            Charset: 'UTF-8',
            Data: 'Test email'
        }
    },
    Source: 'skumarsekartrp@gmail.com',
    ReplyToAddresses: [
        'skumarsekartrp@gmail.com'
    ],
};
const startDate = process.env.startDate
// const command = new CloneReceiptRuleSetCommand(params);

/**
 * Pass the data to send as `event.data`, and the request options as
 * `event.options`. For more information see the HTTPS module documentation
 * at https://nodejs.org/api/https.html.
 *
 * Will succeed with the response body.
 */
const body = {
    "query": "fragment baseRoomFields on Room {\n  id\n  code\n  bookable\n  availableDate\n  shareType\n  amenities\n  images {\n    url\n    __typename\n  }\n  rent {\n    amount\n    currencySymbol\n    __typename\n  }\n  area {\n    unit\n    value\n    __typename\n  }\n  apartment {\n    id\n    floor\n    bedrooms\n    amenities\n    images {\n      url\n      __typename\n    }\n    __typename\n  }\n  property {\n    id\n    code\n    coordinates {\n      latitude\n      longitude\n      __typename\n    }\n    neighbourhood {\n      name\n      __typename\n    }\n    amenities\n    images {\n      url\n      __typename\n    }\n    address {\n      addressLine1\n      city\n      __typename\n    }\n    __typename\n  }\n}\n\nquery RoomCollection($where: RoomFilter, $limit: Int, $offset: Int) {\n  roomCollection(where: $where, limit: $limit, offset: $offset) {\n    items {\n      ...baseRoomFields\n      __typename\n    }\n    __typename\n  }\n}",
    "operationName": "RoomCollection",
    "variables": {
        "where":
            {
                "city": "Berlin", "availableFrom": startDate, "shareType": null, "bookable": true
            },
        "limit": 2000
    }
};
const options = {
    hostname: 'www.habyt.com',
    port: 443,
    path: '/api/graphql',
    method: 'POST',
    body: body,
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': JSON.stringify(body).length
    },
};
const tableName = 'habyt-rooms';

exports.handler = async event => {
    try {
        const result = await postRequest();
        const newRooms = [];
        // Store in db
        for (const room of result.data.roomCollection.items) {
            try {
                await createRoom({
                    id: room.id,
                    availableDate: room.availableDate,
                    rentEuros: room.rent.amount,
                    shareType: room.shareType,
                    bedrooms: room.apartment.bedrooms,
                    area: room.area.value,
                    location: room.property.neighbourhood.name,
                    addedDate: getDateTimeFormattedText(getCurrentIstTime())
                });

                newRooms.push(jsonToRoom(room));
            } catch (error) {
                console.log("Row already exists!")
            }
        }
        ;

        if (newRooms.length > 0)
            await sendRoomsInEmail(newRooms);

        // 👇️️ response structure assume you use proxy integration with API gateway
        return {
            statusCode: 200,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(result),
        };
    } catch (error) {
        console.log('Error is: 👉️', error);
        return {
            statusCode: 400,
            body: error.message,
        };
    }
};

function postRequest() {
    return new Promise((resolve, reject) => {
        console.log("Call started");

        const req = https.request(options, res => {
            let rawData = '';

            res.on('data', chunk => {
                rawData += chunk;
            });

            res.on('end', () => {
                try {
                    console.log("Call done");
                    resolve(JSON.parse(rawData));
                } catch (err) {
                    reject(new Error(err));
                }
            });
        });

        req.on('error', err => {
            reject(new Error(err));
        });

        // 👇️ write the body to the Request object
        req.write(JSON.stringify(body));
        req.end();
    });
}

async function getRoom(roomId) {
    var params = {
        "Key": {
            "id": roomId
        },
        TableName: 'habyt-rooms'
    };
    var result = await dynamo.get(params).promise();
    return result.Item;
}

// https://stackoverflow.com/questions/44589967/how-to-fetch-scan-all-items-from-aws-dynamodb-using-node-js
async function getRooms() {
    console.log("Getting table results.")

    let scanResults = [];
    let items;
    let params = {TableName: tableName};

    do {
        items = await dynamo.scan(params).promise();
        items.Items.forEach((item) => scanResults.push(item));
        params.ExclusiveStartKey = items.LastEvaluatedKey;
    } while (typeof items.LastEvaluatedKey != "undefined");

    console.log("Printing results.")
    console.log(scanResults);
}

async function createRoom(room) {
    const params = {
        TableName: tableName,
        Item: room,
        ConditionExpression: "attribute_not_exists(id)",
        ReturnValues: 'NONE'
    };
    await dynamo.put(params).promise();
}

async function sendEmail(data) {
    // Send mail to me!!
    try {
        params.Message.Body.Html.Data = data;
        console.log("Sending mail")
        await emailClient.sendEmail(params).promise();
        console.log("Email sent!!")
    } catch (error) {

    } finally {
        // finally.
    }
}

async function sendRoomsInEmail(rooms) {

    const data = formatEmailText(rooms);

    await sendEmail(data)
}

function formatEmailText(rooms) {
    let data = `<html>
  The following rooms are available:<br>
      <table>
        <head>
            <style>
                table, th, td {
                  border: 1px solid black;
                }
            </style>
        </head>
        <tr>
          <th>
            Id
          </th>
          <th>
            Area
          </th>
          <th>
            Available date
          </th>
          <th>
            bedrooms
          </th>
          <th>
            Location
          </th>
          <th>
            Cost in euros
          </th>
          <th>
            Room type
          </th>
          <th>
            Url
          </th>
        </tr>
  `;

    for (const room of rooms) {
        data += `
          <tr>
              <td>
                ${room.id}
              </td>
              <td>
                ${room.area}
              </td>
              <td>
                ${room.availableDate}
              </td>
              <td>
                ${room.bedrooms}
              </td>
              <td>
                ${room.location}
              </td>
              <td>
                ${room.rentEuros}
              </td>
              <td>
                ${room.shareType}
              </td>
              <td>
                <a href="https://www.habyt.com/room/berlin/${room.code}">link</a>
              </td>
          </tr>
    `;
    }

    data += "</table></html>";
    return data;
}

function jsonToRoom(roomJson) {
    return new Room(roomJson.id,
        roomJson.availableDate,
        roomJson.rent.amount,
        roomJson.shareType,
        roomJson.apartment.bedrooms,
        roomJson.area.value,
        roomJson.property.neighbourhood.name,
        roomJson.code);
}

function getDateTimeFormattedText(date) {
    return date.toLocaleString('en-CA');
}

function getCurrentIstTime() {
    const date = new Date();
    var ISToffSet = 330; //IST is 5:30; i.e. 60*5+30 = 330 in minutes
    var offset = ISToffSet * 60 * 1000;
    var ISTTime = new Date(date.getTime() + offset);
    return ISTTime;
}

class Room {
    constructor(
        id,
        availableDate,
        rentEuros,
        shareType,
        bedrooms,
        area,
        location,
        code) {
        this.id = id;
        this.availableDate = availableDate;
        this.rentEuros = rentEuros;
        this.shareType = shareType;
        this.bedrooms = bedrooms;
        this.area = area;
        this.location = location;
        this.code = code;
    }
}

module.exports = {formatEmailText, jsonToRoom, getDateTimeFormattedText, getCurrentIstTime, Room}
