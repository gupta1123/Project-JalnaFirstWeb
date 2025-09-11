Social Service

https://social-service-backend-01d8c088884a.herokuapp.com/
https://jalnafirst-03821e1b4515.herokuapp.com/


User
Register
Post call
http://localhost:5000/api/auth/register
Payload:
{
    "email": "shilpa.tribhuwan@gmail.com",
    "password": "password123",
    "firstName": "Shilpa",
    "lastName": "K",
    "phoneNumber": "1234567890"
}
Response:
{
    "message": "User registered successfully",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODk5YTMxMzVlNDFjOTE2ZmIzMTJhNmQiLCJpYXQiOjE3NTQ4OTkyMjAsImV4cCI6MTc1NTUwNDAyMH0.9TgP3dy4u4cv4fZRi9ml2Yig-lKsZ0Bj8P1h-_xL-94",
    "user": {
        "firstName": "Shilpa",
        "lastName": "K",
        "email": "shilpa.tribhuwan@gmail.com",
        "phoneNumber": "1234567890",
        "plainTextPassword": "password123",
        "profilePhoto": null,
        "isEmailVerified": false,
        "isActive": true,
        "isBlocked": false,
        "role": "user",
        "adminPrivileges": {
            "canManageUsers": false,
            "canManageContent": false,
            "canManageSettings": false,
            "canUploadDocs": false,
            "canEditPhoneNumbers": false
        },
        "profileVisibility": "public",
        "_id": "6899a3135e41c916fb312a6d",
        "lastActive": "2025-08-11T08:00:19.342Z",
        "createdAt": "2025-08-11T08:00:19.372Z",
        "updatedAt": "2025-08-11T08:00:19.372Z",
        "__v": 0,
        "fullName": "Shilpa K",
        "id": "6899a3135e41c916fb312a6d"
    }
}

Login
Post Call
http://localhost:5000/api/auth/login
Payload:
{
    "email": "shilpa.tribhuwan@gmail.com",
    "password": "password123"
}
Response:
{
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODk5YTMxMzVlNDFjOTE2ZmIzMTJhNmQiLCJpYXQiOjE3NTQ4OTkyNDksImV4cCI6MTc1NTUwNDA0OX0.Jg8BFxa7ZB3ZOIAxfTAQ4Fhuv1kMvhLoYtnD6qd7uvY",
    "user": {
        "adminPrivileges": {
            "canManageUsers": false,
            "canManageContent": false,
            "canManageSettings": false,
            "canUploadDocs": false,
            "canEditPhoneNumbers": false
        },
        "_id": "6899a3135e41c916fb312a6d",
        "firstName": "Shilpa",
        "lastName": "K",
        "email": "shilpa.tribhuwan@gmail.com",
        "phoneNumber": "1234567890",
        "profilePhoto": null,
        "isEmailVerified": false,
        "isActive": true,
        "isBlocked": false,
        "role": "user",
        "profileVisibility": "public",
        "lastActive": "2025-08-11T08:00:49.080Z",
        "createdAt": "2025-08-11T08:00:19.372Z",
        "updatedAt": "2025-08-11T08:00:49.084Z",
        "__v": 0,
        "fullName": "Shilpa K",
        "id": "6899a3135e41c916fb312a6d"
    }
}

Create Admin (Only for Super admin)
Post Call
{
  "email": "shubhamtribhuwan017@gmail.com",
  "password": "password123",
  "firstName": "New",
  "lastName": "Admin",
  "role": "admin"
}
Response:
{
    "message": "Admin created successfully",
    "admin": {
        "id": "6899a619a576c47c0916ad59",
        "email": "shubhamtribhuwan017@gmail.com",
        "firstName": "New",
        "lastName": "Admin",
        "role": "admin",
        "privileges": {
            "canManageUsers": true,
            "canManageContent": true,
            "canManageSettings": false,
            "canUploadDocs": true,
            "canEditPhoneNumbers": true
        }
    }
}

Get Admins
http://localhost:5000/api/setup/check-admin
Response:
{
    "exists": true,
    "admin": {
        "id": "68998e8201967d70e66c3ea7",
        "email": "shilpa.tribhuwan06@gmail.com",
        "role": "superadmin"
    }
}

Reset Password for admin
Post Call
http://localhost:5000/api/setup/reset-admin-password
Payload:
{
    "email": "shilpa.tribhuwan06@gmail.com",
    "newPassword": "password123"
}
Response:
{
    "message": "Admin password reset successfully",
    "admin": {
        "id": "68998e8201967d70e66c3ea7",
        "email": "shilpa.tribhuwan06@gmail.com",
        "role": "superadmin"
    }
}

Reset Password for all
Post Call
http://localhost:5000/api/auth/reset-password
(For all the staff - self)
Payload:
{
    "oldPassword": "currentPass123",
    "newPassword": "newPass456"
}
Admin editing password for other staff:
{
    "userId": "<targetUserId>",
    "newPassword": "newPass456"
}




Check super admin
Get Call
http://localhost:5000/api/setup/check-superadmin
Response:
{
    "exists": true,
    "superadmin": {
        "id": "68998e8201967d70e66c3ea7",
        "email": "shilpa.tribhuwan06@gmail.com",
        "firstName": "Shilpa",
        "lastName": "K"
    }
}

Delete User/Admin
Delete call
http://localhost:5000/api/setup/delete-user/shilpa.tribhuwan06@gmail.com
Response:
{
    "message": "User deleted successfully",
    "deletedUser": {
        "id": "68999cc2b48a811ce7977afd",
        "email": "shilpa.tribhuwan06@gmail.com",
        "role": "superadmin"
    }
}
Create super admin
Post Call
http://localhost:5000/api/setup/create-superadmin
Payload:
{
  "email": "shilpa.tribhuwan06@gmail.com",
  "password": "password123",
  "firstName": "Shilpa",
  "lastName": "K"
}

REsponse:
{
    "message": "Superadmin created successfully",
    "superadmin": {
        "id": "6899a534a576c47c0916ad52",
        "email": "shilpa.tribhuwan06@gmail.com",
        "firstName": "Shilpa",
        "lastName": "K",
        "role": "superadmin"
    }
}

Login for super admin
Post Call
http://localhost:5000/api/auth/login
Payload:
{
  "email": "shilpa.tribhuwan06@gmail.com",
  "password": "password123"
}
Response:
{
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODk5YTUzNGE1NzZjNDdjMDkxNmFkNTIiLCJpYXQiOjE3NTQ4OTk4NTAsImV4cCI6MTc1NTUwNDY1MH0.mOB8Lgu5iYKhOC6riEp8R1IAdIOL6uaLmk0TrTlQWNQ",
    "user": {
        "adminPrivileges": {
            "canManageUsers": true,
            "canManageContent": true,
            "canManageSettings": true,
            "canUploadDocs": true,
            "canEditPhoneNumbers": true
        },
        "_id": "6899a534a576c47c0916ad52",
        "firstName": "Shilpa",
        "lastName": "K",
        "email": "shilpa.tribhuwan06@gmail.com",
        "profilePhoto": null,
        "isEmailVerified": true,
        "isActive": true,
        "isBlocked": false,
        "role": "superadmin",
        "profileVisibility": "public",
        "lastActive": "2025-08-11T08:10:50.306Z",
        "createdAt": "2025-08-11T08:09:24.158Z",
        "updatedAt": "2025-08-11T08:10:50.311Z",
        "__v": 0,
        "fullName": "Shilpa K",
        "id": "6899a534a576c47c0916ad52"
    }
}

Get All admins
Get Call
http://localhost:5000/api/admin/admins
Response:

