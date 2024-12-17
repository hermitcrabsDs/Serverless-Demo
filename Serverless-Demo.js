const hubspot = require('@hubspot/api-client');
const axios = require("axios");
const ENROLLMENT_ACCESS_TOKEN = process.env.ENROLLMENT_ACCESS_TOKEN;


const objectType = ;
//const toContactObjectType = "0-1";
//const associationType = "21";

exports.main = async function (req, res) {
   const hubspotClient = new hubspot.Client({"accessToken":"ENROLLMENT_ACCESS_TOKEN"});
//    console.log(req)
   let recordId = req.body.recordId;;
   let course_progress = req.body.course_progress;
   let total_lessons = req.body.total_lessons;
   let lessons_id = req.body.lessons_id;
   let course_name = req.body.course_name;
   let user_name = 
   let findCourseProgressObj = await getExistingCourseProgressObj(recordId);

   let properties;
   //* Updating coures progress Object
   if (findCourseProgressObj.total === 1) {
      console.log("findCourseProgressObj:", findCourseProgressObj.total);
      const properties = {
         course_progress,
         total_lessons,
         lessons_id,
         course_name,
         user_name
      };
      const SimplePublicObjectInput = { properties };
      let objectId = findCourseProgressObj.results[0].id;
      const idProperty = undefined;

      var config = {
         method: 'PATCH',
         url: `https://api.hubapi.com/crm/v3/objects/${objectType}/${objectId}`,
         headers: {
            'Authorization': `Bearer ${ENROLLMENT_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
         },
         data: SimplePublicObjectInput
      };
      
      
      try {
         console.log("SimplePublicObjectInput", SimplePublicObjectInput );
         console.log("before objectId", objectId );
         let apiResponse = await axios(config);
        
         console.log(JSON.stringify(apiResponse.data));
         res({ body: { response: apiResponse.data }, statusCode: 200 });
         
//          res.send({ "result": "Course Progress Updated Successfully" });
//          res({ body: apiResponse.data , statusCode: 200 });
         
      } catch (e) {
         console.error("error 56 ", e.message);
      }
   } else if (findCourseProgressObj.total === 0) {
      // console.log("No record found ", findCourseProgressObj.total);
       res({ body: "No record found " , statusCode: 200 });
   } else {
      // console.log("More than one object found with same data", findCourseProgressObj.total);
   }
};


async function getExistingCourseProgressObj(recordId) {
   // console.log("recordId:", recordId);

   let result = [];
   var data = JSON.stringify({
      "filterGroups": [
         {
            "filters": [
               {
                  "value": parseInt(recordId),
                  "propertyName": "hs_object_id",
                  "operator": "EQ"
               }
            ]
         }
      ],
      "properties": [
         "course_progress",
         "lessons_id",
         "total_lessons"
      ],
      "limit": 10,
      "after": 0
   });

   var config = {
      method: 'post',
      url: `https://api.hubapi.com/crm/v3/objects/${objectType}/search`,
      headers: {
         'Authorization': `Bearer ${ENROLLMENT_ACCESS_TOKEN}`,
         'Content-Type': 'application/json'
      },
      data: data
   };
   try {
      let apiResponse = await axios(config);
      result = await apiResponse.data;
//       console.log("result:", result);
      // // console.log("Number of result found :", result.total);
      if (result.total === 1) {
         return result;
      }
   } catch (error) {
      // // console.log("error ", error);
   }

   return result;

}










const axios = require('axios');
const ENROLLMENT_ACCESS_TOKEN = process.env.ENROLLMENT_ACCESS_TOKEN;
const FormData = require('form-data');
const crypto = require('crypto');
const URL = `https://api.hubapi.com/files/v3/files`;

exports.main = async (context, sendResponse) => {

   var current_Date = new Date();
   var currentdate = Math.floor(current_Date.getTime() / 1000);
   let courseId;
   let toContactId;
   let course_name;
   let urlForImage = context.body.certificationImage;
   courseId = context.body.courseId;
   course_name = context.body.course_name;
   toContactId = context.body.toContactId;
   let userName = context.body.user_name;
   let userImage = context.body.user_image;
   let file_Name = `1517_certification${toContactId}${currentdate}.jpg`;
   let folderId = "116556676677"; //Folder name is 1517_certifications

//    console.log("data image", JSON.stringify(context.body.user_image))
   
   

   const config = {
      headers: {
         'Content-Type': 'application/json',
         'Accept': 'application/json',
         'Authorization': `Bearer ${ENROLLMENT_ACCESS_TOKEN}`,
         "Access-Control-Allow-Origin" : "*",
         "Access-Control-Allow-Credentials" : true
      }
   };


   const form = new FormData();
   const fileB64Arr = urlForImage;
   let b64String = fileB64Arr[1];
   let splitResult = fileB64Arr.split(",")[1]
   let buffer = Buffer.from(splitResult, 'base64');
   


//    sendResponse({ body: { b64String: b64String , buffer: buffer, urlForImage: urlForImage , fileB64Arr: fileB64Arr  }, statusCode: 200 });

   const file_options = {
      access: 'PUBLIC_NOT_INDEXABLE',
      overwrite: false,
      duplicateValidationStrategy: 'NONE',
      duplicateValidationScope: 'EXACT_FOLDER'
   };
   let uploadHeaders = form.getHeaders();
   config.headers = {...config.headers, ...uploadHeaders};
   form.append('file', buffer, file_Name);
   form.append('fileName', `${file_Name}`);
   form.append('options', JSON.stringify(file_options));
   form.append('folderId', '116556676677');



   try {
      let response = await axios.post(URL, form, config);
      const imageData = response.data;
      const imageUrl = imageData.url;
//       console.log("Reso ", JSON.stringify(imageData));

      if (imageUrl) {
         const config = {
            headers: { Authorization: "Bearer " + ENROLLMENT_ACCESS_TOKEN },
         };
         let contactID = toContactId; /// Contact ID
         let courseID = courseId; /// Custom Object Record ID

         const certifications_data = {
            properties: {
               course_name: course_name,
               certificate: imageUrl,
               course_id: courseID,
               user_name: userName,
               user_image: userImage,
               contact_id: contactID,
            },
            associations: [
               {
                  to: {
                     id: contactID,
                  },
                  types: [
                     {
                        associationCategory: "USER_DEFINED",
                        associationTypeId: 95,
                     },
                  ],
               },
            ],
         };

         try{
            let apiResponse = await axios.post(`https://api.hubapi.com/crm/v3/objects/2-14946123`,certifications_data,config);
            const data = apiResponse.data

//             console.log("Inner ", JSON.stringify(imageData));
            sendResponse({ body: { response: apiResponse.data, message: "certificat create successfully" ,b64String: b64String , buffer: buffer, urlForImage: urlForImage , fileB64Arr: fileB64Arr, splitResult: splitResult }, statusCode: 200 });

         }catch(error){
//             console.error("inside error");
            sendResponse({ body: { message: e.message }, statusCode: 500 });
         }
      }
   } catch (error) {
      sendResponse({ body: error.message, statusCode: 500 });
   }

};







