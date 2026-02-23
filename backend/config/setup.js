import connectDB from "./db.js";
import mongoose from "mongoose";
await connectDB()
const clinet = mongoose.connection.getClient();

try {
  const db = mongoose.connection.db
  const command = 'collMod' // create OR MODIFY COLLECTION(collMod)
  //user collection schema validation
  await db.command({
    [command]: "users",//collecection modification
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: [
          '_id',
          'email',
          'name',
          'rootDirId'
        ],
        properties: {
          _id: {
            bsonType: 'objectId'
          },
          email: {
            bsonType: 'string',
            description: 'must be a valid email address',
            pattern: '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'
          },
          name: {
            bsonType: 'string',
            minLength: 3,
            description: 'must be a valid name at least 3 characters long',
          },
          password: {
            bsonType: 'string',
            minLength: 4
          },
          picture: {
            bsonType: ['string', 'null'],
          },
          rootDirId: {
            bsonType: 'objectId'
          },
          role: {
            enum: ["user", "admin", "manager", "owner"],
            bsonType: 'string'
          },
          isDelete: {
            bsonType: 'bool'
          },
          __v: {
            bsonType: 'int'
          }
        },
        additionalProperties: false
      }
    },
    validationAction: 'error',
    validationLevel: 'strict'
  })
  //directory collection schema validation
  await db.command({
    [command]: "directories",
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: [
          '_id',
          'name',
          'parentDirId',
          'userId'
        ],
        properties: {
          _id: {
            bsonType: 'objectId'
          },
          name: {
            bsonType: 'string'
          },
          parentDirId: {
            bsonType: [
              'null',
              'objectId'
            ]
          },
          userId: {
            bsonType: 'objectId'
          },
          sharedWith: {
            bsonType: "array",
            description: "Array of users with permissions",
            items: {
              bsonType: "object",
              required: ["user", "permission"],
              properties: {
                _id: {
                  bsonType: "objectId"
                },
                user: {
                  bsonType: "objectId",
                  description: "Reference to User _id"
                },
                permission: {
                  bsonType: "string",
                  enum: ["view", "edit"],
                  description: "Permission level"
                }
              },
              additionalProperties: false
            }
          },
          isPublic: {
            bsonType: 'bool'
          },
          __v: {
            bsonType: 'int'
          }
        },
        additionalProperties: false
      }
    },
    validationAction: 'error',
    validationLevel: 'strict'
  })
  //file collection schema validation
  await db.command({
    [command]: "files",
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: [
          '_id',
          'name',
          'extension',
          'parentDirId',
          'userId'
        ],
        properties: {
          _id: {
            bsonType: 'objectId'
          },
          name: {
            bsonType: 'string'
          },
          extension: {
            bsonType: 'string'
          },
          size: {
            bsonType: 'number'
          },
          parentDirId: {
            bsonType: 'objectId'
          },
          userId: {
            bsonType: 'objectId'
          },
          createdAt: {
            bsonType: 'date',
            description: 'Document creation time'
          },
          updatedAt: {
            bsonType: 'date',
            description: 'Document last update time'
          },
          sharedWith: {
            bsonType: "array",
            description: "Array of users with permissions",
            items: {
              bsonType: "object",
              required: ["user", "permission"],
              properties: {
                _id: {
                  bsonType: "objectId"
                },
                user: {
                  bsonType: "objectId",
                  description: "Reference to User _id"
                },
                permission: {
                  bsonType: "string",
                  enum: ["view", "edit"],
                  description: "Permission level"
                }
              },
              additionalProperties: false
            }
          },
          isPublic: {
            bsonType: 'bool'
          },
          __v: {
            bsonType: 'int'
          }
        },
        additionalProperties: false
      }
    },
    validationAction: 'error',
    validationLevel: 'strict'
  })
} catch (err) {
  console.log('Error setting up schema validation:', err)
} finally {
  await clinet.close();
}