{
    "admins": [
        {
            "adminPrivileges": {
                "canManageUsers": true,
                "canManageContent": true,
                "canManageSettings": true,
                "canUploadDocs": true,
                "canEditPhoneNumbers": true
            },
            "_id": "6899a534a576c47c0916ad52",
            "firstName": "Shilpa",
            "lastName": "K",
            "email": "shilpa.tribhuwan06@gmail.com",
            "profilePhoto": null,
            "isEmailVerified": true,
            "isActive": true,
            "isBlocked": false,
            "role": "superadmin",
            "profileVisibility": "public",
            "lastActive": "2025-08-11T08:10:50.306Z",
            "createdAt": "2025-08-11T08:09:24.158Z",
            "updatedAt": "2025-08-11T08:10:50.311Z",
            "__v": 0,
            "fullName": "Shilpa K",
            "id": "6899a534a576c47c0916ad52"
        },
        {
            "adminPrivileges": {
                "canManageUsers": true,
                "canManageContent": true,
                "canManageSettings": false,
                "canUploadDocs": true,
                "canEditPhoneNumbers": true
            },
            "_id": "6899a619a576c47c0916ad59",
            "firstName": "New",
            "lastName": "Admin",
            "email": "shubhamtribhuwan017@gmail.com",
            "profilePhoto": null,
            "isEmailVerified": true,
            "isActive": true,
            "isBlocked": false,
            "role": "admin",
            "profileVisibility": "public",
            "lastActive": "2025-08-11T08:13:13.343Z",
            "createdAt": "2025-08-11T08:13:13.348Z",
            "updatedAt": "2025-08-11T08:13:13.348Z",
            "__v": 0,
            "fullName": "New Admin",
            "id": "6899a619a576c47c0916ad59"
        }
    ]
}
Get Current user details
Get Call
http://localhost:5000/api/users/me
Response:
{
    "message": "Profile updated successfully",
    "user": {
        "location": {
            "coordinates": {
                "latitude": 18.9933,
                "longitude": 73.1155
            },
            "city": "New Mumbai",
            "state": "Maharashtra",
            "country": "India"
        },
        "address": {
            "line1": "123 Main St",
            "line2": "Apt 4B",
            "city": "New Mumbai",
            "state": "Maharashtra",
            "zipCode": "410206",
            "country": "India"
        },
        "businessDetails": {
            "businessType": "Technology"
        },
        "adminPrivileges": {
            "canManageUsers": false,
            "canManageContent": false,
            "canManageSettings": false,
            "canUploadDocs": false,
            "canEditPhoneNumbers": false
        },
        "profilePhotoUrl": null,
        "_id": "6899a3135e41c916fb312a6d",
        "firstName": "Shilpa",
        "lastName": "K",
        "email": "shilpa.tribhuwan@gmail.com",
        "phoneNumber": "1234567890",
        "isEmailVerified": false,
        "isActive": true,
        "isBlocked": false,
        "role": "user",
        "profileVisibility": "public",
        "lastActive": "2025-08-14T07:40:23.730Z",
        "createdAt": "2025-08-11T08:00:19.372Z",
        "updatedAt": "2025-08-14T08:35:43.882Z",
        "__v": 0,
        "education": "Bachelor's in Computer Science",
        "occupation": "Software Engineer",
        "aadhaarNumber": "123456789012",
        "profilePhoto": null,
        "preferredLanguage": "en",
        "dateOfBirth": "1991-12-06T00:00:00.000Z",
        "fullName": "Shilpa K",
        "id": "6899a3135e41c916fb312a6d"
    }
}





Edit profile
Put Call
https://social-service-backend-01d8c088884a.herokuapp.com/api/users/me
Payload:
{
    // Optional Fields (only provided fields will be updated)
    "firstName": "John",                // Optional, max 25 chars
    "lastName": "Doe",                  // Optional, max 25 chars
    "phoneNumber": "+1234567890",       // Optional, must be valid format
    "description": "Software Developer", // Optional, max 500 chars
    "education": "Bachelor's in Computer Science",  // Optional, max 200 chars
    "dateOfBirth": "1991-12-06",


    // Optional Location Details
    "location": {
        "city": "New York",             // Optional
        "state": "NY",                  // Optional
        "country": "USA",               // Optional
        "coordinates": {                 // Optional
            "latitude": 40.7128,
            "longitude": -74.0060
        }
    },


    // Optional Address Details
    "address": {
        "line1": "123 Main St",         // Optional
        "line2": "Apt 4B",              // Optional
        "city": "New York",             // Optional
        "state": "NY",                  // Optional
        "zipCode": "10001",             // Optional
        "country": "USA"                // Optional
    },


    // Optional Settings
    "profileVisibility": "public",      // Optional: "public" | "private"
    "preferredLanguage": "en"           // Optional: "en" | "hi" | "mr"
}
Response:
{
    "message": "Profile updated successfully",
    "user": {
        "location": {
            "city": "New Mumbai",
            "state": "Maharashtra",
            "country": "India",
            "coordinates": {
                "latitude": 18.9933,
                "longitude": 73.1155
            }
        },
        "address": {
            "line1": "123 Main St",
            "line2": "Apt 4B",
            "city": "New Mumbai",
            "state": "Maharashtra",
            "zipCode": "410206",
            "country": "India"
        },
        "businessDetails": {
            "businessType": "Technology"
        },
        "adminPrivileges": {
            "canManageUsers": false,
            "canManageContent": false,
            "canManageSettings": false,
            "canUploadDocs": false,
            "canEditPhoneNumbers": false
        },
        "_id": "6899a3135e41c916fb312a6d",
        "firstName": "Shilpa",
        "lastName": "K",
        "email": "shilpa.tribhuwan@gmail.com",
        "phoneNumber": "1234567890",
        "profilePhoto": null,
        "isEmailVerified": false,
        "isActive": true,
        "isBlocked": false,
        "role": "user",
        "profileVisibility": "public",
        "lastActive": "2025-08-11T08:20:52.163Z",
        "createdAt": "2025-08-11T08:00:19.372Z",
        "updatedAt": "2025-08-11T08:37:08.534Z",
        "__v": 0,
        "education": "Bachelor's in Computer Science",
        "occupation": "Software Engineer",
        "fullName": "Shilpa K",
        "id": "6899a3135e41c916fb312a6d"
    }
}


Upload photo
http://localhost:5000/api/profile/photo
Post Call
Response:
{
    "message": "Profile photo uploaded successfully",
    "user": {
        "location": {
            "coordinates": {
                "latitude": 18.9933,
                "longitude": 73.1155
            },
            "city": "New Mumbai",
            "state": "Maharashtra",
            "country": "India"
        },
        "address": {
            "line1": "123 Main St",
            "line2": "Apt 4B",
            "city": "New Mumbai",
            "state": "Maharashtra",
            "zipCode": "410206",
            "country": "India"
        },
        "businessDetails": {
            "businessType": "Technology"
        },
        "adminPrivileges": {
            "canManageUsers": false,
            "canManageContent": false,
            "canManageSettings": false,
            "canUploadDocs": false,
            "canEditPhoneNumbers": false
        },
        "_id": "6899a3135e41c916fb312a6d",
        "firstName": "Shilpa",
        "lastName": "K",
        "email": "shilpa.tribhuwan@gmail.com",
        "phoneNumber": "1234567890",
        "isEmailVerified": false,
        "isActive": true,
        "isBlocked": false,
        "role": "user",
        "profileVisibility": "public",
        "lastActive": "2025-08-11T10:00:45.904Z",
        "createdAt": "2025-08-11T08:00:19.372Z",
        "updatedAt": "2025-08-11T10:11:46.474Z",
        "__v": 0,
        "education": "Bachelor's in Computer Science",
        "occupation": "Software Engineer",
        "aadhaarNumber": "123456789012",
        "fullName": "Shilpa K",
        "id": "6899a3135e41c916fb312a6d"
    }
}
Delete Profile Photo
Delete call
http://localhost:5000/api/profile/photo
Response:
{
    "message": "Profile photo deleted successfully",
    "user": {
        "location": {
            "coordinates": {
                "latitude": 18.9933,
                "longitude": 73.1155
            },
            "city": "New Mumbai",
            "state": "Maharashtra",
            "country": "India"
        },
        "address": {
            "line1": "123 Main St",
            "line2": "Apt 4B",
            "city": "New Mumbai",
            "state": "Maharashtra",
            "zipCode": "410206",
            "country": "India"
        },
        "businessDetails": {
            "businessType": "Technology"
        },
        "adminPrivileges": {
            "canManageUsers": false,
            "canManageContent": false,
            "canManageSettings": false,
            "canUploadDocs": false,
            "canEditPhoneNumbers": false
        },
        "_id": "6899a3135e41c916fb312a6d",
        "firstName": "Shilpa",
        "lastName": "K",
        "email": "shilpa.tribhuwan@gmail.com",
        "phoneNumber": "1234567890",
        "isEmailVerified": false,
        "isActive": true,
        "isBlocked": false,
        "role": "user",
        "profileVisibility": "public",
        "lastActive": "2025-08-11T10:00:45.904Z",
        "createdAt": "2025-08-11T08:00:19.372Z",
        "updatedAt": "2025-08-11T10:24:42.302Z",
        "__v": 0,
        "education": "Bachelor's in Computer Science",
        "occupation": "Software Engineer",
        "aadhaarNumber": "123456789012",
        "profilePhoto": null,
        "fullName": "Shilpa K",
        "id": "6899a3135e41c916fb312a6d"
    }
}

