var Client = require('node-rest-client').Client;
const JSEncrypt = require('node-jsencrypt');
var consts = require('./js/consts.js');
// const keytar = require('keytar');
const encrypt = new JSEncrypt();
encrypt.setPublicKey(consts.RSA_PUBLIC_KEY);

var client = new Client();
var jobId = false;

var renewPass = function (_username, _password, school) {
    var username = encrypt.encrypt(_username);
    var password = encrypt.encrypt(_password);

    // set content-type header and data as json in args parameter
    var args = {
        headers: {
            "username": username,
            "password": password,
            "school": school
        }
    };

    client.post(consts.BASE_URL + "/renew", args, function (data, response) {
        // parsed response body as js object
        // console.log(data);
        var responseCode = response.statusCode;
        if (responseCode === 202) {
            updateMessage("UPass is renewing, jobId=" + data.jobId);
            jobId = data.jobId;
            $('#getStatus').prop('disabled', false);
        } else {
            updateMessage("Invalid Encryption key: responseCode=" + responseCode);
        }
    }).on('error', function (err) {
        updateMessage('Something went wrong on the request');
        errorHandler(err.request.options);
    });

};

function getStatus() {
    if (jobId) {
        var args = {
            headers: {
                "id": jobId
            }
        };
        client.get(consts.BASE_URL + "/get", args, function (data, response) {
            var status = data.status;
            if (status === "AUTHENTICATION_ERROR") {
                updateMessage("Please check the credentials");
            } else if (status === "NOTHING_TO_RENEW") {
                updateMessage("Your UPass was already renewed");
            } else if (status === "SCHOOL_NOT_FOUND") {
                updateMessage("Interestingly enough I couldn't find your school")
            } else if (status === "RENEW_SUCCESSFUL") {
                updateMessage("You are all set!");
            } else if (status === "ERROR") {
                updateMessage("Something went wrong here");
            }
        }).on('error', function (err) {
            updateMessage('Something went wrong on the request');
            errorHandler(err.request.options);
        });
    } else {
        updateMessage("You haven't submitted a job");
    }
}

$(document).ready(function () {
    $('#submit').click(function () {
        var username = $('#username').val();
        var password = $('#password').val();
        var school = "UBC";
        if (!username || !password || !school) {
            updateMessage("Enter your credentials");
            return;
        }
        if ($('#remember').is(':checked')) {
            // TODO Persist name,school,password
        }
        updateMessage("Renewing UPass....");
        renewPass(username, password, school);
    });
    $('#getStatus').click(function () {
        getStatus();
    });
});

function updateMessage(message) {
    $("#message").text(message);
}

var errorHandler = function (err) {
    console.log(err)
};