Upload photo
Post Call
http://localhost:5000/api/profile/photo
Response:
{
    "message": "Profile photo uploaded successfully",
    "photoUrl": "http://localhost:5000/uploads/profile-1754908091167-381335243.jpg",
    "thumbnailUrl": "http://localhost:5000/uploads/profile-1754908091167-381335243.jpg",
    "originalFilename": "pexels-tomfisk-1519753.jpg",
    "uploadedPhoto": {
        "filename": "profile-1754908091167-381335243.jpg",
        "url": "http://localhost:5000/uploads/profile-1754908091167-381335243.jpg",
        "size": 134862,
        "width": 800,
        "height": 406,
        "format": "jpeg",
        "originalInfo": {
            "size": 7997012,
            "width": 8192,
            "height": 4159
        },
        "compressionStats": {
            "originalSize": 7997012,
            "compressedSize": 134862,
            "compressionRatio": "1.69%",
            "originalDimensions": {
                "width": 8192,
                "height": 4159
            },
            "compressedDimensions": {
                "width": 800,
                "height": 406
            }
        }
    },
    "user": {
        "location": {
            "coordinates": {
                "latitude": 18.9933,
                "longitude": 73.1155
            },
            "city": "New Mumbai",
            "state": "Maharashtra",
            "country": "India"
        },
        "address": {
            "line1": "123 Main St",
            "line2": "Apt 4B",
            "city": "New Mumbai",
            "state": "Maharashtra",
            "zipCode": "410206",
            "country": "India"
        },
        "businessDetails": {
            "businessType": "Technology"
        },
        "adminPrivileges": {
            "canManageUsers": false,
            "canManageContent": false,
            "canManageSettings": false,
            "canUploadDocs": false,
            "canEditPhoneNumbers": false
        },
        "_id": "6899a3135e41c916fb312a6d",
        "firstName": "Shilpa",
        "lastName": "K",
        "email": "shilpa.tribhuwan@gmail.com",
        "phoneNumber": "1234567890",
        "isEmailVerified": false,
        "isActive": true,
        "isBlocked": false,
        "role": "user",
        "profileVisibility": "public",
        "lastActive": "2025-08-11T10:00:45.904Z",
        "createdAt": "2025-08-11T08:00:19.372Z",
        "updatedAt": "2025-08-11T10:28:11.335Z",
        "__v": 0,
        "education": "Bachelor's in Computer Science",
        "occupation": "Software Engineer",
        "aadhaarNumber": "123456789012",
        "profilePhoto": "profile-1754908091167-381335243.jpg",
        "fullName": "Shilpa K",
        "id": "6899a3135e41c916fb312a6d"
    }
}
Get All Users
https://social-service-backend-01d8c088884a.herokuapp.com/api/users?page=1&limit=10&search=john&role=user&isActive=true
Response:
{
    "message": "Users retrieved successfully",
    "users": [
        {
            "adminPrivileges": {
                "canManageUsers": false,
                "canManageContent": false,
                "canManageSettings": false,
                "canUploadDocs": false,
                "canEditPhoneNumbers": false
            },
            "_id": "689b847b3f9712b19e3d4acf",
            "firstName": "Test",
            "lastName": "User",
            "email": "test@example.com",
            "profilePhoto": null,
            "isEmailVerified": false,
            "isActive": true,
            "isBlocked": false,
            "role": "user",
            "profileVisibility": "public",
            "preferredLanguage": "en",
            "lastActive": "2025-08-12T18:14:19.974Z",
            "createdAt": "2025-08-12T18:14:19.993Z",
            "updatedAt": "2025-08-12T18:14:19.993Z",
            "__v": 0,
            "fullName": "Test User",
            "id": "689b847b3f9712b19e3d4acf"
        },
        {
            "location": {
                "city": "Jalna",
                "state": "Maharashtra",
                "country": "India"
            },
            "address": {
                "city": "Jalna",
                "state": "Maharashtra",
                "country": "India"
            },
    ],
    "pagination": {
        "currentPage": 1,
        "totalPages": 1,
        "totalUsers": 6,
        "hasNextPage": false,
        "hasPrevPage": false
    }
}

Get User By Id
https://social-service-backend-01d8c088884a.herokuapp.com/api/users/6899a619a576c47c0916ad59
Response:
{
    "message": "Users retrieved successfully",
    "user": {
        "adminPrivileges": {
            "canManageUsers": true,
            "canManageContent": true,
            "canManageSettings": false,
            "canUploadDocs": true,
            "canEditPhoneNumbers": true
        },
        "preferredLanguage": "en",
        "_id": "6899a619a576c47c0916ad59",
        "firstName": "New",
        "lastName": "Admin",
        "email": "shubhamtribhuwan017@gmail.com",
        "profilePhoto": null,
        "isEmailVerified": true,
        "isActive": true,
        "isBlocked": false,
        "role": "admin",
        "profileVisibility": "public",
        "lastActive": "2025-08-12T18:39:55.855Z",
        "createdAt": "2025-08-11T08:13:13.348Z",
        "updatedAt": "2025-08-12T18:39:55.855Z",
        "__v": 0,
        "fullName": "New Admin",
        "id": "6899a619a576c47c0916ad59"
    }
}

User Stats
Get Call
https://social-service-backend-01d8c088884a.herokuapp.com/api/admin/user-stats
Response:
{
    "totalUsers": 25,
    "usersThisWeek": 25,
    "usersThisMonth": 25
}



Agency Contacts
Create New Contact(Admin)
Post Call
http://localhost:5000/api/agency-contacts
Payload:
{
  "name": "Name 1",                 // Required
  "designation": "SI Commisioner",    // Required
  "phoneNumbers": [                      // Required (array)
    { "number": "+911122334455", "type": "office" }
  ],
  "agencyName": "City Police",         // Required
  "agencyType": "police",              // Required, enum: 'police' | 'fire' | 'medical' | 'municipal' | 'government' | 'other'
  "zone": "South",                     // Required
  "area": "Sector 12"                 // Optional
}
Response:
{
    "message": "Agency contact created successfully",
    "contact": {
        "name": "Name 1",
        "designation": "SI Commisioner",
        "phoneNumbers": [
            {
                "number": "+911122334455",
                "type": "office",
                "_id": "689a1426e4fbab4b3a6f7508"
            }
        ],
        "agencyName": "City Police",
        "agencyType": "police",
        "zone": "South",
        "area": "Sector 12",
        "address": {
            "country": "India"
        },
        "isEmergencyContact": false,
        "priority": 0,
        "addedBy": "6899a619a576c47c0916ad59",
        "lastUpdatedBy": "6899a619a576c47c0916ad59",
        "isActive": true,
        "_id": "689a1426e4fbab4b3a6f7507",
        "createdAt": "2025-08-11T16:02:46.613Z",
        "updatedAt": "2025-08-11T16:02:46.613Z",
        "__v": 0
    }
}

Get All agencies
Get Call
http://localhost:5000/api/agency-contacts

Call With Filters
http://localhost:5000/api/agency-contacts?agencyType=police&zone=North&isActive=true&search=commissioner&page=1&limit=10
Response:
{
    "contacts": [
        {
            "address": {
                "country": "India"
            },
            "_id": "689a1426e4fbab4b3a6f7507",
            "name": "Name 1",
            "designation": "SI Commisioner",
            "phoneNumbers": [
                {
                    "number": "+911122334455",
                    "type": "office",
                    "_id": "689a1426e4fbab4b3a6f7508"
                }
            ],
            "agencyName": "City Police",
            "agencyType": "police",
            "zone": "South",
            "area": "Sector 12",
            "isEmergencyContact": false,
            "priority": 0,
            "addedBy": {
                "_id": "6899a619a576c47c0916ad59",
                "firstName": "New",
                "lastName": "Admin",
                "email": "shubhamtribhuwan017@gmail.com",
                "fullName": "New Admin",
                "id": "6899a619a576c47c0916ad59"
            },
            "lastUpdatedBy": {
                "_id": "6899a619a576c47c0916ad59",
                "firstName": "New",
                "lastName": "Admin",
                "email": "shubhamtribhuwan017@gmail.com",
                "fullName": "New Admin",
                "id": "6899a619a576c47c0916ad59"
            },
            "isActive": true,
            "createdAt": "2025-08-11T16:02:46.613Z",
            "updatedAt": "2025-08-11T16:02:46.613Z",
            "__v": 0
        },
        {
            "address": {
                "country": "India"
            },
            "_id": "689a14e7e4fbab4b3a6f750b",
            "name": "Name 2",
            "designation": "SI Commisioner",
            "phoneNumbers": [
                {
                    "number": "+911122668800",
                    "type": "office",
                    "_id": "689a14e7e4fbab4b3a6f750c"
                }
            ],
            "agencyName": "City Police",
            "agencyType": "police",
            "zone": "North",
            "area": "Sector 7",
            "isEmergencyContact": false,
            "priority": 0,
            "addedBy": {
                "_id": "6899a619a576c47c0916ad59",
                "firstName": "New",
                "lastName": "Admin",
                "email": "shubhamtribhuwan017@gmail.com",
                "fullName": "New Admin",
                "id": "6899a619a576c47c0916ad59"
            },
            "lastUpdatedBy": {
                "_id": "6899a619a576c47c0916ad59",
                "firstName": "New",
                "lastName": "Admin",
                "email": "shubhamtribhuwan017@gmail.com",
                "fullName": "New Admin",
                "id": "6899a619a576c47c0916ad59"
            },
            "isActive": true,
            "createdAt": "2025-08-11T16:05:59.590Z",
            "updatedAt": "2025-08-11T16:05:59.590Z",
            "__v": 0
        }
    ],
    "pagination": {
        "current": 1,
        "limit": 10,
        "total": 2,
        "pages": 1
    }
}

Edit Contact Details
Put Call
http://localhost:5000/api/agency-contacts/689a1426e4fbab4b3a6f7507
Payload:
{ "designation": "SI Commissioner"    // Required
 
}
Response:
{
    "message": "Agency contact updated successfully",
    "contact": {
        "address": {
            "country": "India"
        },
        "_id": "689a1426e4fbab4b3a6f7507",
        "name": "Name 1",
        "designation": "SI Commissioner",
        "phoneNumbers": [
            {
                "number": "+911122334455",
                "type": "office",
                "_id": "689a1426e4fbab4b3a6f7508"
            }
        ],
        "agencyName": "City Police",
        "agencyType": "police",
        "zone": "South",
        "area": "Sector 12",
        "isEmergencyContact": false,
        "priority": 0,
        "addedBy": "6899a619a576c47c0916ad59",
        "lastUpdatedBy": "6899a619a576c47c0916ad59",
        "isActive": true,
        "createdAt": "2025-08-11T16:02:46.613Z",
        "updatedAt": "2025-08-11T16:26:44.593Z",
        "__v": 0
   
Ticket System
Create Ticket
Post Call
https://social-service-backend-01d8c088884a.herokuapp.com/api/tickets
Payload:
{
  "title": "Login issue with mobile app",           // Required, max 200 chars
  "description": "I cannot login to the mobile app. It shows an error message.", // Required, max 5000 chars
  "category": "technical",                          // Optional, enum: complaint, support, bug, feature_request, general, technical, billing, other
"subCategory": "Voltage fluctuation",
  "priority": "high",                               // Optional, enum: low, medium, high, urgent
  "location": {                                     // Optional
    "zone": "North",
    "city": "Mumbai",
    "state": "Maharashtra",
"coordinates": { "latitude": 19.076, "longitude": 72.8777 }


  },
  "tags": ["mobile", "login", "urgent"]            // Optional array of strings
}
Response:
{
    "message": "Ticket created successfully",
    "ticket": {
        "title": "Login issue with mobile app",
        "description": "I cannot login to the mobile app. It shows an error message.",
        "category": "technical",
        "priority": "high",
        "status": "open",
        "createdBy": {
            "_id": "6899a534a576c47c0916ad52",
            "firstName": "Shilpa",
            "lastName": "K",
            "email": "shilpa.tribhuwan06@gmail.com",
            "fullName": "Shilpa K",
            "id": "6899a534a576c47c0916ad52"
        },
        "location": {
            "zone": "Zone A",
            "area": "Sector 5",
            "city": "Mumbai",
            "state": "Maharashtra",
            "coordinates": {
                "latitude": 19.076,
                "longitude": 72.8777
            }
        },
        "tags": [
            "mobile",
            "login",
            "urgent"
        ],
        "escalated": false,
        "slaBreached": false,
        "isPublic": false,
        "_id": "689b9c15b51a631d7791f6fe",
        "attachments": [],
        "internalNotes": [],
        "createdAt": "2025-08-12T19:55:01.601Z",
        "updatedAt": "2025-08-12T19:55:01.601Z",
        "ticketNumber": "TKT-202508-0001",
        "__v": 0,
        "age": 0,
        "isOverdue": false,
        "id": "689b9c15b51a631d7791f6fe"
    }
}

Get My Tickets(For a user)
Get Call
https://social-service-backend-01d8c088884a.herokuapp.com/api/tickets/my-tickets?page=1&limit=10&status=open&category=technical&sortBy=createdAt&sortOrder=desc
Response:
{
    "tickets": [
        {
            "location": {
                "coordinates": {
                    "latitude": 19.076,
                    "longitude": 72.8777
                },
                "zone": "Zone A",
                "area": "Sector 5",
                "city": "Mumbai",
                "state": "Maharashtra"
            },
            "_id": "68bea7f17c9ff4dea93ff781",
            "title": "Streetlight not working",
            "description": "Pole near Sector 5 is out.",
            "category": "streetlights",
            "priority": "medium",
            "status": "open",
            "createdBy": {
                "_id": "6899a3135e41c916fb312a6d",
                "firstName": "Shilpa",
                "lastName": "K",
                "email": "shilpa.tribhuwan@gmail.com",
                "fullName": "Shilpa K",
                "id": "6899a3135e41c916fb312a6d"
            },
            "assignedTeams": [],
            "tags": [],
            "attachments": [],
            "adminNotes": [],
            "changeHistory": [],
            "createdAt": "2025-09-08T09:54:57.763Z",
            "updatedAt": "2025-09-08T09:54:57.763Z",
            "ticketNumber": "TKT-202509-0001",
            "__v": 0,
            "age": 0,
            "id": "68bea7f17c9ff4dea93ff781"
        }
    ],
    "pagination": {
        "currentPage": 1,
        "totalPages": 1,
        "totalTickets": 2,
        "hasNextPage": false,
        "hasPrevPage": false
    }
}




Get By Id
Get Call
https://social-service-backend-01d8c088884a.herokuapp.com/api/tickets/689b9c15b51a631d7791f6fe
Response:
{
    "ticket": {
        "location": {
            "zone": "North",
            "city": "Mumbai",
            "state": "Maharashtra"
        },
        "_id": "689b9c15b51a631d7791f6fe",
        "title": "Login issue with mobile app",
        "description": "I cannot login to the mobile app. It shows an error message.",
        "category": "technical",
        "priority": "high",
        "status": "open",
        "createdBy": {
            "_id": "6899a534a576c47c0916ad52",
            "firstName": "Shilpa",
            "lastName": "K",
            "email": "shilpa.tribhuwan06@gmail.com",
            "fullName": "Shilpa K",
            "id": "6899a534a576c47c0916ad52"
        },
        "tags": [
            "mobile",
            "login",
            "urgent"
        ],
        "escalated": false,
        "slaBreached": false,
        "isPublic": false,
        "attachments": [],
        "internalNotes": [],
        "createdAt": "2025-08-12T19:55:01.601Z",
        "updatedAt": "2025-08-12T19:55:01.601Z",
        "ticketNumber": "TKT-202508-0001",
        "__v": 0,
        "age": 0,
        "isOverdue": false,
        "id": "689b9c15b51a631d7791f6fe"
    }
}

Update the ticket
Put Call
https://social-service-backend-01d8c088884a.herokuapp.com/api/tickets/689b9c15b51a631d7791f6fe
Payload:
{
  "title": "Updated title for login issue",        // Optional
  "description": "Updated description with more details", // Optional
  "location": {                                    // Optional
    "zone": "South Zone",
    "area": "Suburban"
  }
}
Response:
{
    "message": "Ticket updated successfully",
    "ticket": {
        "location": {
            "zone": "North",
            "city": "Mumbai",
            "state": "Maharashtra"
        },
        "_id": "689b9c15b51a631d7791f6fe",
        "title": "Login issue with mobile app",
        "description": "I cannot login to the mobile app. It shows an error message.",
        "category": "technical",
        "priority": "high",
        "status": "open",
        "createdBy": {
            "_id": "6899a534a576c47c0916ad52",
            "firstName": "Shilpa",
            "lastName": "K",
            "email": "shilpa.tribhuwan06@gmail.com",
            "fullName": "Shilpa K",
            "id": "6899a534a576c47c0916ad52"
        },
        "tags": [
            "mobile",
            "login",
            "urgent"
        ],
        "escalated": false,
        "slaBreached": false,
        "isPublic": false,
        "attachments": [],
        "internalNotes": [],
        "createdAt": "2025-08-12T19:55:01.601Z",
        "updatedAt": "2025-08-12T19:55:01.601Z",
        "ticketNumber": "TKT-202508-0001",
        "__v": 0,
        "age": 0,
        "isOverdue": false,
        "id": "689b9c15b51a631d7791f6fe"
    }
}

Get All Tickets (Admin)
Get Call
Query Parameters:
- page: Page number (default: 1)
- limit: Items per page (default: 20, max: 100)
- status: Filter by status (open, in_progress, resolved, closed)
- category: Filter by category
- priority: Filter by priority
- search: Search in title, description, or ticket number
- sortBy: Sort field (createdAt, updatedAt, priority, status, ticketNumber)
- sortOrder: Sort order (asc/desc)
https://social-service-backend-01d8c088884a.herokuapp.com/api/tickets/admin/all?page=1&limit=20&status=closed&search=login&sortBy=createdAt&sortOrder=desc&userId=689d8690027cf3d9de3ea6b6
Response:
{
    "tickets": [
        {
            "location": {
                "zone": "North",
                "city": "Mumbai",
                "state": "Maharashtra"
            },
            "_id": "689b9c15b51a631d7791f6fe",
            "title": "Login issue with mobile app",
            "description": "I cannot login to the mobile app. It shows an error message.",
            "category": "technical",
            "priority": "high",
            "status": "open",
            "createdBy": {
                "_id": "6899a534a576c47c0916ad52",
                "firstName": "Shilpa",
                "lastName": "K",
                "email": "shilpa.tribhuwan06@gmail.com",
                "fullName": "Shilpa K",
                "id": "6899a534a576c47c0916ad52"
            },
            "tags": [
                "mobile",
                "login",
                "urgent"
            ],
            "escalated": false,
            "slaBreached": false,
            "isPublic": false,
            "attachments": [],
            "internalNotes": [],
            "createdAt": "2025-08-12T19:55:01.601Z",
            "updatedAt": "2025-08-12T19:55:01.601Z",
            "ticketNumber": "TKT-202508-0001",
            "__v": 0,
            "adminNotes": [],
            "age": 0,
            "id": "689b9c15b51a631d7791f6fe"
        }
    ],
    "pagination": {
        "currentPage": 1,
        "totalPages": 1,
        "totalTickets": 1,
        "hasNextPage": false,
        "hasPrevPage": false
    }
}

Get Ticket By Id (Admin)
Get Call
https://social-service-backend-01d8c088884a.herokuapp.com/api/tickets/admin/689b9c15b51a631d7791f6fe
REsponse:
{
    "ticket": {
        "location": {
            "coordinates": {
                "latitude": 19.076,
                "longitude": 72.8777
            },
            "zone": "Zone A",
            "area": "Sector 5",
            "city": "Mumbai",
            "state": "Maharashtra"
        },
        "_id": "68bea7f17c9ff4dea93ff781",
        "title": "Streetlight not working",
        "description": "Pole near Sector 5 is out.",
        "category": "streetlights",
        "priority": "medium",
        "status": "open",
        "createdBy": {
            "_id": "6899a3135e41c916fb312a6d",
            "firstName": "Shilpa",
            "lastName": "K",
            "email": "shilpa.tribhuwan@gmail.com",
            "fullName": "Shilpa K",
            "id": "6899a3135e41c916fb312a6d"
        },
        "assignedTeams": [
            {
                "_id": "68be6bc76038d70a4c3d071f",
                "name": "Zone A Team Maharashtra",
                "areas": [
                    {
                        "zone": "Zone A",
                        "area": "Sector 5",
                        "city": "Mumbai",
                        "state": "Maharashtra"
                    }
                ],
                "isActive": true
            }
        ],
        "tags": [],
        "attachments": [],
        "adminNotes": [],
        "changeHistory": [
            {
                "field": "assignedTeams",
                "oldValue": [],
                "newValue": [
                    "68be6bc76038d70a4c3d071f"
                ],
                "changedBy": {
                    "_id": "6899a619a576c47c0916ad59",
                    "firstName": "New",
                    "lastName": "Admin",
                    "email": "shubhamtribhuwan017@gmail.com",
                    "fullName": "New Admin",
                    "id": "6899a619a576c47c0916ad59"
                },
                "changeType": "field_update",
                "description": "assignedTeams updated",
                "_id": "68bea95d7c9ff4dea93ff794",
                "changedAt": "2025-09-08T10:01:01.781Z"
            }
        ],
        "createdAt": "2025-09-08T09:54:57.763Z",
        "updatedAt": "2025-09-08T10:01:01.791Z",
        "ticketNumber": "TKT-202509-0001",
        "__v": 1,
        "age": 0,
        "id": "68bea7f17c9ff4dea93ff781"
    }
}



Update Ticket Status (Admin)
Put Call
https://jalnafirst-03821e1b4515.herokuapp.com/api/tickets/admin/689b9c15b51a631d7791f6fe
Payload:
{
  "status": "resolved",                             // Optional
  "resolutionNote": "Issue resolved by clearing app cache", // Optional
  "slaDueDate": "2024-12-18T10:30:00.000Z"         // Optional (ISO date)
}
Response:
{
    "message": "Ticket updated successfully",
    "ticket": {
        "location": {
            "zone": "North",
            "city": "Mumbai",
            "state": "Maharashtra"
        },
        "_id": "689b9c15b51a631d7791f6fe",
        "title": "Login issue with mobile app",
        "description": "I cannot login to the mobile app. It shows an error message.",
        "category": "technical",
        "priority": "high",
        "status": "resolved",
        "createdBy": {
            "_id": "6899a534a576c47c0916ad52",
            "firstName": "Shilpa",
            "lastName": "K",
            "email": "shilpa.tribhuwan06@gmail.com",
            "fullName": "Shilpa K",
            "id": "6899a534a576c47c0916ad52"
        },
        "tags": [
            "mobile",
            "login",
            "urgent"
        ],
        "escalated": false,
        "slaBreached": false,
        "isPublic": false,
        "attachments": [],
        "internalNotes": [],
        "createdAt": "2025-08-12T19:55:01.601Z",
        "updatedAt": "2025-08-12T20:20:54.789Z",
        "ticketNumber": "TKT-202508-0001",
        "__v": 1,
        "adminNotes": [],
        "age": 0,
        "id": "689b9c15b51a631d7791f6fe"
    }
}


Add Additional Note before closing the ticket (Admin)
Post Call
https://social-service-backend-01d8c088884a.herokuapp.com/api/tickets/admin/689b9c15b51a631d7791f6fe/notes
PayLoad:
{
  "note": "User confirmed the issue is resolved. Closing ticket." // Required, max 1000 chars
}
REsponse:
{
    "message": "Admin note added successfully",
    "adminNotes": [
        {
            "note": "User confirmed the issue is resolved. Closing ticket.",
            "addedBy": {
                "_id": "6899a534a576c47c0916ad52",
                "firstName": "Shilpa",
                "lastName": "K",
                "fullName": "Shilpa K",
                "id": "6899a534a576c47c0916ad52"
            },
            "_id": "689ba2ace688299b196ca4bf",
            "addedAt": "2025-08-12T20:23:08.913Z"
        }
    ]
}


### Ticket Categories


- **complaint**: General complaints about service or products
- **support**: Technical support requests
- **bug**: Software bugs or technical issues
- **feature_request**: Requests for new features
- **general**: General inquiries
- **technical**: Technical issues
- **billing**: Billing or payment issues
- **other**: Miscellaneous issues


### Ticket Priorities


- **low**: Minor issues, can be addressed later
- **medium**: Standard issues, normal processing time
- **high**: Important issues, needs attention soon
- **urgent**: Critical issues, immediate attention required


### Ticket Statuses


- **open**: New ticket, not yet processed
- **in_progress**: Ticket is being worked on by admin
- **resolved**: Issue resolved by admin
- **closed**: Ticket closed and archived


### Notes


- Ticket numbers are auto-generated in format: TKT-YYYYMM-XXXX
- Users can only view and modify their own tickets
- Admins can view and manage all tickets
- Admin notes are only visible to admins
- Simple status management: open → in_progress → resolved → closed



Stats
https://social-service-backend-01d8c088884a.herokuapp.com/api/tickets/admin/stats
Response:
{
    "overall": {
        "_id": null,
        "total": 23,
        "open": 18,
        "inProgress": 1,
        "resolved": 1,
        "closed": 3
    },
    "byCategory": [
        {
            "_id": "sanitation",
            "count": 7
        },
        {
            "_id": "feature_request",
            "count": 2
        },
        {
            "_id": "technical",
            "count": 2
        },
        {
            "_id": "streetlights",
            "count": 2
        },
        {
            "_id": "support",
            "count": 2
        },
        {
            "_id": "healthcare",
            "count": 2
        },
        {
            "_id": "bug",
            "count": 2
        },
        {
            "_id": "drainage",
            "count": 1
        },
        {
            "_id": "other",
            "count": 1
        },
        {
            "_id": "billing",
            "count": 1
        },
        {
            "_id": "general",
            "count": 1
        }
    ],
    "byPriority": [
        {
            "_id": "medium",
            "count": 13
        },
        {
            "_id": "high",
            "count": 8
        },
        {
            "_id": "low",
            "count": 2
        }
    ]
}




Get Ticket Categories
Get Call
https://social-service-backend-01d8c088884a.herokuapp.com/api/tickets/categories
Response:
{
    "categories": [
        "sanitation",
        "water_supply",
        "electricity",
        "roads",
        "streetlights",
        "drainage",
        "public_safety",
        "healthcare",
        "education",
        "transport",
        "municipal_services",
        "pollution",
        "encroachment",
        "property_tax_billing",
        "other"
    ]
}


Get Ticket Subcategories
Get Call
http://localhost:5000/api/tickets/subcategories
Response:
{
    "subcategories": {
        "sanitation": [
            "Garbage collection missed",
            "Street sweeping",
            "Public toilet maintenance",
            "Open dumping/overflowing bins"
        ],
        "water_supply": [
            "No water supply",
            "Low pressure",
            "Contaminated/discolored water",
            "Pipeline leakage",
            "Meter issue/billing error"
        ]
    }
}



Change History (Admin Or Creator)
Get Call
https://social-service-backend-01d8c088884a.herokuapp.com/api/tickets/admin/689cc010027cf3d9de3e9cdf/history
https://jalnafirst-03821e1b4515.herokuapp.com/api/tickets/68bea7f17c9ff4dea93ff781/history
Response:
{
    "ticketNumber": "TKT-202509-0001",
    "title": "Streetlight not working",
    "changeHistory": [
        {
            "id": "68c004164870178482e1a6d4",
            "field": "status",
            "oldValue": "open",
            "newValue": "in_progress",
            "changeType": "status_change",
            "description": "Status changed from \"open\" to \"in_progress\"",
            "changedBy": "68be652bb9662cbed3e3a121",
            "changedAt": "2025-09-09T10:40:22.054Z"
        }
    ]
}



Assign team to the ticket(Admin)
Post Call
https://jalnafirst-03821e1b4515.herokuapp.com/api/tickets/admin/68bea7f17c9ff4dea93ff781/assign-teams
Payload:
{
  "teamIds": ["68be6bc76038d70a4c3d071f"],
  "mode": "add" // optional, "add" (default) or "replace"
}
Response:
{
    "message": "Teams assigned successfully",
    "ticket": {
        "location": {
            "coordinates": {
                "latitude": 19.076,
                "longitude": 72.8777
            },
            "zone": "Zone A",
            "area": "Sector 5",
            "city": "Mumbai",
            "state": "Maharashtra"
        },
        "_id": "68bea7f17c9ff4dea93ff781",
        "title": "Streetlight not working",
        "description": "Pole near Sector 5 is out.",
        "category": "streetlights",
        "priority": "medium",
        "status": "open",
        "createdBy": {
            "_id": "6899a3135e41c916fb312a6d",
            "firstName": "Shilpa",
            "lastName": "K",
            "email": "shilpa.tribhuwan@gmail.com",
            "fullName": "Shilpa K",
            "id": "6899a3135e41c916fb312a6d"
        },
        "assignedTeams": [
            {
                "_id": "68be6bc76038d70a4c3d071f",
                "name": "Zone A Team Maharashtra",
                "areas": [
                    {
                        "zone": "Zone A",
                        "area": "Sector 5",
                        "city": "Mumbai",
                        "state": "Maharashtra"
                    }
                ],
                "isActive": true
            }
        ],
        "tags": [],
        "attachments": [],
        "adminNotes": [],
        "changeHistory": [
            {
                "field": "assignedTeams",
                "oldValue": [],
                "newValue": [
                    "68be6bc76038d70a4c3d071f"
                ],
                "changedBy": "6899a619a576c47c0916ad59",
                "changeType": "field_update",
                "description": "assignedTeams updated",
                "_id": "68bea95d7c9ff4dea93ff794",
                "changedAt": "2025-09-08T10:01:01.781Z"
            }
        ],
        "createdAt": "2025-09-08T09:54:57.763Z",
        "updatedAt": "2025-09-08T10:01:01.791Z",
        "ticketNumber": "TKT-202509-0001",
        "__v": 1,
        "age": 0,
        "id": "68bea7f17c9ff4dea93ff781"
    }
}


Mark complete the ticket (For end user)
Post Call
https://jalnafirst-03821e1b4515.herokuapp.com/api/tickets/689c9d0a027cf3d9de3e992f/complete
Response:
{
    "message": "Ticket marked as completed",
    "ticket": {
        "assignedTeams": [],
        "_id": "689c9d0a027cf3d9de3e992f",
        "title": "nnn",
        "description": "mmmm",
        "category": "healthcare",
        "priority": "medium",
        "status": "closed",
        "createdBy": {
            "_id": "6899a3135e41c916fb312a6d",
            "firstName": "Shilpa",
            "lastName": "K",
            "email": "shilpa.tribhuwan@gmail.com",
            "fullName": "Shilpa K",
            "id": "6899a3135e41c916fb312a6d"
        },
        "tags": [],
        "attachments": [],
        "adminNotes": [],
        "createdAt": "2025-08-13T14:11:22.075Z",
        "updatedAt": "2025-09-08T10:07:14.783Z",
        "ticketNumber": "TKT-202508-0016",
        "__v": 1,
        "changeHistory": [
            {
                "field": "status",
                "oldValue": "open",
                "newValue": "closed",
                "changedBy": "6899a3135e41c916fb312a6d",
                "changeType": "status_change",
                "description": "Status changed from \"open\" to \"closed\"",
                "_id": "68beaad23835828e25f24652",
                "changedAt": "2025-09-08T10:07:14.754Z"
            }
        ],
        "age": 25,
        "id": "689c9d0a027cf3d9de3e992f"
    }
}


Upload attachments
Post Call
http://localhost:5000/api/tickets/68bea7f17c9ff4dea93ff781/attachments?mode=add (default)
http://localhost:5000/api/tickets/68bea7f17c9ff4dea93ff781/attachments?mode=replace
Payload:
attachments -> file(jpeg, png, webp, pdf, doc, docx, txt)
Response:
{
    "message": "Attachments uploaded successfully",
    "attachments": [
        {
            "filename": "New Doc.txt",
            "url": "https://res.cloudinary.com/diwickykv/raw/upload/v1757398892/tickets/ahilszbmsmjynxt86xd8",
            "publicId": "tickets/ahilszbmsmjynxt86xd8",
            "size": 14,
            "mimeType": "text/plain",
            "_id": "68bfc76d60c2f5cc3c357a6e"
        }
    ]
}


Get attachments
Get Call
https://jalnafirst-03821e1b4515.herokuapp.com/api/tickets/68bea7f17c9ff4dea93ff781/attachments
Response:
{
    "attachments": [
        {
            "filename": "New Doc.txt",
            "url": "https://res.cloudinary.com/diwickykv/raw/upload/v1757398892/tickets/ahilszbmsmjynxt86xd8",
            "publicId": "tickets/ahilszbmsmjynxt86xd8",
            "size": 14,
            "mimeType": "text/plain",
            "_id": "68bfc76d60c2f5cc3c357a6e"
        }
    ]
}


Delete attachments
Delete Call
http://localhost:5000/api/tickets/68bea7f17c9ff4dea93ff781/attachments/68bfc76d60c2f5cc3c357a6e
Response:
{
    "message": "Attachment deleted successfully",
    "attachments": []
}




Staff & Teams
Create Staff
Post call
https://jalnafirst-03821e1b4515.herokuapp.com/api/staff
Payload:
{
    "firstName":"Staff",
    "lastName":"1",
    "email":"staff1@example.com",
    "Password":"password123",
"phoneNumber":123456


}
Response:
{
    "message": "Staff created successfully",
    "staff": {
        "firstName": "Staff",
        "lastName": "1",
        "email": "staff1@example.com",
        "profilePhoto": null,
        "profilePhotoUrl": null,
        "isEmailVerified": true,
        "isActive": true,
        "isBlocked": false,
        "role": "staff",
        "adminPrivileges": {
            "canManageUsers": false,
            "canManageContent": false,
            "canManageSettings": false,
            "canUploadDocs": false,
            "canEditPhoneNumbers": false
        },
        "profileVisibility": "public",
        "_id": "68be652bb9662cbed3e3a121",
        "preferredLanguage": "en",
        "lastActive": "2025-09-08T05:10:03.485Z",
        "createdAt": "2025-09-08T05:10:03.515Z",
        "updatedAt": "2025-09-08T05:10:03.515Z",
        "plainTextPassword": "password123",
        "__v": 0,
        "fullName": "Staff 1",
        "id": "68be652bb9662cbed3e3a121"
    }
}

Get Staffs
Get Call
https://jalnafirst-03821e1b4515.herokuapp.com/api/staff
https://jalnafirst-03821e1b4515.herokuapp.com/api/staff?page=1&limit=10&search=staff
Response:
{
    "staff": [
        {
            "adminPrivileges": {
                "canManageUsers": false,
                "canManageContent": false,
                "canManageSettings": false,
                "canUploadDocs": false,
                "canEditPhoneNumbers": false
            },
            "_id": "68be652bb9662cbed3e3a121",
            "firstName": "Staff",
            "lastName": "1",
            "email": "staff1@example.com",
            "profilePhoto": null,
            "profilePhotoUrl": null,
            "isEmailVerified": true,
            "isActive": true,
            "isBlocked": false,
            "role": "staff",
            "profileVisibility": "public",
            "preferredLanguage": "en",
            "lastActive": "2025-09-08T05:10:03.485Z",
            "createdAt": "2025-09-08T05:10:03.515Z",
            "updatedAt": "2025-09-08T05:10:03.515Z",
            "__v": 0,
            "fullName": "Staff 1",
            "id": "68be652bb9662cbed3e3a121"
        }
    ],
    "pagination": {
        "currentPage": 1,
        "totalPages": 1,
        "total": 1
    }
}

Edit staff
Put Call
https://jalnafirst-03821e1b4515.herokuapp.com/api/staff/68be652bb9662cbed3e3a121

Get By Id
Get Call
https://jalnafirst-03821e1b4515.herokuapp.com/api/staff/68be652bb9662cbed3e3a121

Create Team
Post Call
https://jalnafirst-03821e1b4515.herokuapp.com/api/teams
Payload:
{
  "name": "Zone A Team Maharashtra",
  "description": "Handles Zone A road complaints",
  "areas": [
    { "zone": "Zone A", "area": "Sector 5", "city": "Mumbai", "state": "Maharashtra" }
  ]
}
Response:
{
    "message": "Team created successfully",
    "team": {
        "name": "Zone A Team Maharashtra",
        "description": "Handles Zone A road complaints",
        "employees": [],
        "areas": [
            {
                "zone": "Zone A",
                "area": "Sector 5",
                "city": "Mumbai",
                "state": "Maharashtra"
            }
        ],
        "isActive": true,
        "addedBy": "6899a619a576c47c0916ad59",
        "lastUpdatedBy": "6899a619a576c47c0916ad59",
        "_id": "68be6bc76038d70a4c3d071f",
        "createdAt": "2025-09-08T05:38:15.606Z",
        "updatedAt": "2025-09-08T05:38:15.606Z",
        "__v": 0
    }
}

Add Staff to the team
Post Call
https://jalnafirst-03821e1b4515.herokuapp.com/api/teams/68be6bc76038d70a4c3d071f/employees
Payload:
{
    "employees": ["68be652bb9662cbed3e3a121"]
}

Response:
{
    "message": "Employees added to team",
    "team": {
        "_id": "68be6bc76038d70a4c3d071f",
        "name": "Zone A Team Maharashtra",
        "description": "Handles Zone A road complaints",
        "employees": [
            {
                "_id": "68be652bb9662cbed3e3a121",
                "firstName": "Staff",
                "lastName": "1",
                "email": "staff1@example.com",
                "role": "staff",
                "fullName": "Staff 1",
                "id": "68be652bb9662cbed3e3a121"
            }
        ],
        "areas": [
            {
                "zone": "Zone A",
                "area": "Sector 5",
                "city": "Mumbai",
                "state": "Maharashtra"
            }
        ],
        "isActive": true,
        "addedBy": "6899a619a576c47c0916ad59",
        "lastUpdatedBy": "6899a619a576c47c0916ad59",
        "createdAt": "2025-09-08T05:38:15.606Z",
        "updatedAt": "2025-09-08T05:42:34.438Z",
        "__v": 1
    }
}

Remove staff from Team
Delete Call
https://jalnafirst-03821e1b4515.herokuapp.com/api/teams/68be6bc76038d70a4c3d071f/employees/68be652bb9662cbed3e3a121


Get All the teams
Get Call
https://jalnafirst-03821e1b4515.herokuapp.com/api/teams?page=1&limit=10&search=zone&zone=Zone%20A&isActive=true
Response:
{
    "teams": [
        {
            "_id": "68be6bc76038d70a4c3d071f",
            "name": "Zone A Team Maharashtra",
            "description": "Handles Zone A road complaints",
            "employees": [
                {
                    "_id": "68be652bb9662cbed3e3a121",
                    "firstName": "Staff",
                    "lastName": "1",
                    "email": "staff1@example.com",
                    "role": "staff",
                    "fullName": "Staff 1",
                    "id": "68be652bb9662cbed3e3a121"
                }
            ],
            "areas": [
                {
                    "zone": "Zone A",
                    "area": "Sector 5",
                    "city": "Mumbai",
                    "state": "Maharashtra"
                }
            ],
            "isActive": true,
            "addedBy": {
                "_id": "6899a619a576c47c0916ad59",
                "firstName": "New",
                "lastName": "Admin",
                "email": "shubhamtribhuwan017@gmail.com",
                "fullName": "New Admin",
                "id": "6899a619a576c47c0916ad59"
            },
            "lastUpdatedBy": {
                "_id": "6899a619a576c47c0916ad59",
                "firstName": "New",
                "lastName": "Admin",
                "email": "shubhamtribhuwan017@gmail.com",
                "fullName": "New Admin",
                "id": "6899a619a576c47c0916ad59"
            },
            "createdAt": "2025-09-08T05:38:15.606Z",
            "updatedAt": "2025-09-08T05:42:34.438Z",
            "__v": 1
        }
    ],
    "pagination": {
        "currentPage": 1,
        "totalPages": 1,
        "total": 1
    }
}


Get Team by Id
Get Call
http://localhost:5000/api/teams/68be6bc76038d70a4c3d071f
Response:
{
    "team": {
        "_id": "68be6bc76038d70a4c3d071f",
        "name": "Zone A Team Maharashtra",
        "description": "Handles Zone A road complaints",
        "employees": [
            {
                "_id": "68bfefb359c469710d385ce2",
                "firstName": "Shubham",
                "lastName": "Tribhuwan",
                "email": "shubham11@gmail.com",
                "role": "staff",
                "fullName": "Shubham Tribhuwan",
                "id": "68bfefb359c469710d385ce2",
                "isLeader": true
            },
            {
                "_id": "68be652bb9662cbed3e3a121",
                "firstName": "Staff",
                "lastName": "1",
                "email": "staff1@example.com",
                "role": "staff",
                "fullName": "Staff 1",
                "id": "68be652bb9662cbed3e3a121",
                "isLeader": false
            }
        ],
        "areas": [
            {
                "zone": "Zone A",
                "area": "Sector 5",
                "city": "Mumbai",
                "state": "Maharashtra"
            }
        ],
        "isActive": true,
        "addedBy": {
            "_id": "6899a619a576c47c0916ad59",
            "firstName": "New",
            "lastName": "Admin",
            "email": "shubhamtribhuwan017@gmail.com",
            "fullName": "New Admin",
            "id": "6899a619a576c47c0916ad59"
        },
        "lastUpdatedBy": {
            "_id": "6899a619a576c47c0916ad59",
            "firstName": "New",
            "lastName": "Admin",
            "email": "shubhamtribhuwan017@gmail.com",
            "fullName": "New Admin",
            "id": "6899a619a576c47c0916ad59"
        },
        "createdAt": "2025-09-08T05:38:15.606Z",
        "updatedAt": "2025-09-09T14:01:43.747Z",
        "__v": 7,
        "leaderId": "68bfefb359c469710d385ce2"
    }
}


Add team leader
Put Call
https://jalnafirst-03821e1b4515.herokuapp.com/api/teams/68be6bc76038d70a4c3d071f/leader
Payload:
{
    "leaderId": "68be652bb9662cbed3e3a121"
}
Response:
{
    "message": "Team leader updated",
    "team": {
        "_id": "68be6bc76038d70a4c3d071f",
        "name": "Zone A Team Maharashtra",
        "description": "Handles Zone A road complaints",
        "employees": [
            {
                "_id": "68be652bb9662cbed3e3a121",
                "firstName": "Staff",
                "lastName": "1",
                "email": "staff1@example.com",
                "role": "staff",
                "fullName": "Staff 1",
                "id": "68be652bb9662cbed3e3a121",
                "isLeader": true
            }
        ],
        "areas": [
            {
                "zone": "Zone A",
                "area": "Sector 5",
                "city": "Mumbai",
                "state": "Maharashtra"
            }
        ],
        "isActive": true,
        "addedBy": {
            "_id": "6899a619a576c47c0916ad59",
            "firstName": "New",
            "lastName": "Admin",
            "email": "shubhamtribhuwan017@gmail.com",
            "fullName": "New Admin",
            "id": "6899a619a576c47c0916ad59"
        },
        "lastUpdatedBy": {
            "_id": "6899a619a576c47c0916ad59",
            "firstName": "New",
            "lastName": "Admin",
            "email": "shubhamtribhuwan017@gmail.com",
            "fullName": "New Admin",
            "id": "6899a619a576c47c0916ad59"
        },
        "createdAt": "2025-09-08T05:38:15.606Z",
        "updatedAt": "2025-09-09T07:53:15.121Z",
        "__v": 1,
        "leaderId": "68be652bb9662cbed3e3a121"
    }
}


Get Tickets with Minimal details(For team)
Get Call
https://jalnafirst-03821e1b4515.herokuapp.com/api/tickets/team/minimal
Response:
{
    "tickets": [
        {
            "id": "68bea7f17c9ff4dea93ff781",
            "description": "Pole near Sector 5 is out.",
            "coordinates": {
                "latitude": 19.076,
                "longitude": 72.8777
            },
            "attachments": [],
            "status": "open",
            "createdAt": "2025-09-08T09:54:57.763Z"
        }
    ],
    "pagination": {
        "currentPage": 1,
        "totalPages": 1,
        "total": 1
    }
}






Update the ticket status (Team)
Put Call
https://jalnafirst-03821e1b4515.herokuapp.com/api/tickets/team/:ticketId/status
Payload
{
  "status": "in_progress" | "pending_user" | "pending_admin" | "resolved"
}


